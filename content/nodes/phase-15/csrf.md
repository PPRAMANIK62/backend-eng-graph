---
id: csrf
title: Cross-site request forgery
depth: short
phase: 15
note: >-
  Another site making the browser send an authenticated request.
needs: [cookies, same-origin-policy, sessions]
leads_to: []
compare_with: [cors, oauth2, ssrf, dns-rebinding]
---

# Cross-site request forgery

Cross-site request forgery (CSRF) is when a page on another site makes
your user's browser send a request to your app, and the browser attaches
the user's [[cookies]] on its own. Your server sees a properly logged-in
request that the user never meant to make. Nearly every app that keeps
users logged in with a cookie needs a defense against it.

## How a forged request works

Say `bank.example` keeps users logged in with a [[sessions|session]] cookie, and has
a form that posts to `/transfer`. A logged-in user visits
`evil.example`, which contains a hidden form:

```html
<form action="https://bank.example/transfer" method="post">
  <input type="hidden" name="to" value="attacker" />
  <input type="hidden" name="amount" value="1000" />
</form>
<script>document.forms[0].submit()</script>
```

![Sequence between the user's browser, evil.example and bank.example. The browser, already holding a bank session cookie, loads a page from evil.example. The page auto-submits a form, and the browser sends POST /transfer to bank.example with the session cookie attached. The bank sees a valid session and moves the money. The attacker never sees the response and doesn't need to.](img/csrf-forged-transfer.svg)

*A forged transfer. The attacker never touches the cookie; the browser adds it.*

The browser sends the POST with the bank's cookie, because it attaches
cookies to requests on its own. The bank checks the session, finds it
valid, and does the transfer.

The [[same-origin-policy]] doesn't help here. It stops `evil.example`
from reading the bank's response, but sending a form to another origin
is allowed. The attacker doesn't need the response; the transfer is the
point. What the attacker can do is limited to what the logged-in user
could do, which for a bank or an admin panel is plenty.

## Telling forged requests apart

All the defenses answer one question: did this state-changing request
come from your own pages, or from somewhere else?

**Keep safe methods safe.** GET, HEAD and OPTIONS must not change
anything (see [[http-semantics]]). Then every defense below can let them
through, and only POST, PUT, PATCH and DELETE need checking.

**Ask the browser where the request came from.** Modern browsers send
a `Sec-Fetch-Site` header saying whether a request is `same-origin`,
`same-site`, `cross-site`, or `none` (typed in or bookmarked). It has
been in all major browsers since 2023. Accept unsafe requests only when
it says `same-origin` or `none`. When it's missing, fall back to the
`Origin` header and compare its host with `Host`. Treat `Origin: null`
as cross-origin. A request with neither header isn't from a modern
browser, so it can't be a forged browser request. Go 1.25 ships exactly
this check as `http.CrossOriginProtection` in `net/http`.

**CSRF tokens.** The older, still common defense: put a large random
token in each form (or a custom header) and check it on the server. The
attacker's page can't read your pages, so it can't learn the token. The
token is either stored in the user's session (the synchronizer pattern)
or sent in a cookie too and compared (double submit). The plain double
submit falls to anyone who can write cookies for your domain, such as a
compromised sibling subdomain, so bind the token to the session with an
HMAC. The cost of tokens is wiring them into every form and every
script that posts.

**SameSite cookies.** A session cookie marked `SameSite=Lax` or
`Strict` isn't sent on unsafe cross-site requests. Use it as a second
layer, not the only one.

## Where it gets tricky

**Same site is not same origin.** `app.example.com` and
`marketing.example.com` are the same site but different origins, and an
old marketing blog can be much easier to break into than your app.
Depending on the definition, `http://app.example.com` also counts as
the same site as the HTTPS one, and anyone on the network can serve
whatever they like over plain HTTP. SameSite cookies protect only
against other sites, so they don't stop an attack from a weak sibling.
`Sec-Fetch-Site` does distinguish origins.

**Lax by default is shakier than it sounds.** Chrome started treating
cookies as `SameSite=Lax` unless told otherwise in 2020. The rollout
broke a lot, single sign-on flows especially, and what browsers ended
up with varies: a laxer mode that still allows some unsafe cross-site
requests, or no protection for the first two minutes after a cookie is
set. Those defaults aren't an effective CSRF defense. Set the attribute
yourself.

**Tokens or headers?** Guides disagree. OWASP's cheat sheet still calls
CSRF tokens essential for cookie-based apps and treats Fetch Metadata as
something to rely on when you target only modern browsers. The analysis
behind Go's middleware makes Fetch Metadata the primary defense:
modern browsers already say whether a request is cross-origin, and the
header check needs no changes to your forms. `Sec-Fetch-Site` is sent only to
HTTPS and localhost targets, so a site served over plain HTTP has to
rely on the fallback.

**CORS is a different thing.** [[cors|CORS]] decides who may read your
responses. CSRF is about who may make you act. A CORS setup doesn't stop
a form post.

**Cross-site scripting defeats all of it.** Script injected into your
own pages runs as your origin, reads your tokens and sends same-origin
requests.

**It's not only cookies.** A forged request can also carry authority
from the user's network position, such as access to an intranet that
the attacker can't reach directly, often with the help of [[dns-rebinding|DNS
rebinding]]. Browsers are tackling that side separately, with Private
Network Access.

## What this means when you build

- Use your framework's CSRF protection before writing your own. In Go
  1.25 and later, wrap handlers in `http.CrossOriginProtection`.
- Never change state on GET.
- Check `Sec-Fetch-Site`, fall back to `Origin`, and reject unsafe
  cross-origin requests. Keep an exact allow-list of full trusted
  origins, like `https://admin.example.com`, and a tightly scoped bypass
  for the odd single sign-on route.
- Set `SameSite=Lax` (or `Strict`) on session cookies as a backup.
- CSRF rides on authority the browser adds by itself. An API called by
  programs rather than browsers, with credentials the caller sets
  explicitly, generally doesn't need CSRF protection. A browser app
  that logs in with a cookie does.

## Further reading

- [Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), OWASP Cheat Sheet Series. Every defense in detail: synchronizer tokens, signed double submit, Fetch Metadata, custom headers, SameSite.
- [Cross-Site Request Forgery](https://words.filippo.io/csrf/), Filippo Valsorda, 2025. Same-site vs same-origin, why each countermeasure falls short, and the Sec-Fetch-Site algorithm behind Go 1.25's `CrossOriginProtection`.

---
id: cors
title: CORS
depth: deep
phase: 15
note: >-
  What CORS actually protects, and what it doesn't.
needs: [same-origin-policy]
leads_to: []
compare_with: [csrf, http-caching]
---

# CORS

Cross-Origin Resource Sharing (CORS) is how your server tells browsers
that pages from another origin may read its responses. It loosens the
[[same-origin-policy]] for reads, per response, through a handful of
HTTP headers. It's also widely misunderstood: CORS doesn't stop requests
from reaching your server, doesn't defend against [[csrf|CSRF]], and
means nothing to a client that isn't a browser.

## The problem it solves

Your frontend lives at `https://app.example.com` and your API at
`https://api.example.com`. Different hosts, so different origins. When
the frontend's script calls `fetch("https://api.example.com/orders")`,
the browser sends the request, but by default it won't hand the
response to the script.

The obvious fix would be "let anyone read anything, just leave the
user's cookies off". That fails because plenty of servers are protected
by where they sit, not by cookies: intranet apps, admin panels, routers,
anything reachable only from inside a network. A page you visit at home
or at work could read them through your browser. The browser can't tell
which responses are private, so the resource itself has to say "you can
read me". HTTP already has a place for metadata about a response: its
headers. That's CORS.

## A simple request

Take the GET above. The browser adds one header saying which origin
the calling page belongs to:

```http
GET /orders HTTP/1.1
Host: api.example.com
Origin: https://app.example.com
```

The server answers as usual, plus a header naming who may read it:

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.example.com
Content-Type: application/json
```

The browser compares `Access-Control-Allow-Origin` with the page's
origin. If it matches, or is `*`, the script gets the response. If it's
missing or different, the script gets a network error. Either way, the
server received the request, ran it and sent a full response. CORS
decided only whether the page could look at it.

Requests like this one go out without asking first. The rules for
which ones qualify are narrow: the method is GET, HEAD or POST, the
only extra headers are a short list of harmless ones (each value at most
128 bytes), and a `Content-Type`, if set, is one of
`application/x-www-form-urlencoded`, `multipart/form-data` or
`text/plain`. That's exactly what an HTML form could always send to any
origin, long before `fetch` existed. Servers already had to cope with
those requests arriving from anywhere, so CORS didn't make them any
worse by letting them through.

## Preflight: asking before sending

Anything a form couldn't send gets checked first. A `PUT`, a
`DELETE`, a JSON body or an `Authorization` header all count. Before the
real request, the browser sends an `OPTIONS` request describing what it
wants to do:

![Sequence between a page at app.example.com in the browser and api.example.com. First the browser sends OPTIONS /orders/42 with Origin, Access-Control-Request-Method: PUT and Access-Control-Request-Headers: content-type, with no cookies. The server replies 204 with Access-Control-Allow-Origin, Allow-Methods, Allow-Headers and Max-Age. The browser caches that answer, then sends the real PUT with the JSON body. The server replies 200 with Access-Control-Allow-Origin, and the browser checks that header again before handing the response to the script.](img/cors-preflight.svg)

*A preflighted PUT. Both the preflight and the real response have to pass the check.*

The preflight carries `Access-Control-Request-Method` and, if needed,
`Access-Control-Request-Headers`. The server answers with the methods
and headers it accepts, plus `Access-Control-Allow-Origin`. A few
details catch people out:

- The preflight response must have an ok status, 200 or 204. If your
  handler for `/orders/42` would return 404 for a missing order, the
  `OPTIONS` answer still has to be 2xx, or the browser never sends the
  real request.
- The preflight never includes cookies, even when the real request
  will.
- `Access-Control-Max-Age` says how many seconds the browser may cache
  the answer. The default is 5 seconds, so without it a client that
  calls less often than that preflights every time. Browsers cap the
  value; in 2021 the caps were 600 seconds in Chrome and 86,400 in
  Firefox.
- The preflight only permits the request. The real response gets its
  own CORS check and needs `Access-Control-Allow-Origin` too.
- Only safelisted response headers are visible to the script. To expose
  others, list them in `Access-Control-Expose-Headers`.

## Credentials: the dangerous part

By default a cross-origin `fetch` sends no cookies at all. The page has
to ask with `credentials: "include"`, and then the rules get stricter:

- `Access-Control-Allow-Origin` must name the exact origin. `*` is
  refused.
- The response must also carry `Access-Control-Allow-Credentials: true`,
  and `true` is case-sensitive.

These rules exist because this is the combination that exposes user
data. A credentialed response is the logged-in view: the user's orders,
messages or API keys. Allowing an origin to read it with credentials
means trusting everything that origin's pages do.

Note what happens with a credentialed GET that qualifies as simple. No
preflight is sent. The request goes out with the cookies, the server
does whatever the GET does, and only then does the browser hide the
response if the headers are missing.

## What CORS doesn't protect

**It doesn't stop requests.** Simple requests reach your server whether
or not you've configured anything. If a POST with a form content type
changes state, CORS won't stop it; that's a CSRF problem with its own
defenses. Even for requests the browser won't share, your server's work
can leak through side channels like timing.

**It doesn't guard your API from anyone but browsers.** `curl`, a
script or another server ignores CORS headers entirely. A missing
`Access-Control-Allow-Origin` doesn't make an endpoint private. If data
can be fetched with `curl` from anywhere on the internet,
`Access-Control-Allow-Origin: *` exposes nothing new, since a
wildcard response is never shared with credentials.

**It doesn't add authentication.** CORS is a relaxation of a browser
rule, not an access control system. Your endpoints still need to check
who's calling and what they may touch ([[bola]] is the classic failure).

## Where it gets tricky

**Reflecting the `Origin` header.** Keeping a list of allowed origins
is work, so some servers copy whatever `Origin` arrives into
`Access-Control-Allow-Origin` and add `Allow-Credentials: true`. Now
every website on the internet can read your users' data through their
browsers.

**Sloppy matching.** Allow-lists built from prefix, suffix or regex
checks let in names they shouldn't. A suffix check for
`example.com` accepts `evilexample.com`; a prefix check for
`https://example.com` accepts `https://example.com.evil.net`.

**Trusting `null`.** Browsers send `Origin: null` from sandboxed
iframes, some redirects and local files. An attacker can produce it on
purpose with a sandboxed iframe, so allowing `null` (often added for
local development) allows anyone.

**Trusting a weak origin.** Every origin you allow is as trusted as
your own frontend. If an allowed subdomain has an XSS hole, the attacker
reads your API through it. If you allow an `http://` origin, anyone on
the network can serve that origin and read your HTTPS API, even if
every cookie is `Secure`.

**Wildcards on internal services.** `Access-Control-Allow-Origin: *`
is safe only for data that's already public. On a service reached only
from inside a network, it turns the browser of anyone inside into a
proxy that any website can use to read it. Resources protected by IP address
or a firewall must not send CORS headers at all.

**Caches.** If `Access-Control-Allow-Origin` depends on the request,
say you echo one of several allowed origins, add `Vary: Origin`.
Otherwise a browser or [[cdn|CDN]] can store the response made for one
origin, or for a non-CORS request with no header at all, and serve it to
another (see [[http-caching]]). If the header is always `*` or always
one fixed origin, send it on every response and skip `Vary`. Popular
storage services have been known to get this wrong.

**`Origin` isn't a CORS flag.** Browsers send `Origin` on every request
whose method isn't GET or HEAD, CORS or not. Don't use its presence to
decide whether something is a CORS request.

**Browsers differ at the edges.** Safari preflights some requests the
spec treats as simple, when certain safelisted headers have unusual
values. Test in more than one browser.

## What this means when you build

- For public, unauthenticated data, send
  `Access-Control-Allow-Origin: *` on every response and be done.
- For anything behind a login, keep an explicit list of full origins
  (`https://app.example.com`), compare exactly, echo the match, add
  `Access-Control-Allow-Credentials: true` and `Vary: Origin`. Never
  reflect arbitrary origins, never allow `null`, never allow `http://`
  origins.
- Answer `OPTIONS` with 2xx for the routes you allow, list the methods
  and headers, and set `Access-Control-Max-Age` so clients don't
  preflight every call.
- Put CORS handling in one place, like middleware or the
  [[api-gateway]], not in each handler.
- Keep your CSRF defense. CORS configuration doesn't replace it.

## Further reading

- [Fetch Living Standard](https://fetch.spec.whatwg.org/), WHATWG. Section 3.3 is the CORS protocol written for server developers: headers, the credentials table, the safe `*` setup and `Vary: Origin`.
- [Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), MDN Web Docs. Worked examples of simple, preflighted and credentialed requests, and why simple requests skip the preflight.
- [How to win at CORS](https://jakearchibald.com/2021/cors/), Jake Archibald, 2021. Why CORS is shaped the way it is, origins vs sites, and the practical rules for caching and preflights.
- [Cross-origin resource sharing (CORS)](https://portswigger.net/web-security/cors), PortSwigger Web Security Academy. The misconfigurations attackers look for: reflected origins, bad matching, `null`, weak subdomains, intranets.

---
id: same-origin-policy
title: The same-origin policy
depth: short
phase: 15
note: >-
  The browser rule that a page from one origin can't read responses from
  another. What CSRF slips past and CORS relaxes.
needs: [http-semantics, cookies]
leads_to: [csrf, cors, dns-rebinding]
compare_with: []
---

# The same-origin policy

The same-origin policy is the browser rule that lets a page send
requests to another origin, and use some of what comes back, but not
read the response itself. It's why a site you visit can't use your
logged-in browser to read your webmail or your company's intranet. On
the server side it explains two things you have to get right:
[[csrf|cross-site request forgery]], which slips through the part the
policy allows, and [[cors|CORS]], which is how your server loosens it on
purpose.

## What counts as an origin

An origin is three things from a URL: the scheme, the host and the
port. Two URLs are same-origin only if all three match. Take a page at
`https://shop.example.com/cart`:

| URL | Same origin? | Why |
|---|---|---|
| `https://shop.example.com/orders` | yes | only the path differs |
| `http://shop.example.com/cart` | no | different scheme |
| `https://shop.example.com:8443/cart` | no | different port |
| `https://api.example.com/cart` | no | different host |

The scheme is there for security. If `http://` and `https://` pages on
the same host shared an origin, an attacker on the network could
tamper with the plain HTTP page and use it to reach into the HTTPS one,
and TLS would protect nothing.

The host is the full name, not just the registered domain, because
trust between names under one domain varies. A university might host
students' pages under one name and its grades system under another;
they shouldn't share privileges just because they share `example.edu`.
Even so, the origin is a rough unit, partly an accident of how browser
security grew over time.

## Send, embed, but don't read

A page from `evil.example` can do three kinds of things with
`bank.example`, and the policy treats them differently:

![A page from evil.example in the user's browser interacts with bank.example in three ways. Sending a form POST: allowed, the request reaches the bank. Embedding an image or script: allowed, the page can show or run it but not see its bytes. Reading a fetch response: the request goes out, but the browser withholds the response from the page's script unless the bank opts in with CORS.](img/same-origin-policy-send-embed-read.svg)

*What a page can do with another origin.*

- **Sending is allowed.** Links, redirects and form submissions go to
  any origin as ordinary [[http-semantics|HTTP requests]]. A browser that blocked them would break hyperlinks, the
  basic feature of the web.
- **Embedding is allowed.** A page can run a script, show an image,
  apply a stylesheet or frame a page from any origin.
- **Reading is blocked.** A script can't read the body of a response
  from another origin, unless that server opts in with CORS.

Embedding still leaks a little. A page can learn the width and height
of an image from another origin, for example. Pages from different origins that want to talk on
purpose use `postMessage`.

The same split applies to the objects a page can touch. A script can
reach into another window's DOM only if both are same-origin.

## Where it gets tricky

**Cookies don't follow origins.** [[cookies|Cookies]] are older than
the origin concept and draw their boundaries differently (the cookies
page covers their scoping rules). Different units of isolation in one
browser are a known source of bugs.

**It stops reads, not requests.** The request in the "read" case still
reaches the server and still runs. If it changes something, the damage
is done even though the attacker never sees the answer. That's the gap
CSRF uses.

**Script inside your origin gets your origin's power.** If an attacker
injects script into one of your pages (cross-site scripting), that
script runs with your origin's full rights, and the policy can't tell it
apart from your own code.

**It leans on DNS.** For plain `http://` URLs, "same host" is only as
trustworthy as the name lookup. HTTPS helps because the certificate has
to match the name too.

**`document.domain` is deprecated.** Pages used to relax the policy by
setting `document.domain` to a parent domain. It's deprecated because
it undermines the policy; don't use it.

## What this means when you build

- The policy is a rule browsers enforce on pages. It protects your
  users' browsers, not your server. A script calling your API directly
  isn't bound by it.
- Don't read "other sites can't read my API" as "other sites can't call
  my API". Cross-origin writes still arrive at your server. Defend
  them with CSRF defenses.
- To let another origin read your responses, configure CORS for
  that origin. Don't reach for workarounds that punch holes elsewhere.
- Host untrusted user content on a separate origin, or serve it with a
  harmless media type (an image type instead of `text/html`), so it
  can't run with your main site's authority.

## Further reading

- [RFC 6454](https://www.rfc-editor.org/rfc/rfc6454), Adam Barth, IETF, 2011. The Web Origin Concept: why origins are scheme, host and port, the send/embed/read rules, and the systemic weak spots (DNS, cookies, ambient authority).
- [Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy), MDN Web Docs. The origin comparison table, cross-origin writes, embeds and reads, and what `document.domain` used to do.

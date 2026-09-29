---
id: cookies
title: Cookies
depth: short
phase: 15
note: >-
  HttpOnly, Secure, SameSite, the __Host- and __Secure- name prefixes,
  and what each stops.
needs: [http-semantics]
leads_to: [sessions, same-origin-policy, csrf]
compare_with: []
---


# Cookies

A cookie is a small name and value that your server asks the browser
to keep and send back on later requests. It's how a stateless protocol
remembers that you logged in. The cookie itself is simple. The security
lives in its attributes, and a cookie without them is readable by
scripts, sent over plain HTTP, and attached to requests other sites
trigger.

## Set once, sent on every request

[[http-semantics|HTTP]] has no memory between requests. Cookies add
one with two headers:

```http
HTTP/1.1 200 OK
Set-Cookie: __Host-sid=k7Pq...; Secure; HttpOnly; SameSite=Lax; Path=/
```

After that, every request the browser makes to your site carries it:

```http
GET /notes HTTP/1.1
Cookie: __Host-sid=k7Pq...
```

The usual value is a random [[sessions|session]] ID the server looks up.
Each `Set-Cookie` is its own header line; they can't be merged with
commas like other headers. A browser ignores a cookie whose name and
value add up to more than 4096 bytes, and the spec caps lifetimes at
about 400 days.

The key fact for security: the browser attaches the cookie
automatically, whoever caused the request. A form on another site, an
image tag, a redirect: if the request goes to your site, the cookie
goes with it. The spec calls this ambient authority. It's the root of
[[csrf]].

## What each attribute stops

**`Secure`**: only sent over HTTPS. It stops a network attacker
reading the cookie. Without it, even a site that only listens on HTTPS
leaks: the attacker can make the browser request `http://` your site,
and the browser sends the cookie in clear text whether or not anything
answers.

**`HttpOnly`**: not visible to JavaScript (`document.cookie` can't
see it). It stops a cross-site scripting bug from *reading* the session
ID and sending it off. It does not stop injected script from *using*
the session: requests that script makes still carry the cookie.
Cross-site scripting itself is a frontend topic and stays out of this
graph.

**`SameSite`**: whether the cookie goes on requests started by another
site.

- `Strict`: only on same-site requests. Following a link from another
  site to yours arrives without the cookie.
- `Lax`: same-site requests, plus top-level navigations with a safe
  method (a plain link, a GET). A cross-site POST form arrives without
  it.
- `None`: always sent. Needs `Secure`.

"Same site" means the same registrable domain and scheme, which is
looser than the [[same-origin-policy|same origin]]:
`app.example.com` and `api.example.com` are same-site.

**`Domain` and `Path`**: which hosts and paths get the cookie. Leave
`Domain` off and the cookie goes only to the host that set it. `Path` is
not a security boundary.

**Name prefixes.** A server can't normally tell which attributes a
cookie was set with, or by whom. The prefixes let the browser enforce it:

- `__Secure-` names are only accepted with `Secure`.
- `__Host-` names are only accepted with `Secure`, `Path=/` and no
  `Domain`. The cookie is locked to exactly one host.

## Where it gets tricky

**Cookies ignore ports, and sometimes schemes.** A service on another
port of the same host can read and write your cookies. Don't run
mutually distrusting services on one host and trust cookies to keep them
apart.

**Subdomains can overwrite each other.** `evil.example.com` can set a
cookie for `example.com` that `app.example.com` will receive and can't
tell from its own. A network attacker can do the same by injecting a
`Set-Cookie` into a plain-HTTP response. `__Host-` is the fix.

**SameSite isn't a full CSRF defense.** `Lax` blocks the classic
cross-site POST, but attackers can still trigger top-level navigations.
Treat SameSite as defense in depth, next to real CSRF protection.

**The default is not something to rely on.** A cookie without
`SameSite` is usually treated as `Lax`. But the spec lets a browser
send such a cookie on cross-site top-level POSTs for a short while after it's
set, for a time the browser chooses (the spec suggests two minutes or
less). Always set it.

**Signing isn't enough.** Encrypting or signing a cookie's value stops
tampering, but a stolen cookie can still be replayed from another
browser.

## What this means when you build

- For a session cookie: `__Host-` name, `Secure`, `HttpOnly`,
  `SameSite=Lax` or `Strict`, `Path=/`, no `Domain`.
- Put only an opaque random ID in it. The data stays on the server.
- Still add CSRF protection for state-changing requests.
- Keep untrusted apps off your cookie's domain and host.

## Further reading

- [Cookies: HTTP State Management Mechanism (draft-ietf-httpbis-rfc6265bis-22)](https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis-22), Mike West and John Wilander (editors), IETF. The spec that replaces RFC 6265: attributes, SameSite, prefixes, and a frank security considerations section.
- [Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies), MDN. A readable tour of the attributes, SameSite values, and third-party cookies.

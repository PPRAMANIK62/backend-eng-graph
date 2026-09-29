---
id: ietf-rfc6265bis-draft
title: "Cookies: HTTP State Management Mechanism (draft-ietf-httpbis-rfc6265bis-22)"
author: Mike West and John Wilander (editors), IETF HTTPBIS working group
url: https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-rfc6265bis-22
kind: spec
primary: true
---

## Summary

The revision of the cookie spec that will obsolete RFC 6265. When read,
draft 22 was in the RFC Editor queue (approved, not yet numbered). It
defines Set-Cookie and Cookie, the attributes (Expires, Max-Age, Domain,
Path, Secure, HttpOnly, SameSite), the `__Secure-` and `__Host-` name
prefixes, and a long security considerations section.

## Key claims

- How cookies work. "To store state, the origin server includes a Set-Cookie header field in an HTTP response. In subsequent requests, the user agent returns a Cookie request header field to the origin server." (3. Overview)
- Replaces RFC 6265. "This document obsoletes [RFC6265]." (1. Introduction)
- Cookies ignore ports. "cookies for a given host are shared across all the ports on that host, even though the usual "same-origin policy" used by web browsers isolates content retrieved via different ports." (1. Introduction)
- Secure limits sending to secure channels. "When a cookie has the Secure attribute, the user agent will include the cookie in an HTTP request only if the request is transmitted over a secure channel" (4.1.2.5 The Secure Attribute)
- HttpOnly hides the cookie from non-HTTP APIs. "the attribute instructs the user agent to omit the cookie when providing access to cookies via non-HTTP APIs." (4.1.2.6 The HttpOnly Attribute)
- SameSite values. "If the value is "Lax", the cookie will be sent with same-site requests, and with "cross-site" top-level navigations" (4.1.2.7 The SameSite Attribute)
- Unknown SameSite values fall back to Lax. "If the "SameSite" attribute's value is something other than these three known keywords, the attribute's value will be subject to a default enforcement mode that is equivalent to "Lax"." (4.1.2.7)
- A server can't tell how a cookie was set; prefixes fix that. "In particular, it is impossible for a server to have confidence that a given cookie was set with a particular set of attributes." (4.1.3 Cookie Name Prefixes)
- `__Host-` means Secure, Path=/, no Domain. "If a cookie's name begins with a case-sensitive match for the string __Host-, then the cookie will have been set with a Secure attribute, a Path attribute with a value of /, and no Domain attribute." (4.1.3.2)
- `__Host-` locks the cookie to one host. "The lack of a Domain attribute ensures that the cookie's host-only-flag is true, locking the cookie to a particular host, rather than allowing it to span subdomains." (4.1.3.2)
- Lax is only partial CSRF defense. "Lax enforcement provides reasonable defense in depth against CSRF attacks that rely on unsafe HTTP methods (like POST), but does not offer a robust defense against CSRF as a general category of attack" (5.6.7.1)
- Lax-allowing-unsafe window for recent cookies without SameSite. "Deployment experience has shown a cookie age of 2 minutes or less to be a reasonable limit." (5.6.7.2)
- Size limit: name plus value over 4096 octets is ignored. "If the sum of the lengths of the name string and the value string is more than 4096 octets, abort this algorithm and ignore the set-cookie-string entirely." (5.6)
- Lifetime cap. "The RECOMMENDED limit is 400 days in the future, but the user agent MAY adjust the limit" (5.5 Cookie Lifetime Limits)
- Cookies are ambient authority, the root of CSRF. "the issue stems from cookies being a form of ambient authority." (8.2 Ambient Authority)
- Protection must be asked for. "This means that a cookie needs to explicitly specify any protective attributes." (8.1 Overview)
- Without Secure, an attacker can force a plain-HTTP request that carries the cookie. "Even if the webmail server is not listening for HTTP connections, the user agent will still include cookies in the request." (8.3 Clear Text)
- Signing doesn't stop replay. "However, encrypting and signing cookie contents does not prevent an attacker from transplanting a cookie from one user agent to another or from replaying the cookie at a later time." (8.3 Clear Text)
- Session identifiers limit damage. "Instead of storing session information directly in a cookie (where it might be exposed to or replayed by an attacker), servers commonly store a nonce (or "session identifier") in a cookie." (8.4 Session Identifiers)
- A single nonce also stops splicing. "Furthermore, using a single nonce prevents an attacker from "splicing" together cookie content from two interactions with the server, which could cause the server to behave unexpectedly." (8.4 Session Identifiers)
- Session fixation in three steps. "First, the attacker transplants a session identifier from his or her user agent to the victim's user agent." (8.4 Session Identifiers)
- A sibling subdomain can set cookies for another. "Cookies do not provide integrity guarantees for sibling domains (and their subdomains)." (8.6 Weak Integrity)
- A network attacker can inject cookies into an HTTPS site via HTTP. "The HTTPS server at site.example will be unable to distinguish these cookies from cookies that it set itself in an HTTPS response." (8.6 Weak Integrity)
- Don't rely on cookies staying. "Servers SHOULD NOT rely upon user agents retaining cookies." (8.6 Weak Integrity)
- SameSite is defense in depth. "Developers are strongly encouraged to deploy the usual server-side defenses (CSRF tokens, ensuring that "safe" HTTP methods are idempotent, etc) to mitigate the risk more fully." (8.8.1 Defense in depth)
- Strict can break links from elsewhere; two cookies (read with Lax, write with Strict) solve it. "Developers can avoid this confusion by adopting a session management system that relies on not one, but two cookies: one conceptually granting "read" access, another granting "write" access." (8.8.2 Top-level Navigations)
- Set-Cookie headers can't be folded together. "Origin servers and intermediaries MUST NOT combine multiple Set-Cookie header fields into a single header field." (3. Overview)
- No isolation by port. "Cookies do not provide isolation by port." (8.5 Weak Confidentiality)
- No isolation by scheme either. "Cookies do not provide isolation by scheme." (8.5 Weak Confidentiality)
- Browsers attach cookies to requests other parties trigger. "When issuing those requests, user agents attach cookies even if the remote party does not know the contents of the cookies, potentially letting the remote party exercise authority at an unwary server." (8.2 Ambient Authority)
- Lax can be worked around with top-level navigations. "Attackers can still pop up new windows or trigger top-level navigations in order to create a "same-site" request" (5.6.7.1)
- Strict: same-site only. "If the "SameSite" attribute's value is "Strict", the cookie will only be sent along with "same-site" requests." (4.1.2.7)
- Strict skips cross-site top-level navigations. "Same-site cookies in "Strict" enforcement mode will not be sent along with top-level navigations which are triggered from a cross-site document context." (5.6.7.1)
- Lax's exception is top-level navigations with a safe method. "sends same-site cookies along with cross-site requests if and only if they are top-level navigations which use a "safe" (in the [ HTTP ] sense) HTTP method." (5.6.7.1)
- The short-lived laxer default is up to the browser. "The cookie's same-site-flag is "Default" and the amount of time elapsed since the cookie's creation-time is at most a duration of the user agent's choosing." (5.6.7.2)
- No Domain attribute means host only. "If the server omits the Domain attribute, the user agent will return the cookie only to the origin server." (4.1.2.3 The Domain Attribute)
- `__Secure-` requires Secure. "If a cookie's name begins with a case-sensitive match for the string __Secure- , then the cookie will have been set with a Secure attribute." (4.1.3.1)
- HttpOnly still lets the cookie ride on HTTP requests. "The HttpOnly attribute limits the scope of the cookie to HTTP requests." (4.1.2.6)

## Visuals worth redrawing

None.

## My notes

- Will become an RFC; when it gets a number, update this note and the
  url.

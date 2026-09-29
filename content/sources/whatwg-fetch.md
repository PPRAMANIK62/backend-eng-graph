---
id: whatwg-fetch
title: Fetch Living Standard
author: WHATWG (Anne van Kesteren, editor)
url: https://fetch.spec.whatwg.org/
kind: spec
primary: true
---

## Summary

The WHATWG standard for how browsers fetch anything, and the current
home of the CORS protocol (section 3.3), the Origin header (3.2) and the
CORS-safelisted methods and headers. A living standard; this note
reflects the version opened. Section 3.3 is written for server
developers.

## Key claims

- CORS exists so responses can declare they may be shared cross-origin. "It is layered on top of HTTP and allows responses to declare they can be shared with other origins." (3.3)
- It has to be opt-in, because of intranets and credentials. "It needs to be an opt-in mechanism to prevent leaking data from responses behind a firewall (intranets)." (3.3)
- Preflights are for requests beyond what a form can send. "For requests that are more involved than what is possible with HTML’s form element, a CORS-preflight request is performed, to ensure request’s current URL supports the CORS protocol." (3.3.1)
- A preflight is an OPTIONS request with Access-Control-Request-Method, and maybe Access-Control-Request-Headers. "It uses `OPTIONS` as method and includes the following header:" (3.3.2)
- Origin is also sent on every request whose method isn't GET or HEAD, so its presence doesn't mean CORS. "It cannot be reliably identified as participating in the CORS protocol as the `Origin` header is also included for all requests whose method is neither `GET` nor `HEAD`." (3.3.2)
- Access-Control-Allow-Origin is either the request's Origin (which can be null) or `*`. "via returning the literal value of the `Origin` request header (which can be `null`) or `*` in a response." (3.3.3)
- Preflight results cache for Access-Control-Max-Age seconds, 5 by default. "Indicates the number of seconds (5 by default) the information provided by the `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` headers can be cached." (3.3.3)
- A browser may cap max-age. "If max-age is greater than an imposed limit on max-age, then set max-age to the imposed limit." (4.9, CORS-preflight fetch, step 10)
- A preflight response needs an ok status. "A successful HTTP response to a CORS-preflight request is similar, except it is restricted to an ok status, e.g., 200 or 204." (3.3.3)
- Work done by the server can leak through side channels even if the response isn't shared. "Be aware that any work the server performs might nonetheless leak through side channels, such as timing." (3.3.3)
- A preflight never carries credentials. "Note that even so, a CORS-preflight request never includes credentials." (3.3.5)
- Sharing responses and allowing credentialed requests is risky. "Generally speaking, both sharing responses and allowing requests with credentials is rather unsafe, and extreme care has to be taken to avoid the confused deputy problem." (3.3.5)
- With credentials, `*` is not allowed. "If credentials mode is "include", then `Access-Control-Allow-Origin` cannot be `*`." (3.3.5 table)
- `true` is case-sensitive, and a serialized origin has no trailing slash. "`true` is (byte) case-sensitive." / "A serialized origin has no trailing slash." (3.3.5 table)
- Response headers beyond the safelist must be listed in Access-Control-Expose-Headers. "bar.invalid needs to explicitly share each header by listing their names in the `Access-Control-Expose-Headers` response header." (3.3.6)
- Safelisted methods are GET, HEAD and POST. "A CORS-safelisted method is a method that is `GET`, `HEAD`, or `POST`." (2.2.1)
- Safelisted Content-Type values are the three a form can send. "If mimeType’s essence is not "application/x-www-form-urlencoded", "multipart/form-data", or "text/plain", then return false." (2.2.2, CORS-safelisted request-header)
- Safelisted header values are limited to 128 bytes. "If value’s length is greater than 128, then return false." (2.2.2)
- Resources protected only by IP address or a firewall must not use CORS at all. "For resources where data is protected through IP authentication or a firewall (unfortunately relatively common still), using the CORS protocol is unsafe." (Basic safe CORS protocol setup)
- Otherwise `Access-Control-Allow-Origin: *` is safe, because it never reveals cookie-authenticated data. "Even if a resource exposes additional information based on cookie or HTTP authentication, using the above header will not reveal it." (Basic safe CORS protocol setup)
- The rule of thumb is curl. "Thus in other words, if a resource cannot be accessed from a random device connected to the web using curl and wget the aforementioned header is not to be included." (Basic safe CORS protocol setup)
- Use `Vary: Origin` when the header depends on the request. "If CORS protocol requirements are more complicated than setting `Access-Control-Allow-Origin` to * or a static origin, `Vary` is to be used." (CORS protocol and HTTP caches)
- Fetch supersedes RFC 6454's Origin header semantics. "To do so it also supersedes the HTTP `Origin` header semantics originally defined in The Web Origin Concept." (Using fetch in other standards, Goals)
- A failed CORS check is a network error. "makes the request a CORS request — in which case, fetch will return a network error if the requested resource does not understand the CORS protocol, or if the requested resource is one that intentionally does not participate in the CORS protocol." (Requests, definition of response tainting "cors")

## Visuals worth redrawing

- The credentials table in 3.3.5 (credentials mode, ACAO, ACAC,
  shared?) works as a small figure.

## My notes

- Section numbers for 2.2.x and 4.9 are from the page's structure when
  opened; living standards renumber.

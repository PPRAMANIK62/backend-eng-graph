---
id: mdn-cors
title: Cross-Origin Resource Sharing (CORS)
author: MDN Web Docs (Mozilla and contributors)
url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
kind: docs
primary: false
---

## Summary

MDN's guide to CORS: what it is, simple requests vs preflighted ones,
full example exchanges, credentialed requests, and each header.

## Key claims

- CORS lets a server name other origins a browser may load from. "Cross-Origin Resource Sharing (CORS) is an HTTP-header based mechanism that allows a server to indicate any origins (domain, scheme, or port) other than its own from which a browser should permit loading resources." (intro)
- Why simple requests skip the preflight: forms could always send them. "The motivation is that the <form> element from HTML 4.0 (which predates cross-site fetch() and XMLHttpRequest) can submit simple requests to any origin, so anyone writing a server must already be protecting against cross-site request forgery (CSRF)." (Simple requests)
- "Simple request" is a term from the obsolete CORS spec. "Those are called simple requests from the obsolete CORS spec, though the Fetch spec (which now defines CORS) doesn't use that term." (Simple requests)
- Safari may preflight more than the spec says, for nonstandard Accept and language header values. "If any of those headers have "nonstandard" values, WebKit/Safari does not consider the request to be a "simple request"." (Simple requests, note)
- Preflighted requests ask first with OPTIONS. "Unlike simple requests, for "preflighted" requests the browser first sends an HTTP request using the OPTIONS method to the resource on the other origin, in order to determine if the actual request is safe to send." (Preflighted requests)
- An Authorization header triggers a preflight. "if the request is one that triggers a preflight due to the presence of the Authorization header in the request" (Preflighted requests and redirects)
- Max-age default is 5 seconds, and each browser has its own cap. "Note that each browser has a maximum internal value that takes precedence when the Access-Control-Max-Age exceeds it." (Preflighted requests)
- Cross-origin fetch doesn't send credentials unless asked. "By default, in cross-origin fetch() or XMLHttpRequest calls, browsers will not send credentials." (Requests with credentials)
- A credentialed simple GET isn't preflighted; the browser just hides the response if the headers are missing. "Since this is a simple GET request, it is not preflighted but the browser will reject any response that does not have the Access-Control-Allow-Credentials header set to true, and not make the response available to the invoking web content." (Requests with credentials)
- Preflights never include credentials. "CORS-preflight requests must never include credentials." (Preflight requests and credentials)

## Visuals worth redrawing

- The simple request and preflighted request sequence diagrams
  (Simple requests, Preflighted requests).

## My notes

- Doesn't give the per-browser max-age caps; Archibald's post
  (archibald-cors-2021) does, for 2021 browsers.

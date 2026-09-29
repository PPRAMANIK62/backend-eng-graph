---
id: mdn-same-origin-policy
title: Same-origin policy
author: MDN Web Docs (Mozilla and contributors)
url: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
kind: docs
primary: false
---

## Summary

MDN's reference on the same-origin policy: the origin tuple with an
example table, inherited and file origins, the deprecated
document.domain, the three kinds of cross-origin network access
(writes, embeds, reads), and cross-origin storage.

## Key claims

- What it stops: a malicious site reading your webmail or an intranet through your browser. "it prevents a malicious website on the Internet from running JS in a browser to read data from a third-party webmail service (which the user is signed into) or a company intranet" (intro)
- Same origin means same protocol, port and host. "Two URLs have the same origin if the protocol, port (if specified), and host are the same for both." (Definition of an origin)
- Example: `https://store.company.com` differs from `http://store.company.com` by protocol; `:81` differs by port; `news.company.com` by host. (Definition of an origin, table)
- document.domain is deprecated. "The approach described here (using the document.domain setter) is deprecated because it undermines the security protections provided by the same origin policy" (Changing origin)
- Cross-origin writes are usually allowed. "Cross-origin writes are typically allowed. Examples are links, redirects, and form submissions." (Cross-origin network access)
- Embedding is usually allowed. "Cross-origin embedding is typically allowed." (Cross-origin network access)
- Reads are usually blocked, but embedding leaks some. "Cross-origin reads are typically disallowed, but read access is often leaked by embedding." (Cross-origin network access)
- CORS is how you allow cross-origin access. "Use CORS to allow cross-origin access." (How to allow cross-origin access)
- Blocking cross-origin writes takes a CSRF token. "To prevent cross-origin writes, check an unguessable token in the request — known as a Cross-Site Request Forgery (CSRF) token." (How to block cross-origin access)
- Pages from different origins talk with postMessage. "To communicate between documents from different origins, use window.postMessage." (Cross-origin script API access)
- Frames are embedding too. "Anything embedded by <iframe>. Sites can use the X-Frame-Options header to prevent cross-origin framing." (Cross-origin network access, examples of embedding)

## Visuals worth redrawing

- The origin comparison table (Definition of an origin).

## My notes

- Secondary, but it lays out the write/embed/read split more plainly
  than RFC 6454.

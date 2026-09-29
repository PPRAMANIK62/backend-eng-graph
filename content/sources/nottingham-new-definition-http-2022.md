---
id: nottingham-new-definition-http-2022
title: A New Definition of HTTP
author: Mark Nottingham
url: https://www.mnot.net/blog/2022/06/06/http-core
kind: blog
primary: true
---

## Summary

A 2022 post by one of the editors on why HTTP was re-specified as three
documents: version-independent semantics (RFC 9110), caching (RFC
9111), and the HTTP/1.1 wire format (RFC 9112), replacing RFCs 7230 to
7235.

## Key claims

- Methods and status codes mean the same in every version. "For example, methods and status codes mean the same thing no matter what version of the protocol you use; with a few exceptions, the same can be said about header fields." (Why?)
- RFC 7231 had mixed semantics with HTTP/1.1 details. "However, RFC 7231 entangled the definition of these core semantics with the specifics of HTTP/1.1." (Why?)
- The three documents. "That led us to rearrange HTTP into three documents:" (Why?)
- Over 475 issues were addressed. "Beyond the refactoring described above, we also were able to address over 475 issues." (What’s changed?)
- Field names got their own registry. "HTTP field names now have their own registry to make them easier to track down." (What’s changed?)
- RFC numbers only name a version of the documents. "That means that you shouldn’t bother remembering the RFC numbers of the documents above; they only identify a version of the documents." (Will there be another revision?)

## Visuals worth redrawing

None.

## My notes

- Useful for "what changed": tutorials still cite RFC 2616 or 7230-7235.

---
id: grpc-web-protocol
title: gRPC Web (PROTOCOL-WEB.md)
author: gRPC authors
url: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-WEB.md
kind: spec
primary: true
---

## Summary

How gRPC-Web differs from native gRPC. Browsers don't let JavaScript
drive HTTP/2 frames or read trailers directly, so gRPC-Web moves the
trailers into the body and is meant to sit behind a translating proxy.

## Key claims

- Browsers need a different protocol. "Due to browser limitation, the Web client library implements a different protocol than the [native gRPC protocol](PROTOCOL-HTTP2.md)." (Introduction)
- The expected setup is a proxy translating between the two. "This protocol is designed to make it easy for a proxy to translate between the protocols as this is the most likely deployment model." (Introduction)
- Browsers don't expose HTTP/2 framing. "decouple from HTTP/2 framing which is not, and will never be, directly exposed by browsers" (Design goals)
- Works over any HTTP version. "support any HTTP/*, with no dependency on HTTP/2 specific framing" (HTTP wire protocols)
- Trailers become the last length-prefixed message, marked by the top bit of the flag byte. "Trailers must be the last message of the response" (Protocol differences, message framing)

## Visuals worth redrawing

None.

## My notes

- The doc expected gRPC-Web to "become optional (in 1-2 years)" once
  browsers could speak native gRPC through the streams API. The page
  gives no date and doesn't say whether that happened; not checked.

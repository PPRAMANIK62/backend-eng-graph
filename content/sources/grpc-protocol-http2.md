---
id: grpc-protocol-http2
title: gRPC over HTTP2 (PROTOCOL-HTTP2.md)
author: gRPC authors
url: https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
kind: spec
primary: true
---

## Summary

The spec for gRPC's wire protocol, kept in the grpc/grpc repository
(read from the master branch when this was written). It says exactly
which HTTP/2 headers, DATA frames and trailers a call uses, how each
message is framed, how errors and deadlines travel, and how HTTP/2
stream errors map to gRPC status codes.

## Key claims

- A request is headers, zero or more length-prefixed messages, then end of stream. "Request → Request-Headers \*Length-Prefixed-Message EOS" (Outline)
- A response is headers, messages, then trailers, or trailers alone. "Response → (Response-Headers \*Length-Prefixed-Message Trailers) / Trailers-Only" (Outline)
- The method is always POST and the path is service then method. ":method POST" and ":path" "/" Service-Name "/" {_method name_} (Requests)
- The `te: trailers` header is there to catch proxies that can't pass trailers. "Used to detect incompatible proxies" (Requests, TE)
- The timeout travels as `grpc-timeout`: at most 8 digits and a one-letter unit. "positive integer as ASCII string of at most 8 digits" (Requests, TimeoutValue); units H, M, S, m, u, n.
- No timeout means the server should assume infinite. "If **Timeout** is omitted a server should assume an infinite timeout." (Requests)
- Each message is a 1-byte compressed flag, a 4-byte big-endian length, and the bytes. "encoded as 4 byte unsigned integer (big endian)" (Requests, Message-Length)
- The status goes in trailers even when the call worked. "Status must be sent in **Trailers** even if the status code is OK." (Responses)
- The HTTP status is 200 even for gRPC errors; a non-gRPC content type gets a 415 so other HTTP/2 clients don't read an error as success. "This will prevent other HTTP/2 clients from interpreting a gRPC error response, which uses status 200 (OK), as successful." (Requests)
- A response can be trailers only when the call fails right away. "**Trailers-Only** is permitted for calls that produce an immediate error." (Responses)
- Binary metadata values are base64 on the wire, marked by a `-bin` suffix. "Applications define binary headers by having their names end with \"-bin\"." (Requests)
- Each call is one HTTP/2 stream. "We will use HTTP2 stream-ids as call identifiers in this scheme." (Stream Identification)
- DATA frame boundaries don't line up with message boundaries. "DATA frame boundaries have no relation to **Length-Prefixed-Message** boundaries and implementations should make no assumptions about their alignment." (Data Frames)
- Calls aren't assumed idempotent; one that can't be proven to have started isn't retried. "Calls that cannot be proven to have started will not be retried." (Idempotency and Retries)
- RST_STREAM with REFUSED_STREAM maps to UNAVAILABLE and means nothing was processed. "Indicates that no processing occurred and the request can be retried, possibly elsewhere." (Errors table)
- GOAWAY carries the last accepted stream; later streams are UNAVAILABLE and can go elsewhere. "Clients should consider any stream initiated after the last successfully accepted stream as UNAVAILABLE and retry the call elsewhere." (GOAWAY Frame)
- A client-side connection failure closes all calls with UNAVAILABLE. "If a detectable connection failure occurs on the client all calls will be closed with an UNAVAILABLE status." (Connection failure)
- Example unary call: HEADERS with `:path = /google.pubsub.v2.PublisherService/CreateTopic`, `grpc-timeout = 1S`; one DATA frame with END_STREAM; response HEADERS, DATA, then HEADERS with `grpc-status = 0` and END_STREAM. (Example)

Added for `grpc` audit:

- The content type starts with application/grpc. "If **Content-Type** does not begin with "application/grpc", gRPC servers SHOULD respond with HTTP status of 415 (Unsupported Media Type)." (Requests)

## Visuals worth redrawing

- The example unary call as frames on one stream: request HEADERS, DATA; response HEADERS, DATA, trailing HEADERS. (Example)

## My notes

- Pairs with RFC 9113 for what HEADERS, DATA, trailers, RST_STREAM and
  GOAWAY are.

---
id: grpc-core-concepts
title: Core concepts, architecture and lifecycle
author: gRPC authors
url: https://grpc.io/docs/what-is-grpc/core-concepts/
kind: docs
primary: true
---

## Summary

gRPC's own introduction to its model: services defined in protobuf, the
four kinds of method, what happens during a call, deadlines,
cancellation, metadata and channels. Page last modified in 2026.

## Key claims

- Protobuf is the default interface definition language, but others are possible. "By default, gRPC uses protocol buffers as the Interface Definition Language (IDL) for describing both the service interface and the structure of the payload messages." (Service definition)
- Four kinds of method: unary, server streaming, client streaming, bidirectional streaming. "gRPC lets you define four kinds of service method:" (Service definition)
- Message order is kept within one call. "gRPC guarantees message ordering within an individual RPC call." (Service definition)
- In bidirectional streaming the two directions are independent. "The two streams operate independently, so clients and servers can read and write in whatever order they like" (Service definition)
- Code is generated from the .proto: a stub on the client, a service to implement on the server. "the client has a local object known as stub (for some languages, the preferred term is client) that implements the same methods as the service." (Using the API)
- Server learns of the call with metadata, method name and deadline; it answers with a response, status code and trailing metadata. (RPC life cycle, Unary RPC)
- Client and server decide success separately and can disagree. "both the client and server make independent and local determinations of the success of the call, and their conclusions may not match." (RPC termination)
- Cancelling doesn't undo work already done. "Changes made before a cancellation are not rolled back." (Cancelling an RPC)
- Metadata keys ending in `-bin` carry binary values; keys starting with `grpc-` are reserved. "Binary-valued keys end in -bin while ASCII-valued keys do not." (Metadata)
- A channel is a connection to a server host and port, with state such as connected and idle. "A gRPC channel provides a connection to a gRPC server on a specified host and port." (Channels)

## Visuals worth redrawing

None.

## My notes

- "Synchronous vs. asynchronous": blocking calls are the closest to a
  local procedure call, but networks are asynchronous. Useful framing.

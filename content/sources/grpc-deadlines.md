---
id: grpc-deadlines
title: Deadlines (gRPC guide)
author: gRPC authors
url: https://grpc.io/docs/guides/deadlines/
kind: docs
primary: true
---

## Summary

How gRPC deadlines work on the client, on the server, and when a server
calls another server. Page last modified in 2025.

## Key claims

- A deadline is a point in time; a timeout is a duration; they convert by adding the current time. "A timeout can be converted to a deadline by adding the timeout to the current time when the application starts a call." (Overview)
- gRPC sets no deadline by default. "By default, gRPC does not set a deadline which means it is possible for a client to end up waiting for a response effectively forever." (Deadlines on the Client)
- Past the deadline the client fails the call with DEADLINE_EXCEEDED. (Deadlines on the Client)
- The server cancels the call when the deadline passes, but the app must stop its own work. "Please note that the server application is responsible for stopping any activity it has spawned to service the RPC." (Deadlines on the Server)
- Propagation to outgoing calls is on by default in Java and Go and must be enabled in C++. "In some languages this behavior needs to be explicitly enabled (e.g. C++) and in others it is enabled by default (e.g. Java and Go)." (Deadline Propagation)
- To avoid clock skew, the deadline is sent as a remaining timeout. "To address this gRPC converts the deadline to a timeout from which the already elapsed time is already deducted." (Deadline Propagation)
- Example: a client gives 2 s; the user server spends 0.5 s and calls billing with a 1.5 s timeout; when time's up all three cancel. (Deadline Propagation, sequence diagram)

## Visuals worth redrawing

- The client → user server → billing server sequence with the shrinking budget. (Deadline Propagation)

## My notes

- Phase 13's deadline propagation node will lean on this.

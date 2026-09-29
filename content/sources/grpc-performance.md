---
id: grpc-performance
title: Performance Best Practices (gRPC guide)
author: gRPC authors
url: https://grpc.io/docs/guides/performance/
kind: docs
primary: true
---

## Summary

gRPC's general and per-language performance advice. The general part
covers reusing channels, when to use streams, and what happens when a
connection hits its limit on concurrent streams. Page last modified in
2024.

## Key claims

- A channel holds zero or more HTTP/2 connections. "Each gRPC channel uses 0 or more HTTP/2 connections and each connection usually has a limit on the number of concurrent streams." (General, special topic)
- Reuse stubs and channels. "Always re-use stubs and channels when possible." (General)
- Streams avoid per-call setup, but can't be rebalanced once started. "Streams, however, cannot be load balanced once they have started and can be hard to debug for stream failures." (General)
- Use streams only when they give a real benefit. "Use streams to optimize the application, not gRPC." (General)
- Each connection has a limit on concurrent streams; calls past it queue in the client. "When the number of active RPCs on the connection reaches this limit, additional RPCs are queued in the client and must wait for active RPCs to finish before they are sent." (General, special topic)
- Workarounds: a separate channel per high-load area, or a pool of channels. "Use a pool of gRPC channels to distribute RPCs over multiple connections" (General, special topic)

## Visuals worth redrawing

None.

## My notes

- The page says the gRPC team plans a fix (grpc/grpc#21386); the
  channel pool is described as a temporary workaround.

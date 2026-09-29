---
id: morgan-grpc-lb-kubernetes-2018
title: gRPC Load Balancing on Kubernetes without Tears
author: William Morgan (Buoyant)
url: https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/
kind: blog
primary: false
---

## Summary

Why a connection-level (L4) load balancer doesn't spread gRPC traffic:
HTTP/2 puts every call on one long-lived connection, so all calls land
on whichever backend got the connection. Written by someone from Buoyant, the company behind Linkerd, so the
fix it favors is a proxy, but it lists the other options too. 2018.

## Key claims

- HTTP/2 multiplexes everything on one long-lived connection, which breaks connection-level balancing. "gRPC also breaks the standard connection-level load balancing, including what's provided by Kubernetes." (Why does gRPC need special load balancing?)
- Once the connection exists, there's nothing left to balance. "All requests will get pinned to a single destination pod" (Why does gRPC need special load balancing?)
- HTTP/1.1 escapes this because one request at a time per connection forces many connections, and they cycle. "These two factors combined mean that HTTP/1.1 requests typically cycle across multiple TCP connections, and so connection-level balancing works." (Why doesn't this affect HTTP/1.1?)
- The fix is to balance requests instead of connections: one HTTP/2 connection to each backend. "we need to open an HTTP/2 connection to each destination, and balance requests across these connections" (So how do we load balance gRPC?)
- Options: the client keeps its own pool of backends, a headless service with many DNS A records, or a proxy (L7). (So how do we load balance gRPC?)

## Visuals worth redrawing

- Before and after: all calls pinned to one pod vs spread across pods. (Figures in the first and third sections)

## My notes

- Vendor post; used only for the pinning mechanism, which matches
  what the gRPC performance guide says about streams.

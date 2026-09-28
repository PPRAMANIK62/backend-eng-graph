---
id: grpc-keepalive
title: Keepalive (gRPC guide)
author: gRPC authors
url: https://grpc.io/docs/guides/keepalive/
kind: docs
primary: true
---

## Summary

gRPC's guide to its HTTP/2 PING-based keepalive: an application-level
heartbeat that runs over the HTTP/2 connection instead of in the
kernel. Lists the settings and defaults, the server-side limits, and
how it relates to TCP_USER_TIMEOUT. Page last modified in 2025.

## Key claims

- The keepalive is a periodic HTTP/2 PING frame. "This is done by periodically sending a PING frame to the other end of the connection." (Overview)
- Keepalive is about the connection, not whether the service is healthy. "Health checking allows a server to signal whether a service is healthy while keepalive is only about the connection." (Overview, note)
- Since the transport is reliable, interval and retry count become one timeout. "The interval and retry in TCP keepalive don’t quite apply to PING because the transport is reliable, so they’re replaced with timeout (equivalent to interval * retry)" (Background)
- Servers may refuse frequent pings and close with GOAWAY too_many_pings. "the server will eventually send a GOAWAY message with debug data equal to the ASCII code for too_many_pings" (Background, note)
- Don't set client keepalive much below a minute. "it is recommended to avoid enabling keepalive without calls and for clients to avoid configuring their keepalive much below one minute." (How configuring keepalive affects a call, warning)
- Useful when a proxy or load balancer might consider the connection idle. "When sending data over a long-lived connection which might be considered as idle by proxy or load balancers." (Common situations)
- Defaults: KEEPALIVE_TIME disabled on the client, 2 hours on the server; KEEPALIVE_TIMEOUT 20 s; PERMIT_KEEPALIVE_TIME 5 minutes on the server. (Keepalive configuration specification table)
- gRPC may turn on TCP_USER_TIMEOUT with the same timeout when keepalive is on. "gRPC implementations may enable TCP_USER_TIMEOUT (or equivalent on another platform) automatically when keepalive is enabled, and use the same KEEPALIVE_TIMEOUT for TCP_USER_TIMEOUT." (TCP User Timeout)
- Behind a TCP load balancer, TCP_USER_TIMEOUT only watches the hop to the balancer; PINGs go end to end. "If a TCP load balancer is used, then TCP_USER_TIMEOUT will only monitor the connection between gRPC and the load balancer." and "The regular keepalive PINGs, however, are propagated through TCP load balancers" (TCP User Timeout)

## Visuals worth redrawing

None.

## My notes

- The same point holds for TCP keepalive probes: they're answered by
  whatever terminates the TCP connection, which may be a proxy.
  That's our inference, not stated on the page for keepalive probes.

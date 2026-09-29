---
id: envoy-global-rate-limiting
title: Global rate limiting (Envoy architecture overview)
author: Envoy project
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting
kind: docs
primary: true
---

## Summary

Envoy's overview of its two global rate limiting designs (docs for Envoy
1.40.0-dev): calling an external rate limit service over gRPC for every
connection or request, and a quota-based design where instances ask a
quota service for a share of the global limit. Recommends a local token
bucket in front of the global check.

## Key claims

- When global limiting is needed: many hosts calling a few, with low latency, e.g. a database. "The most common case is when a large number of hosts are forwarding to a small number of hosts and the average request latency is low (e.g., connections/requests to a database server)." (intro)
- Two implementations: a check per connection or request, and quota-based sharing. "Quota based, with periodic load reports that allows fair sharing of a global rate limit among multiple instances of Envoy." (intro, item 2)
- Quota-based is for large deployments with uneven load. "This implementation is suitable for large Envoy deployments with high request per second load that may not be evenly balanced across all Envoy instances." (intro, item 2)
- Per-request mode calls a gRPC rate limit service; the reference implementation is Go on Redis. "Envoy provides a reference implementation written in Go which uses a Redis backend." (Per connection or per HTTP request rate limiting)
- The HTTP filter calls the service for every request on the configured routes. "Envoy will call the rate limit service for every new request on the listener where the filter is installed" (Per connection or per HTTP request rate limiting)
- Two stages: a local token bucket absorbs bursts before the global service. "a local token bucket rate limit can absorb very large bursts in load that might otherwise overwhelm a global rate limit service." (Per connection or per HTTP request rate limiting)
- "The initial coarse grained limiting is performed by the token bucket limit before a fine grained global limit finishes the job." (Per connection or per HTTP request rate limiting)
- No open-source reference for the quota service when read; it works with Google Cloud's. "Open source reference implementation of the rate limiting service is currently unavailable." (Quota based rate limiting)
- Local limiting in front reduces load on the global service. "Local rate limiting can be used in conjunction with global rate limiting to reduce load on the global rate limit service." (Per connection or per HTTP request rate limiting)

## Visuals worth redrawing

None.

## My notes

- Pairs with envoy-local-rate-limit (the per-process token bucket).

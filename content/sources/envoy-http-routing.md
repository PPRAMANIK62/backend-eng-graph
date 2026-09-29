---
id: envoy-http-routing
title: HTTP routing (Envoy architecture overview)
author: Envoy project
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/http/http_routing
kind: docs
primary: true
---

## Summary

Envoy's overview of its HTTP router: route matching, retries, timeouts,
traffic splitting and request hedging. Read for the hedging section.

## Key claims

- What a hedge policy does. "Envoy will race multiple simultaneous upstream requests and return the first response with acceptable headers to the downstream." (Request hedging)
- Only on timeout. "Currently hedging can only be performed in response to a request timeout." (Request hedging)
- The slow request keeps running. "a retry request will be issued without cancelling the initial timed-out request and a late response will be awaited." (Request hedging)

## Visuals worth redrawing

None.

## My notes

- So Envoy's hedging is "retry on per-try timeout without cancelling",
  closer to Dean and Barroso's deferred hedge than to sending two
  copies at once.

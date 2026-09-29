---
id: envoy-router-filter
title: Router (Envoy HTTP filter reference)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter
kind: docs
primary: true
---

## Summary

The reference for Envoy's router filter (Envoy 1.40.0-dev), which
forwards requests upstream and handles retries and timeouts. Read for
how the route timeout covers every retry, per-try timeouts, and the
header that tells the upstream how long it has.

## Key claims

- The route timeout covers all retries, so a retry gets only what's left. "Thus if the request timeout is set to 3s, and the first request attempt takes 2.7s, the retry (including back-off) has .3s to complete." (retry notes)
- That's on purpose. "This is by design to avoid an exponential retry/timeout explosion." (retry notes)
- The route timeout can come from the client's `grpc-timeout` header when `max_grpc_timeout` is set. "The route timeout (set via x-envoy-upstream-rq-timeout-ms or the timeout in route configuration or set via grpc-timeout header by specifying max_grpc_timeout in route configuration) includes all retries." (retry notes)
- A per-try timeout must be below the route timeout, or it's ignored. "If a global route timeout is configured, this timeout must be less than the global route timeout (see x-envoy-upstream-rq-timeout-ms) or it is ignored." (x-envoy-upstream-rq-per-try-timeout-ms)
- Envoy tells the upstream how long it expects the request to take. "Envoy sets this header so that the upstream host receiving the request can make decisions based on the request timeout, e.g., early exit." (x-envoy-expected-rq-timeout-ms)
- Default retry backoff: full jitter with a 25 ms base, capped at 250 ms. "By default, Envoy uses a fully jittered exponential back-off algorithm for retries with a default base interval of 25ms." (retry notes)

## Visuals worth redrawing

None.

## My notes

- `max_grpc_timeout` is a cap an operator sets; it's also how you'd
  stop an outside client from asking for a huge deadline, though the
  docs don't say that.

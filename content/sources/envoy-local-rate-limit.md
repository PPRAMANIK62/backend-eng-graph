---
id: envoy-local-rate-limit
title: Local rate limit (Envoy HTTP filter)
author: Envoy project
url: https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/local_rate_limit_filter
kind: docs
primary: true
---

## Summary

Envoy's local (per-process) HTTP rate limit filter, read from the docs
for Envoy 1.40.0-dev. A token bucket per route, virtual host or
descriptor, answering 429 when empty.

## Key claims

- It's a token bucket. "The HTTP local rate limit filter applies a token bucket rate limit when the request's route or virtual host has a per filter local rate limit configuration." (intro)
- No tokens means 429 and an `x-envoy-ratelimited` header. "If the local rate limit token bucket is checked, and there are no tokens available, a 429 response is returned (the response is configurable)." (intro)
- The bucket is per Envoy process by default, or per downstream connection. "By default the rate limits are applied per Envoy process." (intro)
- Bucket settings: `max_tokens`, `tokens_per_fill`, `fill_interval`. (example configurations)
- Optional Retry-After: seconds until the next token, at least one. "The delay is the number of seconds until the next token is available in the bucket that rejected the request, clamped to at least one second." (intro)
- Descriptors give different buckets per client or path; a request rejected by one descriptor can still use up tokens in another. "if we send requests above 3 in a second, the limited requests from A will also consume tokens of B." (Using rate limit descriptors for local rate limiting)

## Visuals worth redrawing

None.

## My notes

- "Local" is the point: ten Envoy processes each with a bucket of 100
  per minute let a client through ten times over if its requests spread
  across them. Global limiting is a separate Envoy feature (not read).

---
id: envoy-health-checking
title: Health checking (Envoy architecture overview)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/health_checking
kind: docs
primary: true
---

## Summary

Envoy's active health checking, read from the docs for Envoy
1.40.0-dev: the kinds of probe (HTTP, gRPC, L3/L4, Redis, Thrift), the
thresholds, passive checking via outlier detection, a filter that
answers or caches health checks, fast draining, and health check
identity.

## Key claims

- Active checks have an interval and thresholds for marking a host unhealthy and healthy again. "check interval, failures required before marking a host unhealthy, successes required before marking a host healthy, etc." (Health checking)
- HTTP checks expect a 200 by default; a host can fail its check on purpose to shed traffic. "The upstream host can return a non-expected or non-retriable status code (any non-200 code by default) if it wants to immediately notify downstream hosts to no longer forward traffic to it." (Health checking)
- Protocol-specific checks: a gRPC health request, or a Redis PING. "Envoy will send a Redis PING command and expect a PONG response." (Health checking, Redis)
- gRPC checks send a gRPC request to the host. "During gRPC health checking Envoy will send a gRPC request to the upstream host." (Health checking, gRPC)
- L3/L4 checks send bytes and expect them echoed, or just connect. "Envoy also supports connect only L3/L4 health checking." (Health checking)
- Passive health checking is outlier detection. "Envoy also supports passive health checking via outlier detection." (Passive health checking)
- A big mesh generates a lot of health check traffic. "When an Envoy mesh is deployed with active health checking between clusters, a large amount of health checking traffic can be generated." (HTTP health checking filter)
- Recommended: pass through with caching, for an eventually consistent view without flooding the service. "This is the recommended mode of operation when operating a large mesh." (HTTP health checking filter)
- With passive checks it's common to use a long active interval, plus a header to fail fast when draining. "it is common to use a long health checking interval to avoid a large amount of active health checking traffic." (Active health checking fast failure)
- A passing health check doesn't prove it's the right host: an IP can come back as a different service. "it’s possible for a host to go away and then come back with the same IP address, but as a different host type." (Health check identity)
- The fix: compare a response header naming the service. "If the values do not match, the health check does not pass." (Health check identity)

## Visuals worth redrawing

None.

## My notes

- Envoy's service discovery page says health check results beat
  discovery data; see envoy-service-discovery.

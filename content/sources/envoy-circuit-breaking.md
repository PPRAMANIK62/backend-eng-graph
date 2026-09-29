---
id: envoy-circuit-breaking
title: Circuit breaking (Envoy architecture overview)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking
kind: docs
primary: true
---

## Summary

What Envoy calls circuit breaking, read from the docs for Envoy
1.40.0-dev: fixed limits per upstream cluster on connections, pending
requests, active requests, retries and connection pools. These are
concurrency limits (bulkheads), not the error-rate state machine most
libraries mean; Envoy's error-based ejection is outlier detection.

## Key claims

- Fail fast and push back early. "It’s nearly always better to fail quickly and apply back pressure downstream as soon as possible." (Circuit breaking)
- Enforced in the proxy, not coded in each app. "One of the main benefits of an Envoy mesh is that Envoy enforces circuit breaking limits at the network level as opposed to having to configure and code each application independently." (Circuit breaking)
- The limits aren't coordinated across Envoys. "Envoy supports various types of fully distributed (not coordinated) circuit breaking:" (Circuit breaking)
- Kinds of limit: maximum connections, pending requests, requests, active retries, concurrent connection pools, per cluster. (Circuit breaking, list)
- On retries it recommends budgets, or aggressive static limits. "In general we recommend using retry budgets; however, if static circuit breaking is preferred it should aggressively circuit break retries." (Cluster maximum active retries)
- Limits are per upstream cluster and per priority. "Each circuit breaking limit is configurable and tracked on a per upstream cluster and per priority basis." (Circuit breaking)
- Worker threads share the limits, and races can overshoot. "Since the implementation is eventually consistent, races between threads may allow limits to be potentially exceeded." (Circuit breaking)
- On by default, with modest defaults such as 1024 connections per cluster. "Circuit breakers are enabled by default and have modest default values, e.g. 1024 connections per cluster." (Circuit breaking)
- Tripping sets a response header. "Note that circuit breaking will cause the x-envoy-overloaded header to be set by the router filter in the case of HTTP requests." (Circuit breaking)

## Visuals worth redrawing

None.

## My notes

- The naming clash is worth a paragraph in `circuit-breakers` and a
  line in `bulkheads`.

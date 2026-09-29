---
id: envoy-panic-threshold
title: Panic threshold (Envoy architecture overview)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold
kind: docs
primary: true
---

## Summary

What Envoy does when too many hosts look unhealthy (docs for Envoy
1.40.0-dev): below a threshold, it stops trusting health status and
balances over all hosts, or fails everything, by configuration.

## Key claims

- Below the panic threshold, health status is ignored. "if the percentage of available hosts in the cluster becomes too low, Envoy will disregard health status and balance either amongst all hosts or no hosts." (Panic threshold)
- Default 50%. "The default panic threshold is 50%." (Panic threshold)
- Why: to stop failures cascading as load rises. "The panic threshold is used to avoid a situation in which host failures cascade throughout the cluster as load increases." (Panic threshold)
- The fail-everything mode protects struggling upstreams but gives up requests that might have worked. "Choosing to fail traffic during panic scenarios can help avoid overwhelming potentially failing upstream services" (Panic threshold)

## Visuals worth redrawing

None.

## My notes

- Pairs with outlier detection's max ejection percent: both stop a
  health mechanism from removing too much of the pool.

---
id: envoy-circuit-breakers-proto
title: Circuit breakers (proto) (Envoy API reference)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/circuit_breaker.proto
kind: docs
primary: true
---

## Summary

The API reference for Envoy's per-cluster circuit breaker settings
(Envoy 1.40.0-dev): each threshold with its default, and the retry
budget that limits concurrent retries as a share of active requests.

## Key claims

- Default limits: 1024 connections, 1024 pending requests, 1024 parallel requests. "The maximum number of connections that Envoy will make to the upstream cluster. If not specified, the default is 1024." (Thresholds, max_connections; same default for max_pending_requests and max_requests)
- Default limit on parallel retries: 3. "The maximum number of parallel retries that Envoy will allow to the upstream cluster. If not specified, the default is 3." (Thresholds, max_retries)
- A retry budget limits concurrent retries relative to active requests. "Specifies a limit on concurrent retries in relation to the number of active requests." (Thresholds, retry_budget)
- If set, the budget replaces the fixed retry limit. "If this field is set, the retry budget will override any configured retry circuit breaker." (Thresholds, retry_budget)
- The budget is a percentage of active plus pending requests. "For example, if there are 100 active requests and the budget_percent is set to 25, there may be 25 active retries." (RetryBudget, budget_percent)
- Default budget: 20%. "This parameter is optional. Defaults to 20%." (RetryBudget, budget_percent)
- A floor on retry concurrency, default 3. "The limit on the number of active retries may never go below this number." (RetryBudget, min_retry_concurrency; defaults to 3)
- By default only requests active right now count; `budget_interval` makes recent ones count too. "By default, when budget_interval is set to 0ms, only presently active and pending requests are considered when calculating the retry budget." (RetryBudget, budget_interval)

## Visuals worth redrawing

None.

## My notes

- Envoy's budget counts concurrency (retries in flight), where Google's
  and Finagle's count rates. Same goal, different unit.

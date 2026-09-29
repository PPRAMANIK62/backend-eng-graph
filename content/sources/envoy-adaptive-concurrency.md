---
id: envoy-adaptive-concurrency
title: Adaptive Concurrency (Envoy HTTP filter)
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/adaptive_concurrency_filter
kind: docs
primary: true
---

## Summary

Envoy's adaptive concurrency filter (docs for Envoy 1.40.0-dev): a
proxy-side limit on outstanding requests to a cluster, recomputed from
latency samples with a gradient controller. Includes the formulas,
the periodic minRTT measurement and its side effects, and where the
filter can and can't work.

## Key claims

- It adjusts how many requests may be outstanding to a cluster. "The adaptive concurrency filter dynamically adjusts the allowed number of requests that can be outstanding (concurrency) to all hosts in a given cluster at any time." (Overview)
- The limit comes from latency samples compared with expected latency. "Concurrency values are calculated using latency sampling of completed requests and comparing the measured samples in a time window against the expected latency for hosts in the cluster." (Overview)
- The controller works from a periodically measured ideal round trip time. "The gradient controller makes forwarding decisions based on a periodically measured ideal round-trip time (minRTT) for an upstream." (Gradient Controller)
- minRTT is measured by pinning concurrency low. "The minRTT is periodically measured by pinning the concurrency limit to the configured min_concurrency and measuring the latency under these ideal conditions." (Calculating the minRTT)
- Jitter keeps all hosts from measuring at the same time (limit 3 by default during measurement). "it is recommended to prevent all hosts in a cluster from being in a minRTT calculation window (and having a concurrency limit of 3 by default) at the same time." (Calculating the minRTT)
- 503s can rise during the measurement window. "It is possible that there is a noticeable increase in request 503s during the minRTT measurement window because of the potentially significant drop in the concurrency limit." (Calculating the minRTT)
- Retry on another host after such a 503. "It is recommended to use the previous_hosts retry predicate." (Calculating the minRTT, note)
- The gradient shrinks as sampled latency grows. "This gradient value has a useful property, such that it decreases as the sampled latencies increase." (The Gradient; formula gradient = (minRTT + B) / sampleRTT)
- The buffer B tolerates normal variance. "B, the buffer value added to the minRTT, allows for normal variance in the sampled latencies" (The Gradient)
- The update rule is limit_new = gradient * limit_old + headroom (shown as a formula). (The Gradient)
- Headroom is pinned to the square root of the limit. "the headroom value is unconfigurable and pinned to the square-root of the concurrency limit." (Concurrency Limit Headroom)
- Without headroom the limit could stay needlessly small. "In the absence of a headroom value, the concurrency limit could potentially stagnate at an unnecessary small value if the sampleRTT and minRTT are close to each other." (Concurrency Limit Headroom)
- It needs full control over the cluster's concurrency. "the filter must operate in conditions where it has full control over request concurrency." (Limitations)
- Blocked requests are counted in rq_blocked. "Total requests that were blocked by the filter." (Statistics, rq_blocked)

## Visuals worth redrawing

None.

## My notes

- Same shape as Netflix's gradient (netflix-adaptive-concurrency-2018),
  with a buffer added to minRTT.

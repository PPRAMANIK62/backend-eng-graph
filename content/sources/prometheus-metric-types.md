---
id: prometheus-metric-types
title: Metric types
author: Prometheus authors
url: https://prometheus.io/docs/concepts/metric_types/
kind: docs
primary: true
---

## Summary

Prometheus's page on its four core metric types (docs for Prometheus
3.15): counter, gauge, histogram and summary. It says how each is
exposed as time series, and that the server itself mostly doesn't keep
the type: everything except native histograms becomes plain float
series.

## Key claims

- Four core types, mostly only distinguished in client libraries and exposition. "The Prometheus instrumentation libraries offer four core metric types." (intro)
- The server flattens types into float series, except native histograms. "The Prometheus server does not yet make use of the type information and flattens all types except native histograms into untyped time series of floating point values." (intro)
- A counter only goes up, or resets to zero on restart. "A counter is a cumulative metric that represents a single monotonically increasing counter whose value can only increase or be reset to zero on restart." (Counter) [the page has a footnote marker after "counter"]
- Don't use a counter for something that can go down. "Do not use a counter to expose a value that can decrease." (Counter)
- A gauge goes up and down. "A gauge is a metric that represents a single numerical value that can arbitrarily go up and down." (Gauge)
- Gauges for measured values and counts that go both ways. "Gauges are typically used for measured values like temperatures or current memory usage, but also "counts" that can go up and down, like the number of concurrent requests." (Gauge)
- A histogram counts observations in buckets and keeps their sum. "A histogram records observations (usually things like request durations or response sizes) by counting them in configurable buckets." (Histogram)
- A classic histogram is several series: _bucket{le}, _sum, _count. "A classic histogram, however, consists of multiple time series of simple float samples." (Histogram)
- Classic buckets are cumulative. "these buckets are cumulative [], i.e. every bucket counts all observations less than or equal to the upper boundary provided as a label." (Histogram)
- Native histograms are more efficient and always aggregatable. "Native histograms are generally much more efficient than classic histograms, allow much higher resolution, do not require explicit configuration of bucket boundaries during instrumentation" (Histogram)
- A summary computes quantiles over a sliding window in the process. "it calculates configurable quantiles over a sliding time window." (Summary)
- Native histograms are stored as composite samples. "Native histograms, however, are ingested as time series of special composite histogram samples." (Histogram)

## Visuals worth redrawing

None.

## My notes

- The counter sentence has a footnote marker in the page text; the
  verification copy drops it.

---
id: otel-metrics-data-model
title: Metrics Data Model
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/specs/otel/metrics/data-model/
kind: spec
primary: true
---

## Summary

The OpenTelemetry specification's metrics data model (specification
1.61.0). It defines the point kinds (sum, gauge, histogram, exponential
histogram) as sent over OTLP, and the idea of aggregation temporality:
whether each report carries the total since start (cumulative) or only
what happened since the last report (delta). Also defines exemplars,
which tie a metric point to a trace.

## Key claims

- Metrics can be reaggregated in time and across attributes. "Metrics that are produced with unwanted attributes can be re-aggregated into metrics having fewer attributes." (Overview, spatial reaggregation)
- Deltas take cardinality state off the client. "Metrics that are input and output with Delta temporality unburden the client from keeping high-cardinality state." (Overview)
- In the core use cases, the SDK sends (exports) metrics to a collector every 10 seconds. "OTel SDK exports 10 second resolution to a single OTel collector, using cumulative temporality for a stateful client, stateless server" (Example Use-cases)
- Each OTLP point has an optional start time, used to spot restarts and gaps. "The second timestamp is strongly recommended for Sum, Histogram, and ExponentialHistogram points, as it is necessary to correctly interpret the rate from an OTLP stream, in a manner that is aware of restarts." (Temporality)
- Cumulative repeats the start time; delta advances it. "Cumulative temporality means that successive data points repeat the starting timestamp." (Temporality)
- Delta definition. "Delta temporality means that successive data points advance the starting timestamp." (Temporality)
- Prometheus is the example of cumulative. "The use of cumulative temporality for monotonic sums is common, exemplified by Prometheus." (Temporality)
- Cumulative survives dropped reports. "When collection fails intermittently, gaps in the data are naturally averaged from cumulative measurements." (Temporality)
- Cumulative costs the sender memory in proportion to cardinality. "Cumulative data requires the sender to remember all previous measurements, an “up-front” memory cost proportional to cardinality." (Temporality)
- StatsD is the example of delta; deltas move cardinality cost out of the process. "Delta temporality enables sampling and supports shifting the cost of cardinality outside of the process." (Temporality)
- StatsD delta. "The use of delta temporality for metric sums is also common, exemplified by Statsd." (Temporality)
- An exemplar links a metric recording to a trace. "An exemplar is a recorded value that associates OpenTelemetry context to a metric event within a Metric. One use case is to allow users to link Trace signals w/ Metrics." (Exemplars)
- An exemplar can carry the trace id and span id of the recording. "(optional) The trace associated with a recording (trace_id, span_id)" (Exemplars)
- A core use case: collectors receive OTLP and export Prometheus remote write. "Pool of OTel collectors receive OTLP and export Prometheus Remote Write" (Example Use-cases)
- What an exemplar holds besides the trace: time, value and filtered attributes. "The time of the observation (time_unix_nano)" (Exemplars)
- An exemplar's value is already counted in the histogram. "For Histograms, when an exemplar exists, its value already participates in bucket_counts, count and sum reported by the histogram point." (Exemplars)

## Visuals worth redrawing

- The events, data stream and time series diagram near the top.

## My notes

- Sections carry stability labels; the ones used here are Stable.

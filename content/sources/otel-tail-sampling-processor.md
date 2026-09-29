---
id: otel-tail-sampling-processor
title: Tail Sampling Processor (README)
author: OpenTelemetry Collector contrib authors
url: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md
kind: code
primary: true
---

## Summary

The README of the OpenTelemetry Collector's tail sampling processor,
read on the main branch when the latest contrib release was v0.162.0.
It is marked beta for traces. It groups spans by trace id, holds them in
memory for a fixed wait, then applies policies (latency, status code,
probabilistic, rate limits and more) to keep or drop each trace.

## Key claims

- All spans of a trace must reach the same collector instance. "All spans for a given trace MUST be received by the same collector instance for effective sampling decisions." (intro)
- It keeps spans in memory while it waits. "The processor keeps spans in memory while it waits to make a sampling decision." (Warnings)
- Default wait before deciding is 30 seconds. "`decision_wait` (default = 30s): Time before timer handling for a trace." (configuration)
- Default number of traces held is 50,000. "`num_traces` (default = 50000): Number of traces kept in memory." (configuration)
- The latency policy uses the earliest start and latest end of the trace. "The duration is determined by looking at the earliest start time and latest end time, without taking into consideration what happened in between." (policies)
- To scale out, use two collector layers: one load-balancing by trace id, one sampling. "You can achieve this by having two layers of collectors in your infrastructure: one with the [load balancing exporter][loadbalancing_exporter], and one with the tail sampling processor." (Scaling collectors with the tail sampling processor)
- Under load, traces are pushed out of a circular buffer before a decision. "This can cause a trace to be dropped before it's sampled." (Dropped Traces)
- Spans that arrive after the trace left memory rely on decision caches. "Late spans: decision caches remain important in both modes for spans that arrive after in-memory trace data is gone." (Sampling Strategies)

## Visuals worth redrawing

None.

## My notes

- Stability "beta" and the defaults above can change between releases;
  pinned to the contrib release current when read (v0.162.0).

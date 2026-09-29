---
id: exemplars
title: Exemplars
depth: short
phase: 14
note: >-
  A trace id attached to a metric sample, so a spike on a graph leads to
  a request that caused it.
needs: [metrics, distributed-tracing]
leads_to: []
compare_with: []
---

# Exemplars

[[metrics|Metrics]] are aggregates. A latency histogram can tell you
that 2% of checkout requests took over two seconds in the last five
minutes, but not which requests, so you can't go and look at one. An
exemplar is a sample request attached to the metric: one recorded
value, with the trace id of the request it came from. Click the slow
bucket on the graph and you land on a real slow
[[distributed-tracing|trace]].

## What an exemplar holds

In OpenTelemetry an exemplar is attached to a metric point and holds:

- the recorded value, say 2.3 s;
- the time it was observed;
- optionally, the trace id and span id of the request that recorded it;
- attributes that the metric itself dropped, like a customer id you
  didn't want as a label.

The value isn't extra data on top of the metric. It's already counted
in the histogram's buckets, count and sum; the exemplar just remembers
one of the measurements that went in.

## Which measurements become exemplars

A service records thousands of measurements a second and can only keep a
few exemplars per point, so two things decide which ones:

**A filter decides which measurements may become exemplars.** The
OpenTelemetry default is trace-based: only measurements recorded inside
a sampled span qualify. That matters because an exemplar's whole point
is the link to a trace, and a trace that wasn't kept by
[[trace-sampling]] is a dead link. The other built-in filters are
"always on" and "always off".

**A reservoir decides how many are kept.** For a histogram with explicit
buckets, the default keeps an exemplar per bucket, so there's an example
of a fast request and one of a slow one. For an exponential histogram
it keeps up to 20. There's no promise that the ones kept are
statistically representative.

## Getting them to a backend

Exemplars travel with the metric. In OpenTelemetry they're part of the
metric data model. In Prometheus, scrape targets add them through the
OpenMetrics format, and the server only stores them when started with
`--enable-feature=exemplar-storage`. It keeps them in a fixed-size ring
buffer in memory, about 100 bytes for an exemplar that holds just a
trace id, so older exemplars are overwritten.

## Where it gets tricky

**The link is only as good as your trace sampling.** With trace-based
filtering you only get exemplars from sampled requests. If you sample
1% of traces, the slow bucket may have no exemplar at all during a
short spike.

**Exemplars can leak what you dropped.** Attributes you removed from a
metric to keep [[cardinality]] down may still be exported on its
exemplars. That's useful for debugging, and a problem if you dropped
them for privacy. The spec asks SDKs to document it and to let you turn
exemplars off.

**One example isn't a pattern.** An exemplar shows you one request.
Look at several before concluding that all slow requests share a cause.

## What this means when you build

- Record latency as histograms inside traced code, so the default
  trace-based filter can attach exemplars.
- Make sure the traces an exemplar points to are actually kept: align
  your [[trace-sampling]] with what you alert on.
- In Prometheus, turn on exemplar storage and size its buffer for how
  far back you want to click.
- Check which attributes your exemplars export before you ship them.

## Further reading

- [Metrics Data Model](https://opentelemetry.io/docs/specs/otel/metrics/data-model/), OpenTelemetry specification 1.61.0. What an exemplar contains and how it relates to the histogram point.
- [Metrics SDK](https://opentelemetry.io/docs/specs/otel/metrics/sdk/), OpenTelemetry specification 1.61.0. Exemplar filters, the default reservoirs, and exported filtered attributes.
- [Feature flags](https://prometheus.io/docs/prometheus/latest/feature_flags/), Prometheus docs. Exemplar storage in Prometheus: the flag, the ring buffer and its memory cost.

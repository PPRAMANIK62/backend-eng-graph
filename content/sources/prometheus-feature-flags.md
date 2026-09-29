---
id: prometheus-feature-flags
title: Feature flags (Prometheus docs)
author: Prometheus authors
url: https://prometheus.io/docs/prometheus/latest/feature_flags/
kind: docs
primary: true
---

## Summary

The list of Prometheus features that are off by default. Read here for
exemplar storage: Prometheus only keeps exemplars scraped from targets
when the feature is enabled, in a fixed-size in-memory ring buffer.

## Key claims

- Exemplar storage is behind a flag. "--enable-feature=exemplar-storage" (Exemplars storage)
- Exemplars come from OpenMetrics. "OpenMetrics [] introduces the ability for scrape targets to add exemplars to certain metrics." (Exemplars storage) [the [] is a link in the page]
- What they are. "Exemplars are references to data outside of the MetricSet. A common use case are IDs of program traces." (Exemplars storage)
- Storage is a fixed ring buffer. "Exemplar storage is implemented as a fixed size circular buffer that stores exemplars in memory for all series." (Exemplars storage)
- Cost per exemplar. "An exemplar with just a trace_id=<jaeger-trace-id> uses roughly 100 bytes of memory via the in-memory exemplar storage." (Exemplars storage)
- Features behind flags may change. "They may be enabled by default in future versions." (intro)

## Visuals worth redrawing

None.

## My notes

- "latest" docs; the flag status can change between releases.

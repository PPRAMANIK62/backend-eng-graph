---
id: otel-metrics-sdk
title: Metrics SDK (OpenTelemetry specification)
author: OpenTelemetry authors
url: https://opentelemetry.io/docs/specs/otel/metrics/sdk/
kind: spec
primary: true
---

## Summary

The part of the OpenTelemetry specification (1.61.0) that says how an
SDK aggregates measurements. Read here for its Exemplar section: what
exemplars are for, which measurements become exemplars (the filter),
and how many are kept (the reservoir).

## Key claims

- What exemplars are. "Exemplars are example data points for aggregated data." (Exemplar)
- They connect aggregates to the calls behind them. "Exemplars allow correlation between aggregated metric data and the original API calls where measurements are recorded." (Exemplar)
- They keep attributes the aggregation dropped. "Exemplars also preserve attributes that are dropped during aggregation (e.g. by View configuration), regardless of instrument type" (Exemplar)
- The default filter is trace-based. "The default value SHOULD be TraceBased." (ExemplarFilter)
- What TraceBased means. "An ExemplarFilter which makes those measurements eligible for being an Exemplar, which are recorded in the context of a sampled parent span." (ExemplarFilter, TraceBased)
- Filters every SDK must support. "An OpenTelemetry SDK MUST support the following filters: - AlwaysOn - AlwaysOff - TraceBased" (ExemplarFilter)
- Histograms keep an exemplar per bucket by default. "Explicit bucket histogram aggregation with more than 1 bucket SHOULD use AlignedHistogramBucketExemplarReservoir." (Exemplar defaults)
- Exponential histograms keep up to 20. "Base2 Exponential Histogram Aggregation SHOULD use a SimpleFixedSizeExemplarReservoir with a reservoir equal to the smaller of the maximum number of buckets configured on the aggregation or twenty" (Exemplar defaults)
- No statistical promises. "No guarantees are made on the shape or statistical properties of returned exemplars." (Exemplar defaults)
- Dropped attributes can leak through exemplars. "SDK documentation SHOULD inform users that attributes excluded from a metric stream by View configuration may still be exported on Exemplars as filtered attributes" (Stream configuration)

## Visuals worth redrawing

None.

## My notes

- Pinned to specification 1.61.0.

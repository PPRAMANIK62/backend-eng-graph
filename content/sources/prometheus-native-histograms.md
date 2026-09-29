---
id: prometheus-native-histograms
title: Native Histograms (specification)
author: Prometheus authors
url: https://prometheus.io/docs/specs/native_histograms/
kind: spec
primary: true
---

## Summary

The specification of Prometheus native histograms: sparse,
exponentially bucketed histograms whose standard schemas can all be
merged with each other, with no bucket boundaries to configure when
instrumenting. Also the version history of the feature.

## Key claims

- First version. "The first version of the Prometheus server supporting native histograms was v2.40.0." (Native Histograms)
- Stable later. "Starting with v3.8.0, native histograms are supported as a stable feature." (Native Histograms)
- Still opt-in to scrape. "However, scraping native histograms still has to be activated explicitly via the scrape_native_histograms configuration setting." (Native Histograms)
- No boundaries to pick. "No configuration of bucket boundaries during instrumentation." (key properties)
- Valid schemas. "The currently valid values are -53 and the range between and including -4 and +8" (Schema)
- Standard schemas merge. "The standard schemas are mergeable with each other and are RECOMMENDED for general use cases." (Schema)
- Resolution halves per step down. "Schema n has half the resolution of schema n+1" (Schema)
- So a finer one can be folded into a coarser one. "a histogram with schema n+1 can be converted into a histogram with schema n by merging neighboring buckets." (Schema)
- Bucket upper bound for standard schema n, index i: `(2**2**-n)**i` (Schema)
- Custom buckets don't merge. "Histograms with different custom bucket boundaries are generally not mergeable with each other." (Schema)

## Visuals worth redrawing

None.

## My notes

- From the formula, schema 3 means each bucket's bounds grow by
  2^(1/8), about 1.09. The histograms guide's example uses a bucket
  factor of 1.1; how a factor maps to a schema isn't checked here.

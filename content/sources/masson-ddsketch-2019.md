---
id: masson-ddsketch-2019
title: "DDSketch: A Fast and Fully-Mergeable Quantile Sketch with Relative-Error Guarantees"
author: Charles Masson, Jee E. Rim, Homin K. Lee (Datadog)
url: https://arxiv.org/abs/1908.10693
kind: paper
primary: true
---

## Summary

A quantile sketch built from buckets whose boundaries grow
geometrically, so every percentile it returns is within a fixed
relative error of the true value. Because the buckets don't depend on
the data, two sketches merge by adding bucket counts. Published in
PVLDB 12(12), 2019; used in production at Datadog.

## Key claims

- Exact quantiles can't be kept cheaply. "order statistics (i.e., sample quantiles) can only be approximately summarized." (Abstract)
- Rank error isn't enough for skewed data. "Unfortunately, rank error guarantees do not preclude arbitrarily large relative errors, and this often occurs in practice when the data is heavily skewed." (Abstract)
- Mergeability defined. "several combined sketches must be as accurate as a single sketch of the same data." (Abstract)
- A worked case: a 0.005 rank-accurate p99 can land anywhere from 2 to 20 seconds on their response-time data. "we are guaranteed to get a value between the 98.5th and 99.5th percentile. In this case this is anywhere from 2 to 20 seconds" (1. Introduction)
- Buckets. "The sketch works by dividing R>0 into fixed buckets." (2.1)
- Merge is adding counts. "Since the bucket boundaries are independent of the data, any two sketches using the same value for γ can be merged by simply summing up the buckets that share an index." (2.1)
- Size in practice. "for α = 0.01, a sketch of size 2048 can handle values from 80 microseconds to 1 year, and cover all quantiles." (2.2)
- A bounded version collapses the extreme buckets. "The number of buckets can grow indefinitely or be bounded with a fixed maximum of m buckets, collapsing the buckets of lowest or highest indices." (4)
- Merging is fast in their tests. "it takes around 10 microseconds or less to merge two sketches containing up to fifty million values each" (4.3)
- Equi-depth histograms can't be merged accurately. "Equi-depth histograms [6] are a good example of non-mergeable data set synopses as there is no way to accurately combine overlapping buckets." (1)
- HDR Histogram: fast and mergeable but bounded range. "The main downside for HDR Histogram is that it can only handle a bounded (though very large) range that might not be suitable for certain data sets." (1, related work)

## Visuals worth redrawing

- Figure 4: actual quantiles vs rank-accurate and relative-accurate
  sketch answers on a heavy-tailed stream.

## My notes

- The merge-time numbers are from the paper's own benchmark.

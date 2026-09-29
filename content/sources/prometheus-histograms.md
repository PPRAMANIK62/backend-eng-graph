---
id: prometheus-histograms
title: Histograms and summaries
author: Prometheus authors
url: https://prometheus.io/docs/practices/histograms/
kind: docs
primary: true
---

## Summary

Prometheus's guide to recording request durations as histograms or
summaries. The core points for percentiles: a φ-quantile is the value at
rank φ·N; summaries compute quantiles inside each process and can't be
combined across processes; histograms keep bucket counts that can be
summed and turned into quantiles later, with an error set by the
bucket widths.

## Key claims

- Definition. "The φ-quantile is the observation value that ranks at number φ*N among the N observations." (Quantiles)
- Naming. "The 0.5-quantile is known as the median. The 0.95-quantile is also called the 95th percentile." (Quantiles)
- Precomputed quantiles can't be aggregated. "most importantly, you cannot aggregate quantiles" (Overview, approach 1)
- Averaging per-instance percentiles is wrong. "avg(http_request_duration_seconds{quantile=\"0.95\"}) // BAD!" (Quantiles)
- Histogram buckets can be summed across instances and turned into a quantile afterwards with histogram_quantile(). "Using histograms, the aggregation is perfectly possible with the histogram_quantile() function." (Quantiles)
- Quantiles are always estimates. "Quantiles, whether calculated by the instrumented binary or on the Prometheus server, are estimated." (Errors of quantile estimation)
- Worked example: requests all near 220 ms; a classic histogram with a 200-300 ms bucket estimates p95 at 295 ms, a fine native histogram at 228 ms. (Errors of quantile estimation)
- Summary error is in rank (φ), histogram error in value. "If you use a summary, you control the error in the dimension of φ. If you use a histogram, you control the error in the dimension of the observed value" (Errors of quantile estimation)
- Averages are available from sum and count, both additive. "they track the number of observations and the sum of the observed values, allowing you to calculate the average of the observed values." (Count and sum of observations)
- The classic bucket's estimate and its bounds. "The interpolation would estimate 295ms in this case, with the guarantee that the true value is between 200ms and 300ms." (Errors of quantile estimation)
- Against a 300 ms SLO, that looks close to a breach when it isn't. "the classic histogram gives you the impression that you are very close to breaching it, but in reality you are still doing quite well." (Errors of quantile estimation)
- After a 100 ms shift the classic estimate overshoots. "The 95th percentile is estimated to be 443ms, far away from the correct value close to 320ms." (Errors of quantile estimation)
- Summaries compute quantiles in the instrumented program. "calculate streaming φ-quantiles within the instrumented program and expose them" (Quantiles)
- The native bucket in the example. "the bucket this spike would fall into has a lower boundary of approximately 0.210 and an upper boundary of approximately 0.229." (Errors of quantile estimation)
- After the shift, the classic bucket is 300 to 450 ms. "The classic histogram, however, will see almost all observations in the bucket from 300ms to 450ms." (Errors of quantile estimation)

## Visuals worth redrawing

None.

## My notes

- Native histograms (exponential buckets) are the current recommendation;
  details belong in the phase 9 `histograms` node.

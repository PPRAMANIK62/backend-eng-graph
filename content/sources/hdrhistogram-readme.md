---
id: hdrhistogram-readme
title: HdrHistogram (README)
author: Gil Tene and HdrHistogram contributors
url: https://github.com/HdrHistogram/HdrHistogram
kind: code
primary: true
---

## Summary

The README of the Java HdrHistogram library, an excerpt of its
javadoc. It explains a histogram that covers a wide range of values at
a fixed relative precision in fixed memory, why such histograms can be
added together, and how to correct for coordinated omission when
recording.

## Key claims

- Precision is set as significant digits. "Value quantization within the range will thus be no larger than 1/1,000th (or 0.1%) of any value." (intro, 3 significant digits example)
- The example: 1 µs to 1 hour at 3 digits, about 185 KB. "would occupy a fixed, unchanging memory footprint of around 185KB" (intro)
- Memory doesn't grow with the number of samples. "The memory footprint is fixed regardless of the number of data value samples recorded, and depends solely on the dynamic range and precision chosen." (intro)
- Ports. "C, C#/.NET, Python, Javascript, Rust, Erlang, and Go ports can be found in other repositories." (intro)
- Recording is cheap. "Measurements show value recording times as low as 3-6 nanoseconds on modern (circa 2012) Intel CPUs." (intro)
- Buckets work like a float: exponent buckets, linear sub-buckets. "AbstractHistogram uses exponentially increasing bucket value ranges (the parallel of the exponent portion of a floating point number) with each bucket containing a fixed number (per bucket) set of linear sub-buckets" (Histogram variants and internal representation)
- Histograms add. "since Histogram objects are additive, it is common practice to use per-thread non-synchronized histograms or SingleWriterRecorders, and use a summary/reporting thread to perform histogram aggregation math across time and/or threads." (Synchronization and concurrent access)
- Why correction is needed: missed samples are the bad ones. "leading to \"dropped\" response time measurements that would typically correlate with \"bad\" results." (Corrected vs. Raw value recording calls)
- How it fills in. "recorded histogram data will reflect an appropriate number of additional values, linearly decreasing in steps of expectedIntervalBetweenValueSamples, down to the last value that would still be higher than expectedIntervalBetweenValueSamples." (Corrected vs. Raw)
- The example setup. "imagine a system for which response times samples are taken once every 10 msec" (Corrected vs. Raw)
- The pause. "The hypothetical system then encounters a 100 sec pause during which only a single sample is recorded (with a 100 second value)." (Corrected vs. Raw)
- Raw result. "would show ~99.99% of results at 1 msec or below, which is obviously \"not right\"." (Corrected vs. Raw)
- Corrected result. "Only ~50% of results will be at 1 msec or below, with the remaining 50% coming from the auto-generated value records covering the missing increments spread between 10msec and 100 sec." (Corrected vs. Raw)
- What the correction models. "will tend to produce data sets that would much more accurately reflect the response time distribution that a random, uncoordinated request would have experienced." (Corrected vs. Raw)
- No allocation while recording. "A Histogram's memory footprint is constant, with no allocation operations involved in recording data values or in iterating through them." (intro)

## Visuals worth redrawing

None in the README.

## My notes

- wrk2 (see `tene-wrk2-readme`) records into HdrHistograms.

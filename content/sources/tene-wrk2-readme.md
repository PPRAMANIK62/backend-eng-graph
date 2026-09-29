---
id: tene-wrk2-readme
title: wrk2 (README)
author: Gil Tene
url: https://github.com/giltene/wrk2
kind: code
primary: true
---

## Summary

The README of wrk2, Gil Tene's fork of the wrk HTTP benchmark. It sends
at a constant rate, records into HdrHistograms, and measures each
request's latency from when it should have been sent. Its closing note
explains coordinated omission and shows the corrected and uncorrected
percentiles side by side.

## Key claims

- What it is. "wrk2 is wrk modifed to produce a constant throughput load, and accurate latency details to the high 9s" (intro)
- Not just load generators. "the latency measurement issues that I focused on fixing with wrk2 are extremely common in load generators and in monitoring code." (intro)
- Recording. "wrk2 replaces wrk's individual request sample buffers with HdrHistograms." (intro)
- Timer granularity. "measured latencies are [only] accurate to a +/- ~1 msec granularity, due to OS sleep time behavior." (intro)
- Calibration. "wrk2 extends the initial calibration period to 10 seconds (from wrk's 0.5 second)" (Basic Usage)
- How wrk (and many tools) go wrong. "Since each connection will only begin to send a request after receiving a response, high latency responses result in the load generator coordinating with the server to avoid measurement during high latency periods." (A note about wrk2's latency measurement technique)
- Fully async senders avoid it only in some cases. "this (asynchronous) technique is normally only effective with non-blocking protocols or single-request-per-connection workloads." (same note)
- The fix. "wrk2 measures response latency from the time the transmission *should* have occurred according to the constant throughput configured for the run." (same note)
- It needs a plan. "It requires a \"model\" or \"plan\" that can provide the intended start time if each request." (same note)
- Even a quiet run differs. "and even wit the 99'%ile exhibit a ~2x ratio between wrk2's latency measurement and that of an uncorrected latency scheme." (same note, Example 1, worst case 11 ms)
- The disruption in example 2. "includes a single small (1.4sec) disruption (introduced using ^Z on the apache process for simple effect)." (same note)
- The difference. "reporting a 99%'ile that is 200x (!!!) larger than that of the traditional measurement technique" (same note)
- Example 2 output, recorded (corrected) p99. `99.000%    1.27s` (Example 2)
- Example 2 output, uncorrected p99. `99.000%    6.04ms` (Example 2)

## Visuals worth redrawing

- The CO example chart (CoordinatedOmission/wrk2_CleanVsCO.png):
  percentile spectrum, corrected vs "CO" curves.

## My notes

- Example runs: `wrk -t2 -c100 -d30s -R2000` against Apache on
  localhost, from the README's 2014 era. Not current numbers.

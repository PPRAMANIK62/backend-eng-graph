---
id: histograms
title: Latency histograms
depth: short
phase: 9
note: >-
  Recording latencies in buckets so percentiles can be read and merged
  later. Why you can't average percentiles.
needs: [latency-percentiles]
leads_to: [coordinated-omission, metrics, red-method, quantile-sketches]
compare_with: []
---

# Latency histograms

A latency histogram records each request's duration by adding one to
the count of the bucket that duration falls in. It keeps counts, not
the durations themselves. That's enough to read any
[[latency-percentiles|percentile]] later, to combine results from many
servers or many minutes by adding counts, and to do it in memory that
doesn't grow with traffic.

## Counting instead of keeping every value

Keeping every duration to sort later costs memory in proportion to
traffic. A histogram instead fixes a set of buckets up front, say 0 to
100 ms, 100 to 200 ms, 200 to 300 ms and so on, and keeps one counter
per bucket.

To read the p99, walk the buckets from the fastest, adding up counts,
until you pass 99% of the total. The p99 is somewhere inside that
bucket. Where exactly, the histogram can't say, so tools interpolate
inside the bucket.

## Why you can add histograms but not percentiles

Two servers each record into the same buckets. To get the latency
picture for both together, add the two counts bucket by bucket. The
result is exactly the histogram you would have got if one process had
recorded every request. Then read any percentile from the sum.

Percentiles don't work that way. If each server reports its own p95,
there's no correct way to combine the two numbers: averaging them is
wrong, because the combined p95 depends on how many requests each
server handled and on the shape of both distributions. Prometheus
summaries compute percentiles inside each process, and for exactly that
reason they can't be aggregated across instances. Histogram buckets,
summed first and then turned into a quantile, are the supported way.
The same property lets each thread record into its own histogram with
no locking, and a reporting thread add them up.

## The bucket width is your error

A histogram's percentile is only as precise as its buckets. Say almost
every request takes about 220 ms, so the true p95 is about 220 ms.

![Two rows over a time axis from 180 to 300 ms. A dashed line marks the true value near 220 ms. The classic histogram's only bucket spans 200 to 300 ms and its p95 estimate sits at 295 ms. The native histogram's bucket spans about 210 to 229 ms and its estimate sits at 228 ms.](img/histograms-bucket-error.svg)

*The same requests in a wide bucket and a narrow one. Numbers from the Prometheus docs, "Histograms and summaries".*

- A classic histogram with a bucket from 200 to 300 ms puts every
  request in that one bucket. It estimates the p95 at 295 ms and can
  only promise the truth is somewhere between 200 and 300 ms. Against a
  300 ms target, that looks like you're about to miss it when you're
  fine.
- A native histogram with much narrower buckets puts the same requests
  in a bucket from about 210 to 229 ms and estimates 228 ms.

Shift every request up by 100 ms and the classic histogram's 300 to
450 ms bucket estimates 443 ms for a true value near 320 ms. Picking
buckets by hand means guessing ahead of time where your numbers will
fall.

## Exponential buckets: the same precision at every scale

Latencies span orders of magnitude: microseconds for a cache hit,
seconds for a stuck call. Equal-width buckets are either too coarse at
the bottom or far too many at the top. The fix is buckets whose width
grows with the value, so the error is a fixed fraction of whatever you
measured.

**HdrHistogram** sets precision as a number of significant digits. With
3 digits, no value is off by more than 0.1%. Its example covers 1 µs to
1 hour at 3 digits in a fixed footprint of about 185 KB. Inside, it
works like a floating-point number: exponentially growing buckets,
each split into equal sub-buckets. Recording a value takes 3 to 6 ns on
Intel CPUs from around 2012, with no allocation. It started in Java
and has ports to C, Go, Rust, Python and others. See also
[[quantile-sketches]].

**Prometheus native histograms** do the same inside a metrics system.
They use standard exponential layouts called schemas, from −4
(coarsest) to 8 (finest); each step up doubles the resolution, so any
two can be merged by folding the finer one's neighbouring buckets
together. You don't pick boundaries when instrumenting. They arrived in Prometheus v2.40.0 as an
experimental feature and became stable in v3.8.0, though scraping them
still has to be switched on with `scrape_native_histograms`.

## Where it gets tricky

**Different bucket layouts don't merge.** Adding counts only works when
the buckets line up. Two classic histograms with different boundaries,
or two native histograms with different custom boundaries, can't be
combined honestly. Standard exponential schemas avoid this by design.

**A histogram forgets time.** One histogram for an hour gives the p99
over the hour, not that it all happened in one bad minute. Keep one per
short interval; you can always add them up later.

**It records what you feed it.** A histogram is exact about the values
it was given. If your load generator stopped sending during a stall,
the stall's missing requests never reach the histogram, and no
bucket layout brings them back. HdrHistogram has a recording call that
fills in those missing samples when you know the expected interval;
the problem itself is [[coordinated-omission]].

## What this means when you build

- Record latencies into a histogram, never into a list of per-server
  percentiles you'll later need to combine.
- Use exponential buckets (HdrHistogram, or Prometheus native
  histograms) unless you know exactly where your targets sit.
- Keep one histogram per thread and per interval, and add them up for
  reports.
- Store the histogram, not just the p99 you read from it. Histograms as
  a metric type come back in [[metrics]].

## Further reading

- [Histograms and summaries](https://prometheus.io/docs/practices/histograms/), Prometheus docs. Why summaries can't be aggregated and histograms can, and a worked example of how bucket width sets the error.
- [Native Histograms](https://prometheus.io/docs/specs/native_histograms/), Prometheus docs. The exponential schemas, which ones merge, and which Prometheus versions support them.
- [HdrHistogram](https://github.com/HdrHistogram/HdrHistogram), Gil Tene and contributors. A fixed-size, fixed-precision histogram built for recording latencies, and its fix for missed samples.

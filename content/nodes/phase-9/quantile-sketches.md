---
id: quantile-sketches
title: Quantile sketches
depth: short
phase: 9
note: >-
  Small summaries like t-digest and DDSketch that estimate percentiles
  and can be merged across machines.
needs: [histograms]
leads_to: []
compare_with: []
---

# Quantile sketches

A quantile sketch is a small summary of a stream of numbers that can
answer "what's the p99?" without keeping every number. Exact
percentiles need every value, which is too much when requests come from
thousands of hosts. A sketch keeps a small, bounded amount of state
instead, gives an approximate answer with a known error, and ideally
can be merged with sketches from other machines. A
[[histograms|histogram]] with fixed buckets is the simplest sketch;
t-digest and DDSketch are two widely used ones that go further.

## What "approximate" should mean

Most of the literature bounds **rank error**: ask for the p99 and you
get a value whose rank is close, say somewhere between the p98.5 and the
p99.5. That sounds fine until the data has a long tail. On one set of
real response times in the DDSketch paper, that band ran from 2 seconds
to 20 seconds. For a user, that's the difference between an annoying
delay and giving up.

Latency is exactly this kind of data, so the sketches built for it
bound the error differently:

- **Relative error** on the value: the answer is within, say, 1% of the
  true p99, whatever its size. That's DDSketch's guarantee.
- **Accuracy that tightens toward the tails**: t-digest's error scales
  with how extreme the quantile is, so the p99.9 is more precise than
  the median.

## Two designs

**DDSketch: buckets that grow geometrically.** Each bucket covers values
from γ^(i−1) up to γ^i, where γ is set from the error you want. A value
goes into the bucket given by the logarithm of the value, and the bucket
count goes up by one. Because the width of each bucket is a fixed
fraction of its values, every answer is within the target relative
error. With 1% error, 2,048 buckets cover everything from 80
microseconds to a year. Datadog built it and uses it in production.

**t-digest: clusters, small at the ends.** A t-digest groups incoming
values into clusters and keeps only each cluster's mean and count. The
clusters near the extremes are allowed to hold only a few values, and
the ones in the middle many, so the tails are described in fine detail
and the middle coarsely. It's in Elasticsearch and Apache Lucene, among
others.

## Merging is the point

In a real system each process summarizes its own requests, and you want
the p99 for the whole fleet, per minute or per hour. Percentiles can't
be averaged. Sketches can be combined:

- **DDSketch** merges by adding counts of buckets with the same index,
  because the bucket boundaries don't depend on the data. In the paper's
  benchmark, merging two sketches of up to fifty million values each
  took around 10 microseconds or less.
- **t-digest** can combine separately computed digests with no loss in
  accuracy.
- Some summaries can't be merged at all: equi-depth histograms, whose
  bucket edges depend on the data, have no accurate way to combine
  overlapping buckets.

## Where it gets tricky

**Guarantees differ.** A rank-error sketch, a relative-error sketch and
a t-digest can give three different "p99"s from the same data, each
within its own promise. Know which one your metrics system uses before
comparing numbers across tools.

**Range limits.** HdrHistogram is fast and mergeable but handles only a
bounded range, which may not fit every data set. DDSketch caps its
memory by collapsing the lowest or highest buckets when it runs out of
room, which gives up accuracy at that end.

**Only merge like with like.** DDSketches merge exactly only when they
use the same γ. Mixing sketches with different settings, or from
different libraries, isn't safe.

## What this means when you build

- For latency, prefer a sketch with relative error or tail accuracy
  over one with plain rank error.
- Record a sketch per process and per time window, ship the sketches,
  and merge them centrally. Never average percentiles.
- Keep the sketch settings the same everywhere you intend to merge.

## Further reading

- [DDSketch: A Fast and Fully-Mergeable Quantile Sketch with Relative-Error Guarantees](https://arxiv.org/abs/1908.10693), Charles Masson, Jee E. Rim, Homin K. Lee, PVLDB, 2019. Why rank error fails on heavy tails, the geometric buckets, merging, and a comparison with other sketches.
- [Computing Extremely Accurate Quantiles Using t-Digests](https://arxiv.org/abs/1902.04023), Ted Dunning and Otmar Ertl, 2019. The t-digest: clusters sized so the tails stay accurate, and merging digests.

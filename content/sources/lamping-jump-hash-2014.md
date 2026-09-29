---
id: lamping-jump-hash-2014
title: A Fast, Minimal Memory, Consistent Hash Algorithm
author: John Lamping and Eric Veach (Google)
url: https://arxiv.org/pdf/1406.2294
kind: paper
primary: true
---

## Summary

Google's jump consistent hash (2014): a few lines of code that map a
64-bit key to one of n numbered buckets, use no memory, and split keys
almost perfectly evenly. The catch is that buckets must be numbered
0..n-1, so it fits storage shards that grow and shrink at the end, not
caches whose servers vanish in any order. The paper also measures how
uneven and memory-hungry Karger's ring is.

## Key claims

- Moving from 10 to 12 shards with `mod` rearranges everything, though only a sixth needs to move. "But it is only necessary to move 1/6 of the data stored in the 10 shards in order to end up with the data balanced among 12 shards." (Introduction)
- Jump hash needs no stored state. "jump consistent hash needs no memory beyond what fits in a few registers." (Introduction)
- Its limit: buckets numbered in sequence. "Its main limitation is that the buckets must be numbered sequentially, which makes it more suitable for data storage applications than for distributed web caching." (Abstract)
- Karger's ring needed 1000 points per bucket for a 3.2% spread. "Karger et al.’s experiments used 1000 points per bucket to get to a standard deviation of 3.2% in the number of keys assigned to different buckets." (Related work)
- Even at 1000 points per bucket, about 1% of buckets are 8% or more off the average. "Even with 1000 points per bucket, approximately 1% of buckets will be at least 8% larger or smaller than average." (Performance Measurements, Key Distribution)
- With 10 points per bucket, about 1% of buckets fall below 0.37x or above 1.98x the average size (Figure 2 and the text under it).
- Ring memory at 1000 points per bucket: 46 MB for 1000 buckets as an STL map (version A, 48 bytes per point), 7.6 MB as a sorted vector (version B, 8 bytes per point); each client needs a copy. "The table below presents the total data size for various numbers of buckets, assuming that 1000 points per bucket are used" (Space Requirements, Figure 3)
- Rendezvous hashing: hash the key with each bucket, take the highest. "It then returns the bucket for which the hash yielded the highest value." (Related work)
- Rendezvous costs time proportional to the bucket count. "This requires time proportional to the number of buckets." (Related work)
- In storage, a dead server doesn't reassign data; only capacity changes do. "Server death thus does not cause reallocation of data" (Related work)
- A new jump-hash bucket takes an equal share from every old bucket. "When a new bucket is added with jump consistent hash, the new bucket receives an equal fraction of the key space of each existing bucket." (Key Distribution)
- On the ring, only the buckets next to the new points give up keys. "With Karger et al.'s algorithm, on the other hand, the only buckets that participate in rebalancing are the ones that previously contained the points chosen to represent the new bucket." (Key Distribution)
- Running time is logarithmic. "So the expected number of iterations is less than ln(n) + 1." (Performance Analysis)
- Jump hash's spread is near perfect. "In contrast jump consistent hash divides the key space almost perfectly." (Key Distribution)
- In storage, every client sees the same bucket list, so Karger's multi-view properties don't apply. "Under our data storage model this cannot happen, because all clients see the same set of buckets [0, num_buckets)." (Related work)
- Shards are numbered as they're added, so the ids always fill 0..n-1. "shards can be assigned numerical ids in increasing order as they are added, so that the active bucket ids always fill the range [0, num_buckets)." (Related work)
- Shards survive server death through replicas or fast replacement. "Typically this is handled by either making the shards redundant (with several replicas), or being able to quickly recover a replacement, or accepting lower availability for some data." (Related work)
- The ring and rendezvous allow any names and any removals. "Both of these algorithms allow buckets to have arbitrary ids, and handle not only new buckets being added, but also arbitrary buckets being removed." (Related work)
- About five lines of code. "a fast, minimal memory, consistent hash algorithm that can be expressed in about 5 lines of code." (Abstract)
- Inputs and output. "Its inputs are a 64 bit key and the number of buckets. It outputs a bucket number in the range [0, num_buckets)." (Explanation of the algorithm)

## Visuals worth redrawing

- The table of three keys' buckets as num_buckets grows from 1 to 14
  (Explanation of the algorithm): shows keys only ever jump to the new
  bucket.

## My notes

- The paper says Karger's scheme walks "clockwise" on a unit circle;
  Karger's own paper says "closest". Doesn't change anything.

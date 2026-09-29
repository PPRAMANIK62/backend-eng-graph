---
id: einziger-tinylfu-2015
title: "TinyLFU: A Highly Efficient Cache Admission Policy"
author: Gil Einziger, Roy Friedman, Ben Manes
url: https://arxiv.org/abs/1512.00727
kind: paper
primary: true
---

## Summary

The TinyLFU paper (arXiv 1512.00727v2; later in ACM Transactions on
Storage, 2017). Instead of only picking a victim, the cache asks an
admission filter whether a new item is worth more than the victim,
using approximate frequency counts over a recent sample. Describes the
counting sketch, the reset (halving) that keeps counts fresh, small
capped counters, the "doorkeeper" Bloom filter, and W-TinyLFU as built
into Caffeine. Ben Manes wrote Caffeine.

## Key claims

- Admission, not just eviction: decide whether the newcomer should replace the victim. "Given a newly accessed item and an eviction candidate from the cache, our scheme decides, based on the recent access history, whether it is worth admitting the new item into the cache at the expense of the eviction candidate." (Abstract)
- Hit ratio defined. "The ratio between the number of cache hits and the total number of data accesses is known as the cache hit-ratio." (1 Introduction)
- With a fixed distribution, LFU is best. "When the probability distribution of the data access pattern is constant over time, it is easy to show that the Least Frequently Used (LFU) yields the highest cache hit ratio" (1 Introduction)
- LFU's two problems: big metadata, and popularity changes. "Yet, LFU has two significant limitations." (1 Introduction)
- LRU adapts but needs a bigger cache for the same hit ratio. "Yet, under many workloads, LRU requires much larger caches than LFU in order to obtain the same hit-ratio." (1 Introduction)
- Real LRU is too slow for hardware and OS page caches, which use approximations. "Yet, LRU is still considered too slow for hardware caches and operating systems page caching" (footnote 1)
- Minimal increment (conservative update): only bump the smallest counters. "However, it reads all k counters and only increments the minimal counters." (3.2)
- CM-Sketch is a bit less accurate per space but faster. "It provides a somewhat lower accuracy per space tradeoff. However, it is largely believed to be faster." (3.2)
- Reset: count additions; when the count reaches the sample size W, halve every counter (and the count). "Every time we add an item to the approximation sketch, we increment a counter." (3.3)
- Counters can be capped at W/C, so a few bits each. "Hence, for a given sample size W , we can safely cap the counters by W/C." (3.4.1)
- Doorkeeper: a Bloom filter in front that absorbs first-time items. "The Doorkeeper is a regular Bloom filter placed in front of the approximate counting scheme." (3.4.2)
- TinyLFU alone struggled with sparse bursts, as in storage traces. "This occurred mainly with traces that include “sparse bursts” to the same object, as is common in storage servers." (4)
- W-TinyLFU: a window LRU with no admission filter, then a main SLRU guarded by TinyLFU, 80% protected. "The main cache employs the SLRU eviction policy and TinyLFU admission policy while the window cache employs an LRU eviction policy without any admission policy." (4)
- In Caffeine 2.0 the window was 1% of the cache. "In the current release of Caffeine (2.0), the size of the window cache is 1% of the total cache size and that of the main cache is 99%." (4)
- Overhead in Caffeine: 8 bytes per entry, less than ARC and LIRS. "The overall space overhead of W-TinyLFU in Caffeine is 8 bytes per cache entry, which is significantly lower than the overhead ARC and LIRS." (4)
- No ghost entries needed. "the latter typically maintain ghost entries, which adds complexity to the implementations." (4)
- Caffeine's sample is 10 times the cache size and uses a CM-Sketch. "In the current release of Caffeine (2.0), the TinyLFU histogram is maintained for a sample that is 10 times the cache size." (5.1)
- Without a doorkeeper, most counters go to tail items seen once. "the majority of the counters are assigned to items that are not likely to appear more than once inside the sample." (3.4.2 Doorkeeper)

## Visuals worth redrawing

- Figure 5 (Window TinyLFU scheme): window LRU → TinyLFU filter → main
  SLRU. Redrawn in `eviction-policies`.
- Figure 2 (counting Bloom filter with minimal increment).

## My notes

- Read on arXiv (v2, 2015). The Caffeine numbers are for Caffeine 2.0;
  current Caffeine adapts the window size (caffeine-efficiency).

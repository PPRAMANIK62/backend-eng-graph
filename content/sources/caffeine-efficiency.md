---
id: caffeine-efficiency
title: Efficiency (Caffeine wiki)
author: Ben Manes
url: https://github.com/ben-manes/caffeine/wiki/Efficiency
kind: docs
primary: true
---

## Summary

The Caffeine (Java cache library) wiki page on why it uses W-TinyLFU,
comparing it with ARC and LIRS and against Belady's optimal on several
traces. Written by Caffeine's author.

## Key claims

- LRU is popular but not optimal and bad on scans. "However, in typical workloads LRU is not optimal and may have a poor hit rate in cases like full scans." (intro)
- Caffeine uses W-TinyLFU. "Caffeine uses the Window TinyLfu policy due to its high hit rate and low memory footprint." (intro)
- ARC must remember evicted keys and is patented. "It is also patented and cannot be used without a license agreement with IBM." (Adaptive Replacement Cache)
- LIRS is complicated and needs triple the keys. "The policy is complicated to implement and only achieves its maximum efficiency when the cache size is tripled in order to retain evicted keys." (Low Inter-reference Recency Set)
- W-TinyLFU: small admission LRU, then a large segmented LRU guarded by TinyLFU. "W-TinyLfu uses a small admission LRU that evicts to a large Segmented LRU if accepted by the TinyLfu admission policy." (Window TinyLfu)
- The window lets bursts through. "The window allows the policy to have a high hit rate when entries exhibit recency bursts which would otherwise be rejected." (Window TinyLfu)
- The window size adapts by hill climbing. "The size of the window vs main space is adaptively determined using a hill climbing optimization." (Window TinyLfu)
- A 4-bit count-min sketch, 8 bytes per entry, no retained evicted keys. "This implementation uses a 4-bit CountMinSketch, growing at 8 bytes per cache entry to be accurate. Unlike ARC and LIRS, this policy does not retain evicted keys." (Window TinyLfu)
- Policies are compared with Belady's optimal. "The eviction policies are compared against Bélády's optimal for the theoretical upper bound." (Simulations)

## Visuals worth redrawing

- The hit-rate-vs-cache-size charts per trace (can't copy; our own
  curves will come from the lab).

## My notes

- Pinned to the wiki as read when Caffeine's latest release was v3.3.0.

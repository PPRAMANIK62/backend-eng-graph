---
id: yang-s3-fifo-2023
title: FIFO Queues are All You Need for Cache Eviction
author: Juncheng Yang, Yazhuo Zhang, Ziyue Qiu, Yao Yue, K. V. Rashmi
url: https://jasony.me/publication/sosp23-s3fifo.pdf
kind: paper
primary: true
---

## Summary

SOSP 2023 paper introducing S3-FIFO: a small FIFO (10% of space), a
main FIFO (90%), and a ghost FIFO of evicted keys. The small queue
quickly drops "one-hit wonders". Evaluated on 6594 production traces
from 14 datasets against 12 algorithms, and prototyped in CacheLib for
throughput.

## Key claims

- LRU's costs: two pointers per object and a locked promotion on every hit. "However, LRU suffers from two problems: (1) it requires two pointers per object, which is a significant storage overhead for workloads consisting of small objects; and (2) it is not scalable because each cache hit requires promoting the requested object to the head of the queue guarded by locking." (1 Introduction)
- Most objects are one-hit wonders within a cache-sized window: 26% median over whole traces, 72% over sequences with 10% of the objects. "However, when focusing on sequences that comprise 10% of the unique objects in each trace, the median one-hit-wonder ratio skyrockets to 72%." (1 Introduction)
- Quick demotion is the key idea. "Our insight is that most objects in skewed workloads will only be accessed once in a short window, so it is critical to evict them early (also called quick demotion)." (Abstract)
- Design: S uses 10% of space, M 90%, G holds as many ghost entries as M. "We choose S to use 10% of the cache space based on experiments with 10 traces and find that 10% generalizes well." (4.1)
- Two bits per object, capped frequency up to 3. "S3-FIFO uses two bits per object to track object access status [155] similar to a capped counter with frequency up to 3." (4.1)
- New objects go to S unless they're in G, then to M. "New objects are inserted into S if not in G. Otherwise, it is inserted into M." (4.1)
- Objects leaving S go to M if re-accessed, else to G. "When S is full, the object at the tail is either moved to M if it is accessed more than once or G if not." (4.1)
- Throughput: over 6x an optimized LRU at 16 threads. "FIFO queues enable S3-FIFO to achieve good scalability with 6× higher throughput compared to optimized LRU at 16 threads." (Abstract)
- Robustness: best on 10 of 14 datasets at a cache 10% of the trace's objects. "Using a cache size of 10% of objects in the trace, S3-FIFO is the most efficient algorithm on 10 out of the 14 datasets" (1 Introduction)
- A Bloom filter rejecting all first-time objects is too blunt. "However, a Bloom Filter rejects objects too fast with a lack of precision since it rejects all objects that have not been seen before." (3.2)
- TinyLFU with a 1% window is the closest competitor but is worse than FIFO on some traces; a 10% window helps the tail. "TinyLFU [54] is the closest competitor." (5.2)
- Their stated reason: the 1% window is too small. "First, the 1% window LRU is too small, evicting objects too fast." (5.2)
- Adversarial pattern for partitioned caches: objects requested twice with a gap longer than S. "We remark that these workloads are adversarial for most algorithms that partition the cache space, e.g., TinyLFU, LIRS, 2Q, and CACHEUS." (6)
- Most flash caches already use FIFO or FIFO-reinsertion. "most production flash cache systems, e.g., Apache Trafficserver [14], Memcached Extstore [101], Cachelib large object cache [24], and Google Colossus flash cache [159], use FIFO or FIFO-reinsertion." (2.1)
- The bad case: objects used twice, the second request after they leave S. "it is possible that the second request is a cache hit in LRU and FIFO, but not in these advanced algorithms" (6)
- LRU evicts in a different order than it inserts, which means random flash writes. "Third, LRU is not flash-friendly." (2.2)
- Compared against 12 algorithms on 6594 traces from 14 datasets. "We compare S3-FIFO with 12 eviction algorithms on a large data collection of 6594 production traces from 14 sources." (1 Introduction)
- The next best algorithm, LIRS, won on only 2 datasets. "As a comparison, the next best algorithm (LIRS [77]) obtains the highest efficiency on only 2 datasets." (1 Introduction)
- The throughput result comes from a CacheLib prototype. "Our prototype in Cachelib shows that FIFO queues enable S3-FIFO to be scalable with 6× higher throughput than an optimized LRU implementation." (1 Introduction)
- The main queue reinserts popular objects instead of evicting them. "The main FIFO queue reinserts some popular objects during evictions." (1 Introduction)

## Visuals worth redrawing

- Figure 5: S, M and G queues with the moves between them. Redrawn in
  `eviction-policies`.

## My notes

- They tested TinyLFU with a fixed 1% window (and 10%). Caffeine's
  current W-TinyLFU adapts the window by hill climbing
  (caffeine-efficiency), which the paper doesn't evaluate as far as I
  read.
- Hosted on the first author's site; the ACM DL copy was blocked to curl.

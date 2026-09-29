---
id: yang-twitter-cache-2020
title: A large scale analysis of hundreds of in-memory cache clusters at Twitter
author: Juncheng Yang, Yao Yue, K. V. Rashmi
url: https://www.usenix.org/system/files/osdi20-yang.pdf
kind: paper
primary: true
---

## Summary

OSDI 2020 study of week-long traces from 153 Twemcache (a memcached
fork) clusters at Twitter. Measures miss ratios, write ratios, TTLs,
popularity skew and object sizes, and simulates eviction policies on the
traces. Co-written by the Twitter engineer who ran the cache.

## Key claims

- Twitter's caches are look-aside. "new clusters are provisioned semi-automatically to be used as look-aside cache [59] upon request." (2.1)
- About 700 billion requests from 153 clusters. "We collected around 700 billion requests (80 TB in raw file size) from 306 instances of 153 Twemcache clusters" (3.2)
- Most top clusters run at low miss ratios. "Eight out of the ten Twemcache clusters have a miss ratio lower than 5%, and six of them have a miss ratio close to or lower than 1%." (4.1)
- The exception is a write-heavy cluster near 70% misses. "The only exception is a write-heavy cache cluster, which has a miss ratio of around 70%" (4.1)
- The highest miss ratio (with the request rate) decides how big the backend must be, so a stable miss ratio beats a low but spiky one. "Therefore, a cache with a low miss ratio most of the time, but sometimes a high miss ratio is less useful than a cache with a slightly higher but stable miss ratio." (4.1)
- Very low miss ratios are fragile; maintenance and failures hurt most there. "extremely low miss ratios tend to be less robust, which means the corresponding backends have to be provisioned with more margins." (4.1)
- Write-heavy caches are common. "write-heavy (defined as write ratio > 30%) workloads are very common, occurring in more than 35% of the 153 cache clusters we studied." (1, summary)
- TTL limits the working set; removing expired items matters as much as eviction. "TTL must be considered in in-memory caching because it limits the effective (unexpired) working set size." (1, summary)
- TTLs range from minutes to days. "The figure shows that TTL ranges from minutes to days." (4.4.1)
- Popularity is roughly Zipfian. "In-memory caching workloads follow approximate Zipfian popularity distribution, sometimes with very high skew." (1, summary)
- FIFO is often as good as LRU at reasonable sizes. "Under reasonable cache sizes, FIFO often shows similar performance as LRU, and LRU often exhibits advantages only when the cache size is severely limited." (1, summary)
- Most caches have a stable miss ratio (max/min under 1.5 over a week). "most caches have this ratio lower than 1.5" (4.1)
- Caches with extremely low miss ratios suffer most from maintenance and failures. "cache maintenance and failures become a major source of disruption for caches with extremely low miss ratios" (4.1)
- Removing expired objects should come before eviction. "Efficiently removing expired objects from cache needs to be prioritized over cache eviction." (1, summary)
- Three use cases: storage, computation, transient data. "there are three main use cases of Twemcache: caching for storage, caching for computation, and caching for transient data." (2.4)

## Visuals worth redrawing

- Figure 3: miss ratio (log scale) of the top ten clusters.

## My notes

- Useful as a real-world anchor for hit/miss ratios in `caching`.

---
id: redis-eviction
title: Key eviction (Redis docs)
author: Redis
url: https://redis.io/docs/latest/develop/reference/eviction/
kind: docs
primary: true
---

## Summary

The Redis manual page on `maxmemory` and `maxmemory-policy`: the list of
eviction policies, how the approximated LRU and LFU work (random
sampling, Morris counters with decay), how to read hit ratio from INFO,
and the LRM policy added in Redis 8.6.

## Key claims

- Evicting cached copies is safe. "Since cache entries are copies of persistently-stored data, it is usually safe to evict them when the cache runs out of memory" (intro)
- Eviction happens when a write pushes memory over the limit. "If it is greater than the limit, Redis evicts keys according to the chosen eviction policy until the total memory used is back below the limit." (intro)
- noeviction returns errors on writes instead. "noeviction: Keys are not evicted but the server will return an error when you try to execute commands that cache new data." (Eviction policies)
- allkeys-lru is the suggested default for skewed access. "so allkeys-lru is a good default option if you have no reason to prefer any others." (Eviction policies)
- Hit ratio from INFO: keyspace_hits / (keyspace_hits + keyspace_misses). "keyspace_hits / (keyspace_hits + keyspace_misses) * 100" (Using the INFO command)
- Redis LRU is approximated by sampling keys. "It samples a small number of keys at random and then evicts the ones with the longest time since last access." (Approximated LRU algorithm)
- Default sample size 5, tunable. "maxmemory-samples 5" (Approximated LRU algorithm)
- True LRU isn't used because it costs memory. "The reason Redis does not use a true LRU implementation is because it costs more memory." (Approximated LRU algorithm)
- LFU since Redis 4.0. "Starting with Redis 4.0, the Least Frequently Used eviction mode is available." (LFU eviction)
- LFU uses a Morris counter with decay. "it uses a probabilistic counter, called a Morris counter to estimate the object access frequency using just a few bits per object, combined with a decay period so that the counter is reduced over time." (LFU eviction)
- Defaults: counter saturates around a million hits, decays every minute. "Decay the counter every one minute." (LFU eviction)
- LRM since Redis 8.6: only writes update the timestamp. "Starting with Redis 8.6, the Least Recently Modified (LRM) eviction policy is available." (LRM eviction)
- volatile policies need keys with TTLs. "The volatile-xxx policies behave like noeviction if no keys have an associated expiration." (Eviction policies)
- Sampled LRU is close to true LRU on power-law access. "In simulations we found that using a power law access pattern, the difference between true LRU and Redis approximation were minimal or non-existent." (Approximated LRU algorithm)
- Many evictions with a low hit ratio suggest the wrong keys are going. "A high proportion of evictions would suggest that the wrong keys are being evicted too often by your chosen policy" (Using the INFO command)
- The LFU counter is logarithmic: the higher the factor, the more hits it takes to climb. "The higher the factor, the more accesses are needed to reach the maximum." (LFU eviction)

## Visuals worth redrawing

- The LRU-approximation scatter plots (Redis 2.8 vs 3.0 with 5 and 10
  samples).

## My notes

- "latest" docs; pinned by the Redis 8.6 mention.

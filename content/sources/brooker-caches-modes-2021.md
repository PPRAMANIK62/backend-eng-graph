---
id: brooker-caches-modes-2021
title: Caches, Modes, and Unstable Systems
author: Marc Brooker
url: https://brooker.co.za/blog/2021/08/27/caches.html
kind: blog
primary: false
---

## Summary

An AWS engineer's argument that a cache in front of a database gives
the system two stable modes: cache full (fast, low database load) and
cache empty (slow, database overloaded, stays empty). That makes the
system metastable. CPU caches escape this because slow users send less
work; distributed caches usually don't have that feedback.

## Key claims

- The most common use of a cache is to take load off a database. "The most common use of caches in distributed systems is to reduce load on a data store, like a database." (What does this have to do with caches?)
- An empty cache means higher latency and more database load. "What happens when the cache is empty? Well, latency is higher, and load on the backend database is higher." (What does this have to do with caches?)
- Both the full-cache loop and the empty-cache loop are stable. "What’s interesting and important here is that these are both stable loops." (What does this have to do with caches?)
- This is the classic metastable system. "It’s a classic example - probably the most common one of all - of a metastable distributed system." (What does this have to do with caches?)
- Load tests usually don't find the bad mode. "Load testing typically isn’t enough to kick a system in the good loop into the bad loop, and so may not show that the bad loop exists." (It gets worse)
- What misses the cache is harder to cache than what hits it. "Caches extract cacheability." (It gets worse)
- Caches rest on locality or skew assumptions nobody enforces. "Fundamentally, a cache assumes that there’s either some amount of temporal or spatial locality of access" (It gets worse)
- CPU caches are safe because slowness reduces offered load. "That means that slowness caused by empty caches reduces goodput, but also reduces offered load." (But aren’t CPU caches good?)
- Good caches have feedback loops; bad ones are open-loop. "Good caches have feedback loops. Like back pressure, and limited concurrency. Bad caches are typically open-loop." (But aren’t CPU caches good?)
- The load test that finds the bad mode uses a different, heavier-tailed key mix, not just more load. "load tests typically test lots of load, instead of testing the bad pattern for caches, which is load with a different (and heavier-tailed) key frequency distribution from the typical one." (It gets worse)
- The assumption is locality or a non-uniform key distribution. "or their key distribution isn’t uniform" (It gets worse)

## Visuals worth redrawing

- The two loops (cache full → low latency → low DB load; cache empty →
  high latency → high DB load → stays empty). Redrawn as the "two modes"
  figure in `caching`.

## My notes

- Pairs with the AWS Builders' Library "addicted to its cache" story.

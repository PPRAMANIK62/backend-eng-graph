---
id: vattani-cache-stampede-2015
title: Optimal Probabilistic Cache Stampede Prevention
author: Andrea Vattani, Flavio Chierichetti, Keegan Lowenstein
url: https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf
kind: paper
primary: true
---

## Summary

VLDB 2015 (PVLDB vol. 8) paper, from Goodreads engineers and a
theorist, on cache stampedes. Lists the usual fixes (background
recompute, locking, probabilistic early expiration) and proves that
drawing the "look-ahead" gap from an exponential distribution is
optimal. The algorithm, XFetch, needs one parameter and the time the
last recompute took.

## Key claims

- Definition. "When a frequently-accessed cache item expires, multiple requests to that item can trigger a cache miss and start regenerating that same item at the same time." (Abstract)
- Other names. "The cache stampede problem (also called dog-piling, cache miss storm, or cache choking)" (1 Introduction)
- Size of a stampede = request rate × recompute time. "For example, if the cache item is accessed 10 times per second, and the recomputation of the item takes 3 seconds, then 30 requests will recompute the item." (1 Introduction)
- It can cascade, because concurrent recomputes slow each other. "A cache stampede is often referred to as a cascading failure because several concurrent re-computations will increase the time of each individual recomputation by bogging down the system" (1 Introduction)
- Fix 1, external recomputation: a background process regenerates items; it prevents stampedes but is a burden to run. "This solution prevents cache stampedes all together, but it is often discarded because of the burden of maintaining an external process" (1 Introduction)
- Fix 2, locking: only the lock holder recomputes; others must wait, get nothing, or get a stale value. "Upon a cache miss, a request attempts to acquire a lock for that cache key, and regenerates the item only if it acquires it." (1 Introduction)
- Locking isn't fault-tolerant: if the holder dies, nothing is refreshed until the lock expires. "Finally, this approach is not fault-tolerant" (1 Introduction)
- Fix 3, probabilistic early expiration: each request may refresh early, more likely as expiry nears. "The probability of performing an early expiration increases as the request time gets closer to the expiration of the item." (1 Introduction)
- Memcached has no built-in stampede protection. "these systems are usually backed by caches with primitive get/set operations, and which do not provide locking mechanisms, or protection against stampedes (a notable example is the widely-used distributed caching system Memcached [8])." (1 Introduction)
- The exponential gap doesn't need to know the request rate. "A fundamental property we show is that the parameter λ needs not to depend on the rate of requests in order to effectively reduce stampedes." (1 Introduction)
- XFetch: recompute if now − Δ·β·log(rand()) ≥ expiry, where Δ is the last recompute time and β defaults to 1. "XFetch(key, ttl; β = 1)" (Figure 3, 5 Implementation notes)
- Δ is measured on each recompute and stored with the value. "Figure 3 shows how this time ∆ can be recorded upon recomputation of the item and stored as part of the cache value." (5 Implementation notes)
- On a week of Goodreads traffic for one item (10 s recompute), the exponential version mostly had stampedes of size 1 or 2, none larger than 8. "For the exponential distribution, most stampedes have size 1 (i.e., no stampede) or 2, and no stampede is larger than 8." (6 Experiments)
- Locking costs an extra write and needs its own lock TTL. "this approach requires one extra write for the locking mechanism (doubling the number of write operations), tuning a time-to-live for the lock itself (high enough to recompute the item, but less than the re-computation frequency)" (1 Introduction)
- A background recompute job also regenerates items nobody asked for. "the background process would even regenerate cache items that were never requested" (1 Introduction)
- The gap in XFetch is an exponential sample scaled by the recompute time. "The scaled gap −∆β log(rand()) corresponds to sampling from D = Exp( β1 ) and scaling by a factor ∆." (5 Implementation notes)
- The algorithms are proven optimal. "Our algorithms are theoretically optimal and have much better performances than other solutions used in real-world applications." (Abstract)

## Visuals worth redrawing

- Figure 2's idea: each request "pretends" to be a random time in the
  future and refreshes if the item would be expired then.

## My notes

- Uniform early expiration (Perl CHI) is shown to be much worse.

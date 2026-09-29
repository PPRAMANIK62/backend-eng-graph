---
id: meta-cache-made-consistent-2022
title: Cache made consistent
author: Lu Pan (Meta)
url: https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/
kind: blog
primary: true
---

## Summary

Meta's engineering post on cache invalidation in TAO and Memcache: why
a cache that is filled on reads and invalidated on writes has races,
how Polaris measures client-visible inconsistency, and how consistency
tracing found a real bug. TAO went from six nines to ten nines of cache
writes consistent within five minutes.

## Key claims

- Cache invalidation defined: actively removing stale entries when the source changes. "Cache invalidation describes the process of actively invalidating stale cache entries when data in the source of truth mutates." (Defining cache invalidation and cache consistency)
- A mishandled invalidation can leave a wrong value forever. "If a cache invalidation gets mishandled, it can indefinitely leave inconsistent values in the cache that are different from what’s in the source of truth." (Defining cache invalidation and cache consistency)
- A TTL-only cache has no invalidations and is out of scope. "A cache that solely depends on time to live (TTL) to maintain its freshness contains no cache invalidations and, as such, lies out of scope for this discussion." (Defining cache invalidation and cache consistency)
- The core race: a slow fill of x=42 lands after the invalidation for x=43. "Now we have “x=43” in the database and “x=42” in the cache indefinitely." (Defining cache invalidation and cache consistency)
- Versions help, but the newer version can be evicted before the old fill arrives. "But what if the cache entry “x=43 @version=2” gets evicted from cache before “x=42” arrives?" (Defining cache invalidation and cache consistency)
- Inconsistency can look like data loss to users. "In some cases, cache inconsistencies are almost as bad as data loss on a database." (Why do we care about cache consistency at all?)
- Dynamic caches change on both reads (fills) and writes (invalidations). "For a dynamic cache, like TAO and Memcache, data gets mutated on both read (cache fill) and write (cache invalidation) paths." (A mental model of cache invalidation)
- TAO serves over a quadrillion queries a day; at 99% hits that is still over 10 trillion fills a day. "Even if the cache hit rate reaches 99 percent, we would be doing more than 10 trillion cache fills a day." (A mental model of cache invalidation)
- Polaris checks a client-observable invariant: cache eventually matches the database. "“Cache should eventually be consistent with the database” is a typical client-observable invariant that Polaris monitors" (Reliable consistency observability)
- The result: fewer than 1 in 10 billion cache writes inconsistent after five minutes. "Less than 1 out of 10 billion cache writes would be inconsistent in TAO after five minutes." (Reliable consistency observability)
- The bug they found: an error handler dropped the item only if its version was older, but the stale item had the latest version. "It says drop the item in cache, if its version is less than specified." (A real bug we found and fixed this year)
- TAO went from six nines to ten nines of consistency. "we’ve improved TAO’s cache consistency by one measure, from 99.9999 percent (six nines) to 99.99999999 percent (10 nines)." (intro)
- Polaris receives invalidation events and queries the cache replicas as a client. "Polaris pretends to be a cache server and receives cache invalidation events." (Reliable consistency observability)
- The bug started with a rare transient error that sent the invalidation into error handling code. "The cache invalidation ran into a rare transient error on the cache host, which triggered the error handling code." (A real bug we found and fixed this year)
- The stale item had the latest version, so the conditional drop did nothing. "So this code did nothing, leaving stale metadata in cache indefinitely." (A real bug we found and fixed this year)

## Visuals worth redrawing

- The space-time diagram of the fill/invalidation race (x=42 fill, x=43
  write, invalidation arrives first). Redrawn in `cache-invalidation`.

## My notes

- Quotes Phil Karlton's "two hard things" line.

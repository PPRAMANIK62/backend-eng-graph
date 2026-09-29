---
id: microsoft-cache-aside
title: Cache-Aside pattern
author: Microsoft (Azure Architecture Center)
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside
kind: docs
primary: false
---

## Summary

Microsoft's pattern page for cache-aside: read from the cache, on a miss
load from the store and fill the cache; on a write, update the store and
then delete the cached item. Explains why the order of those two write
steps matters, and when the pattern doesn't fit. Example code uses
Redis.

## Key claims

- Read path in three steps. "The application determines whether an item currently resides in the cache by attempting to read from the cache." (Solution, step 1)
- Write path: update the store, then invalidate the cached item. "When an application updates information, it writes the change to the data store and then invalidates the corresponding item in the cache." (Solution)
- Some caching systems do read-through/write-through/write-behind themselves; cache-aside emulates read-through in the application. "An application can emulate the functionality of read-through caching by implementing the Cache-Aside pattern." (Solution)
- Expiry too short causes constant reloads; too long causes stale data. "Don't make the expiration period too short because premature expiration can cause applications to continually retrieve data from the data store and add it to the cache." (Problems and considerations, Lifetime of cached data)
- Cache-aside doesn't guarantee consistency; other writers bypass the cache. "The Cache-Aside pattern doesn't guarantee consistency between the data store and the cache." (Problems and considerations, Consistency)
- Between the write and the next read, a reader can miss or see stale data; write-through updates both in one write. "Between the write and the next read, a reader can experience a cache miss or briefly see stale data." (Problems and considerations, Staleness after writes)
- Local in-process caches diverge between instances. "This data can quickly become inconsistent between caches, so you might need to expire data in a private cache and refresh it more frequently." (Problems and considerations, Local caching)
- Not worth it when most requests miss. "Most requests don't experience a cache hit. In this situation, the overhead of checking the cache and loading data into it might outweigh the benefits of caching." (When to use this pattern)
- Update the store before deleting from the cache; the other order lets a reader put the old value back. "The order of the steps is important. Update the data store before removing the item from the cache." (Example, note)
- Why: a read in between misses and reloads the old value. "The cache miss causes the application to retrieve the outdated item from the data store and add it back to the cache." (Example, note)
- The example sets a five-minute expiry and doesn't cache nulls. "// Avoid caching a null value." (Example code)
- Other processes can change the store behind the cache's back. "For example, an external process can change an item in the data store at any time." (Problems and considerations, Consistency)

## Visuals worth redrawing

- The three-step read diagram (app, cache, data store).

## My notes

- The "update then delete" note fixes one race but not the one where a
  slow reader writes back an old value after the delete (see
  nishtala-memcache-2013 leases, meta-cache-made-consistent-2022).

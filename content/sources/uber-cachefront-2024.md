---
id: uber-cachefront-2024
title: How Uber Serves Over 40 Million Reads Per Second from Online Storage Using an Integrated Cache
author: Eli Pozniansky, Piyush Patel, Preetham Narayanareddy (Uber)
url: https://www.uber.com/blog/how-uber-serves-over-40-million-reads-per-second-using-an-integrated-cache/
kind: blog
primary: true
---

## Summary

Uber's CacheFront: a Redis cache built into the query layer of their
Docstore database. Invalidation comes from change data capture (Flux
tailing the MySQL binlog), with TTL as a backstop, row timestamps as
versions to stop stale writes, negative caching, and a shadow-read mode
that measures consistency.

## Key claims

- Without invalidation, entries just expire after the TTL. "Without any explicit cache invalidation, cache entries will expire with the configured TTL (by default, 5 minutes)." (Cache Invalidation)
- Lowering the TTL costs hit rate without much consistency gain. "The default TTL could be lowered however this would reduce our cache hit rate without meaningfully improving consistency guarantees." (Cache Invalidation)
- Conditional updates can't be invalidated in the write path, because you don't know which rows change. "our caching layer can’t determine which rows would be affected by a conditional update until the actual rows are updated in the database engine." (Conditional Update)
- CDC: Flux tails the binlog and a consumer invalidates or upserts rows in Redis. "Flux tails the MySQL binlog events for each of the clusters in our storage engine layer and publishes the events to a list of consumers." (Leveraging Change Data Capture for Cache Invalidation)
- The cache becomes consistent within seconds instead of minutes. "As a result, we were able to make the cache consistent within seconds of the database change, as opposed to minutes." (Leveraging Change Data Capture for Cache Invalidation)
- Binlogs only carry committed data. "by using binlogs, we don’t run the risk of letting uncommitted transactions pollute the cache." (Leveraging Change Data Capture for Cache Invalidation)
- Read-path fills and invalidation writes race; a stale row can overwrite a newer one. "it is possible that we inadvertently write a stale row to the cache, overwriting the newest value that was retrieved from the database." (Deduplicating Cache Writes Between Query Engine and Flux)
- Fix: use the row timestamp as a version, compared in an atomic Lua script. "we deduplicate writes based on the timestamp of the row set in MySQL, which effectively serves as its version." (Deduplicating Cache Writes Between Query Engine and Flux)
- CDC is still eventually consistent; an explicit invalidate API gives read-your-own-writes for point writes. "it still provides us with eventual consistency semantics." (Stronger Consistency Guarantees for Point Writes)
- Measured by shadowing reads and comparing with the database: 99.99% consistent. "With the addition of cache invalidation using Flux, the cache is 99.99% consistent." (Compare Cache)
- Negative caching of non-existent rows. "we built negative caching into Cachefront." (Negative Caching)
- One large use case: over 6M RPS at a 99% hit rate. "one of our largest initial use cases drives over 6M RPS with a 99% cache hit rate" (Results)
- Caching is opt-in because invalidation can fail or lag. "For example, cache invalidation may fail or lag behind database writes." (High-Level Architecture)
- Strongly consistent flows bypass the cache. "If certain flows require strong consistency (such as getting items in an eater’s cart) then the cache can be bypassed" (High-Level Architecture)
- Most users expect changes faster than the TTL. "While this may be OK in some cases, most users expect changes to be reflected faster than the TTL." (Cache Invalidation)
- Explicit invalidation after writes for read-your-own-writes. "we added a dedicated API to the query engine that lets our users explicitly invalidate the cached rows after the corresponding writes have completed." (Stronger Consistency Guarantees for Point Writes)

## Visuals worth redrawing

- The read/write path with Flux feeding invalidations into Redis.

## My notes

- The page shows 2024 as its year and names the authors.

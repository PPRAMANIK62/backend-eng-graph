---
id: oracle-coherence-caching-data-sources
title: Caching Data Sources (Oracle Coherence 14.1.2, Developing Applications, chapter 15)
author: Oracle
url: https://docs.oracle.com/en/middleware/fusion-middleware/coherence/14.1.2/develop-applications/caching-data-sources.html
kind: docs
primary: true
---

## Summary

The Coherence manual chapter on putting a cache in front of a data
source, with definitions of read-through, write-through, write-behind
and refresh-ahead from the team that builds the product, plus what
write-behind demands of the application.

## Key claims

- Read-through: on a miss the cache itself loads from the data source. "This is called Read-Through caching." (Read-Through Caching)
- Write-through: the put doesn't return until the data source has it. "the operation does not complete (that is, the put does not return) until Coherence has gone through the cache store and successfully stored the data to the underlying data source." (Write-Through Caching)
- Write-through doesn't speed up writes. "This does not improve write performance at all, since you are still dealing with the latency of the write to the data source." (Write-Through Caching)
- Write-behind writes to the source asynchronously after a delay. "In the Write-Behind scenario, modified cache entries are asynchronously written to the data source after a configured delay" (Write-Behind Caching)
- Several changes to one entry within the delay are written once. "The writes, which are typically much more expensive operations, are often reduced because multiple changes to the same object within the write-behind interval are" (Write-Behind Caching)
- Database updates happen outside the cache transaction, so they must not fail or rollbacks must be handled. "This implies that the database transactions must never fail; if this cannot be guaranteed, then rollbacks must be accommodated." (Write-Behind Requirements)
- Write-behind can reorder updates. "As write-behind may re-order database updates, referential integrity constraints must allow out-of-order updates." (Write-Behind Requirements)
- Conflicts with other writers of the same database can't be prevented. "there is no way to guarantee that a write-behind transaction does not conflict with an external update." (Write-Behind Requirements)
- Until the queue drains, the cache is the system of record. "Because write-behind effectively makes the cache the system-of-record (until the write-behind queue has been written to disk), business regulations must allow cluster-durable (rather than disk-durable) storage of data and transactions." (Write-Behind Requirements)
- Refresh-ahead reloads recently used entries in the background before they expire. "Coherence allows a developer to configure a cache to automatically and asynchronously reload (refresh) any recently accessed cache entry from the cache loader before its expiration." (Refresh-Ahead Caching)
- Refresh-ahead only pays off if the cache predicts well. "Refresh-ahead offers reduced latency compared to read-through, but only if the cache can accurately predict which cache items are likely to be needed in the future." (Refresh-Ahead versus Read-Through)
- In cache-aside, concurrent misses each hit the database. "This can result in multiple database visits if different application threads perform this processing at the same time." (Read-Through/Write-Through versus Cache-Aside)
- Write-behind gives higher throughput and less database load than write-through, if its requirements are met. "If the requirements for write-behind caching can be satisfied, write-behind caching may deliver considerably higher throughput and reduced latency compared to write-through caching." (Write-Behind versus Write-Through)
- Many entries can go to the database in one transaction. "Additionally, writes to multiple cache entries may be combined into a single database transaction" (Write-Behind Caching)
- With inline caching only the cache servers touch the database. "Furthermore, application code is fully managed on the cache server which means that only a controlled subset of nodes directly accesses the database (resulting in more predictable load and security)." (Read-Through/Write-Through versus Cache-Aside)
- Refresh-ahead triggers on access near expiry; after expiry it's a synchronous read. "The asynchronous refresh is only triggered when an object that is sufficiently close to its expiration time is accessed" (Refresh-Ahead Caching)
- Wrong refresh-ahead guesses cost database load. "The higher the rate of inaccurate prediction, the greater the impact is on throughput (as more unnecessary requests are sent to the database)" (Refresh-Ahead versus Read-Through)
- Inline caching keeps database code out of the clients. "Additionally, this decouples cache clients from database logic" (Read-Through/Write-Through versus Cache-Aside)

## Visuals worth redrawing

- Figures 15-1 to 15-3 (read-through, write-through, write-behind flows).

## My notes

- Version pinned: Coherence 14.1.2 docs.

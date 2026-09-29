---
id: aws-database-caching-strategies
title: Caching patterns (Database Caching Strategies Using Redis, AWS whitepaper)
author: Amazon Web Services
url: https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html
kind: docs
primary: false
---

## Summary

A short AWS whitepaper page on cache-aside (lazy loading) and
write-through for Redis or Memcached in front of a database, with the
trade-offs of each and the advice to combine them with a TTL.

## Key claims

- Cache-aside is reactive, write-through proactive. "Two common approaches are cache-aside or lazy loading (a reactive approach) and write-through (a proactive approach)." (Caching patterns)
- Cache-aside is the most common. "A cache-aside cache is the most common caching strategy available." (Cache-Aside (Lazy Loading))
- Cache-aside only stores what's requested. "The cache contains only data that the application actually requests, which helps keep the cache size cost-effective." (Cache-Aside (Lazy Loading))
- The first read after a miss pays extra round trips. "some overhead is added to the initial response time because additional roundtrips to the cache and database are needed." (Cache-Aside (Lazy Loading))
- Write-through updates the cache right after the database. "the cache is proactively updated immediately following the primary database update." (Write-Through)
- Write-through is almost always combined with lazy loading. "The write-through pattern is almost always implemented along with lazy loading." (Write-Through)
- Write-through fills the cache with data nobody reads. "A disadvantage of the write-through approach is that infrequently-requested data is also written to the cache, resulting in a larger and more expensive cache." (Write-Through)
- Combine both with an expiration. "A proper caching strategy includes effective use of both write-through and lazy loading of your data and setting an appropriate expiration for the data to keep it relevant and lean." (Write-Through)

## Visuals worth redrawing

None beyond the usual cache-aside diagram.

## My notes

- Note this "write-through" is the application writing both, not the
  cache writing the database (the Coherence meaning).

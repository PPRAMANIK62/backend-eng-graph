---
id: aws-caching-challenges
title: Caching challenges and strategies
author: Matt Brinkley, Jas Chhabra (Amazon Builders' Library)
url: https://aws.amazon.com/builders-library/caching-challenges-and-strategies/
kind: blog
primary: true
---

## Summary

Amazon engineers on what goes wrong once a service leans on a cache:
the service gets "addicted" to it, and a cold or failed cache sends a
surge to the dependency. Covers local vs external caches, inline
(read-through) vs side caches, TTLs (soft and hard), negative caching,
security, and request coalescing for thundering herds. Primary in the
sense that it's the builders' own operating experience.

## Key claims

- A cache can turn from helper into a hard dependency. "We’ve just described a service that has become addicted to its cache." (The ecstasy and the agony of caches)
- The root problem is the cache's modal behavior. "At the heart of this issue is the modal behavior introduced by the cache, with differing behavior depending on whether a given object is cached." (The ecstasy and the agony of caches)
- A cache only helps if results are reused across requests. "If each request typically requires a unique query to the dependent service with unique-per-request results, then a cache would have a negligible hit rate and the cache does no good." (When we use caching)
- Cached data drifts from the source, so clients must tolerate eventual consistency. "Cached data necessarily grows inconsistent with the source over time, so caching can only be successful if both the service and its clients compensate accordingly." (When we use caching)
- Local (in-process) caches differ from server to server: a coherence problem. "One is that the cached data will be inconsistent from server to server across its fleet, manifesting a cache coherence problem." (Local caches)
- With local caches, downstream load grows with fleet size. "Another shortcoming is that the downstream load is now proportional to the service's fleet size" (Local caches)
- New servers start empty: cold start. "In-memory caches are also susceptible to “cold start” issues." (Local caches)
- External caches (Memcached, Redis) reduce coherence and cold-start issues but add a fleet to run. "An external cache stores cached data in a separate fleet, for example using Memcached or Redis." (External caches)
- Falling back to the dependency during a long cache outage can brown it out. "During an extended cache outage, this will cause an atypical spike in traffic to the downstream service, leading to throttling or brownout of that dependent service and ultimately reducing availability." (External caches)
- Adding cache nodes needs consistent hashing in the client. "not all cache client libraries provide consistent hashing, which is necessary to add nodes to the cache fleet and redistribute cached data." (External caches)
- Treat cached data's format like a persistent format across deploys. "Cached data is treated as if it were in a persistent store." (External caches)
- Inline caches (read-through/write-through) vs side caches. "Inline caches, or read-through/write-through caches, embed cache management into the main data access API, making cache management an implementation detail of that API." (Inline vs. side caches)
- With a side cache, the application itself checks and fills the cache. "With side caches, the application code directly manipulates the cache before and after calls to the data source" (Inline vs. side caches)
- The most common expiration is an absolute TTL per object. "The most common policy uses an absolute time-based expiration (that is, it associates a time to live (TTL) with each object as it is loaded)." (Cache expiration)
- The most common eviction policy is LRU. "The most common eviction policy is Least Recently Used (LRU)." (Cache expiration)
- Measure hits, misses, size and downstream calls. "Our preferred way to do this is to emit service metrics on cache hits and misses, total cache size, and number of requests to downstream services." (Cache expiration)
- Soft TTL and hard TTL: refresh after the soft one, keep serving until the hard one if the dependency is down. "The client will attempt to refresh cached items based on the soft TTL, but if the downstream service is unavailable or otherwise doesn’t respond to the request, then the existing cache data will continue to be used until the hard TTL is reached." (Cache expiration)
- Negative caching: cache errors too, with their own TTL. "Another option we employ is to cache the error response (that is, we use a “negative cache”) using a different TTL than positive cache entries, and propagate the error to the client." (Other considerations)
- Not caching negative responses has caused real outages. "We have seen real-world examples in which a failure to cache negative responses led to increased failure rates and faults." (Other considerations)
- Caches can be poisoned and leak through timing. "Cached values are returned faster than uncached values, so an attacker can use response time to gain information about requests that other clients or tenets are making." (Other considerations)
- Thundering herd: many clients need the same uncached item at once; fix with request coalescing. "To remedy this issue we use request coalescing, where the servers or external cache ensure that only one pending request is out for uncached resources." (Other considerations)
- Test with the cache disabled. "Run load tests with caches disabled to validate this." (Amazon best practices and considerations)
- Once the cache works, dependencies get scaled down to the smaller load. "Dependencies reduce their fleet sizes accordingly, and the database is scaled down." (The ecstasy and the agony of caches)
- Discarding entries on a format change can cause mass refreshes. "Detecting a version format mismatch and discarding the cached data can lead to mass refreshes of caches, which can lead to dependent service throttling or brownouts." (External caches)
- Keep the service up without the cache by shedding load, capping downstream requests or serving stale data. "In many cases, this could mean trading some of your availability to ensure that your servers and your dependent services don’t brown out (for example by shedding load, capping requests to dependent services, or serving stale data)." (Amazon best practices and considerations)
- An external cache fleet has its own availability, often lower than the service it fronts. "The availability characteristics of the cache fleet will be different from the dependent service it is acting as a cache for." (External caches)
- Caches can be poisoned, so one bad entry reaches every client that reads it. "Caches are also susceptible to poisoning attacks, in which a vulnerability in the downstream protocol allows an attacker to populate a cache with a value under their control." (Other considerations)

## Visuals worth redrawing

None on the page worth redrawing.

## My notes

- No year shown on the page. The authors' bios are there.

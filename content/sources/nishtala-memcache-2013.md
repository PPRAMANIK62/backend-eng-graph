---
id: nishtala-memcache-2013
title: Scaling Memcache at Facebook
author: Rajesh Nishtala, Hans Fugal, Steven Grimm, Marc Kwiatkowski, Herman Lee, Harry C. Li, Ryan McElroy, Mike Paleczny, Daniel Peek, Paul Saab, David Stafford, Tony Tung, Venkateshwaran Venkataramani
url: https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf
kind: paper
primary: true
---

## Summary

NSDI 2013 paper from the Facebook team that ran memcached as a
look-aside cache in front of MySQL at very large scale. The source for
cache-aside with delete-on-write, leases (against stale sets and
thundering herds), the Gutter pool for failed servers, invalidation
through the database commit log (mcsqueal), cold cluster warmup, and
measured miss rates and invalidation latency.

## Key claims

- Memcache is a demand-filled look-aside cache: read from cache, on a miss read the database and fill. "we use memcache as a demand-filled look-aside cache as shown in Figure 1." (2 Overview)
- On a write, the web server updates the database, then deletes the key. "For write requests, the web server issues SQL statements to the database and then sends a delete request to memcache that invalidates any stale data." (2 Overview)
- Delete rather than update, because deletes are idempotent. "We choose to delete cached data instead of updating it because deletes are idempotent." (2 Overview)
- The cache isn't the source of truth, so it may evict. "Memcache is not the authoritative source of the data and is therefore allowed to evict cached data." (2 Overview)
- Staleness is a tuned parameter, traded for protecting the database. "We are willing to expose slightly stale data in exchange for insulating a backend storage service from excessive load." (2 Overview)
- Users read far more than they write. "users consume an order of magnitude more content than they create." (2 Overview)
- One popular page fetched on average 521 distinct items from memcache. "loading one of our popular pages results in an average of 521 distinct items fetched from memcache." (3.1)
- Keys are spread over servers by consistent hashing. "Items are distributed across the memcached servers through consistent hashing" (3.1)
- Leases address stale sets and thundering herds. "We introduce a new mechanism we call leases to address two problems: stale sets and thundering herds." (3.2.1)
- A stale set comes from reordered concurrent updates. "This can occur when concurrent updates to memcache get reordered." (3.2.1)
- The thundering herd they mean: heavy reads and writes on one key, writes keep invalidating. "As the write activity repeatedly invalidates the recently set values, many reads default to the more costly path." (3.2.1)
- A lease is a 64-bit token for the key, given on a miss, required on the set. "The lease is a 64-bit token bound to the specific key the client originally requested." (3.2.1)
- A delete invalidates the lease, so a late set fails. "Verification can fail if memcached has invalidated the lease token due to receiving a delete request for that item." (3.2.1)
- Tokens are handed out at most once every 10 seconds per key; others are told to wait. "By default, we configure these servers to return a token only once every 10 seconds per key." (3.2.1)
- The lease holder usually fills within milliseconds. "Typically, the client with the lease will have successfully set the data within a few milliseconds." (3.2.1)
- Measured effect on keys prone to herds: peak database query rate 17K/s without leases, 1.3K/s with. "Without leases, all of the cache misses resulted in a peak database query rate of 17K/s. With leases, the peak database query rate was 1.3K/s." (3.2.1)
- Deleted values are kept briefly and can be returned marked stale. "A get request can return a lease token or data that is marked as stale." (3.2.1, Stale values)
- Low-churn and high-churn keys interfere, so they're split into pools. "low-churn keys that are still valuable are evicted before high-churn keys that are no longer being accessed." (3.2.2)
- Losing cache servers pushes load to the backend and can cascade. "The inability to fetch data from memcache results in excessive load to backend services that could cause further cascading failures." (3.3)
- Gutter: about 1% of servers take over for failed ones; entries expire quickly. "Gutter accounts for approximately 1% of the memcached servers in a cluster." (3.3)
- Rehashing a failed server's keys onto the rest risks cascades because of hot keys. "For example, a single key can account for 20% of a server’s requests." (3.3)
- Invalidation daemons (mcsqueal) read committed SQL and broadcast deletes. "Each daemon inspects the SQL statements that its database commits, extracts any deletes, and broadcasts these deletes to the memcache deployment in every frontend cluster in that region." (4.1)
- Only 4% of deletes actually remove cached data. "only 4% of all deletes issued result in the actual invalidation of cached data." (4.1)
- Putting invalidations in the commit log lets them be replayed. "embedding invalidations in SQL statements, which databases commit and store in reliable logs, allows mcsqueal to simply replay invalidations that may have been lost or misrouted." (4.1)
- Cold cluster warmup race: a delete-with-hold-off blocks adds for two seconds. "By default, all deletes to the cold cluster are issued with a two second hold-off." (4.3)
- Cold clusters come up in hours instead of days. "With this system cold clusters can be brought back to full capacity in a few hours instead of a few days." (4.3)
- Across regions, a web server invalidating a replica region too early races the replication stream. "Subsequent queries for the data from the replica region will race with the replication stream thereby increasing the probability of setting stale data into memcache." (5)
- As a cache, deleting or evicting is always safe for consistency. "As a cache, deleting or evicting keys is always a safe action; it may induce more load on databases, but does not impair consistency." (5)
- memcached evicts LRU within a slab class. "Once a memcached server can no longer allocate free memory, storage for new items is done by evicting the least recently used (LRU) item within that slab class." (6.2)
- Expired entries are removed lazily, on get or at the LRU tail. "Memcached lazily evicts such entries by checking expiration times when serving a get request for that item or when they reach the end of the LRU." (6.3)
- A restarted memcached takes hours to warm up. "A memcached server can reach 90% of its peak hit rate within a few hours." (6.4)
- Pool miss rates (Table 2): wildcard 1.76%, app 7.85%, replicated 0.053%, regional 6.35%. (Table 2, 7.2)
- Invalidation reliability: four 9s within 1 second and five 9s after an hour in the master region; three 9s within a second and four 9s within 10 minutes between replica regions. "achieve four 9s of reliability within 1 second and five 9s after one hour." (7.3)
- Upgrading memcached servers took over 12 hours because of the database load from cold caches. "it can take us over 12 hours to upgrade a set of memcached servers as the resulting database load needs to be managed carefully." (6.4)
- Cold clusters fill from a warm cluster instead of the databases. "to retrieve data from the “warm cluster” (i.e. a cluster that has caches with normal hit rates) rather than the persistent storage." (4.3)
- The app pool holds content that fades within hours, so it misses more. "This pool tends to have content that is accessed for a few hours and then fades away in popularity in favor of newer content." (7.2)
- Leases work like load-link/store-conditional. "Leases prevent stale sets in a manner similar to how load-link" (3.2.1)
- Invalidations sent by web servers were hard to fix when misrouted. "In the past, this would often require a rolling restart of the entire memcache infrastructure" (4.1)
- The writing web server also invalidates its own cluster, for read-after-write. "As an optimization, a web server that modifies data also sends invalidations to its own cluster" (4.1)
- Invalidating from the storage side avoids invalidations arriving before replication does. "it avoids a race condition in which an invalidation arrives before the data has been replicated from the master region." (5)
- The invalidation daemons also run with the replica databases. "The aforementioned system for managing deletes in Section 4.1 is also deployed with the replica databases to broadcast the deletes to memcached servers in the replica regions." (5)
- Remote markers send readers to the master region when the local replica may be stale. "The presence of the marker indicates that data in the local replica database are potentially stale and the query should be redirected to the master region." (5)
- Applications that can use stale data don't wait. "Applications that can continue to make forward progress with stale data do not need to wait for the latest value to be fetched from the databases." (3.2.1)
- Invalidation latency was measured by sampling deletes. "To monitor this health, we sample one" (7.3; one out of a million deletes)
- The sampled keys are later checked in every frontend cluster. "We subsequently query the contents of memcache across all frontend clusters at regular intervals for the sampled keys and log an error if an item remains cached despite a delete that should have invalidated it." (7.3)

## Visuals worth redrawing

- Figure 1: look-aside read path (get, miss, select, set) and write path
  (update, delete). Redrawn in `caching-patterns`.
- Figure 6: invalidation pipeline from MySQL commit log to mcsqueal to
  mcrouter to memcache.

## My notes

- "Thundering herd" here means repeated invalidation of a hot key, which
  is what most people now call a cache stampede.

---
id: redis-distributed-locks
title: Distributed Locks with Redis
author: Redis (original text by Salvatore Sanfilippo)
url: https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/
kind: docs
primary: true
---

## Summary

The Redis docs page that specifies Redlock: the single-instance lock
(SET with NX and PX, released by a compare-and-delete), why a
replicated master with failover isn't safe, the five-node majority
algorithm with its validity time, delayed restarts vs fsync, and lock
extension. It now ends with a disclaimer pointing at the Kleppmann and
antirez debate and advising fencing tokens. Read at the Redis 8.4 era
(it mentions DELEX, added in 8.4).

## Key claims

- The three properties it aims for: mutual exclusion, deadlock-free, fault tolerant. "Safety property: Mutual exclusion. At any given moment, only one client can hold a lock." (Safety and Liveness Guarantees)
- A master with an async replica can hand the same lock to two clients after failover. "By doing so we can't implement our safety property of mutual exclusion, because Redis replication is asynchronous." (Why Failover-based Implementations Are Not Enough)
- Single-instance acquire: set only if absent, with a millisecond expiry and a unique value. "SET resource_name my_random_value NX PX 30000" (Correct Implementation with a Single Instance)
- The value must be unique per client and request. "This value must be unique across all clients and all lock requests." (Correct Implementation with a Single Instance)
- Release only if the value still matches, so you never delete someone else's lock; DELEX does this since Redis 8.4, before that a Lua script. "The DELEX command was introduced in Redis 8.4." (Correct Implementation with a Single Instance)
- Plain DEL is unsafe. "Using just DEL is not safe as a client may remove another client's lock." (Correct Implementation with a Single Instance)
- The single instance is acceptable when an occasional race is fine. "this is actually a viable solution in applications where a race condition from time to time is acceptable" (Correct Implementation with a Single Instance)
- Redlock uses N independent masters, N=5 in the examples. "In our examples we set N=5, which is a reasonable value" (The Redlock Algorithm)
- Acquire on all in parallel with a short per-node timeout; success only on a majority and within the validity time. "If and only if the client was able to acquire the lock in the majority of the instances (at least 3), and the total time elapsed to acquire the lock is less than lock validity time, the lock is considered to be acquired." (The Redlock Algorithm, step 3)
- Validity left is the initial validity minus elapsed time. "its validity time is considered to be the initial validity time minus the time elapsed" (step 4)
- On failure, unlock every instance. "it will try to unlock all the instances (even the instances it believed it was not able to lock)." (step 5)
- The timing assumption: clocks tick at about the same rate. "the local time in every process updates at approximately at the same rate, with a small margin of error compared to the auto-release time of the lock." (Is the Algorithm Asynchronous?)
- Mutual exclusion holds only if the holder finishes within the validity time minus drift. "it is guaranteed only as long as the client holding the lock terminates its work within the lock validity time (as obtained in step 3), minus some time" (Is the Algorithm Asynchronous?)
- Minimum validity formula. "MIN_VALIDITY=TTL-(T2-T1)-CLOCK_DRIFT" (Safety Arguments)
- A node restarting without persistence can let a second client get a majority. "One of the instances where the client was able to acquire the lock is restarted, at this point there are again 3 instances that we can lock for the same resource" (Performance, Crash Recovery and fsync)
- Default AOF fsync every second can lose the key on power loss; fsync always fixes it at a cost. "we need to enable fsync=always in the persistence settings." (Performance, Crash Recovery and fsync)
- Alternative: keep a crashed node out for longer than the max TTL (delayed restart). "we just need to make an instance, after a crash, unavailable for at least a bit more than the max TTL we use." (Performance, Crash Recovery and fsync)
- Disclaimer: implement fencing tokens. "You should implement fencing tokens." (Disclaimer about consistency)
- Disclaimer: TTL expiry doesn't use a monotonic clock. "Redis is not using monotonic clock for TTL expiration mechanism." (Disclaimer about consistency)
- Don't assume a lock is kept while its holder is alive. "don´t assume that a lock is retained as long as the process that had acquired it is alive." (Disclaimer about consistency)

## Visuals worth redrawing

- None on the page; the five-node acquire with the validity window is
  worth drawing.

## My notes

- The page links Gray and Cheriton's leases paper for the bounded-drift
  assumption.
- "don´t" uses an acute accent on the page, copied as is.

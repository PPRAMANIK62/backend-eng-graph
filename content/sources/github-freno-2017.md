---
id: github-freno-2017
title: "Mitigating replication lag and reducing read load with freno"
author: Shlomi Noach, Miguel Fernández (GitHub)
url: https://github.blog/engineering/infrastructure/mitigating-replication-lag-and-reducing-read-load-with-freno/
kind: blog
primary: true
---

## Summary

GitHub's engineering post (2017) on living with asynchronous MySQL
replication while serving reads from replicas. How big background writes
cause lag, how they split and throttle them, and how the same lag
numbers let them send reads-after-writes to replicas instead of the
primary.

## Key claims

- The setup: async MySQL, reads from replicas. "We run classic MySQL master-replica setups, where writes go to the master, and replicas replay master’s changes asynchronously." (intro)
- Replication lag defined. "There is a nonzero delay between the point in time where changes are made visible on a master and the time where those changes are visible on some replica or on all replicas. This delay is the replication lag." (intro)
- Lagging replicas are pulled from serving after a few seconds; they expect sub-second lag. "Our automation removes lagging replicas from the serving pool after a few seconds, but even those few seconds matter: we commonly expect sub-second replication lag." (intro)
- Big operations cause lag. "Such large operations may easily introduce replication lag: while a replica is busy applying a change to some 100,000 rows, its data quickly becomes stale, and by the time it completes processing it’s already lagging and requires even more time to catch up." (intro)
- A replica has to handle reads and the replication stream at once. "On a busy hour a heavily loaded replica may still find it too difficult to manage both read traffic and massive changes coming from the replication stream." (Running subtasks)
- They split big writes into small chunks. "Any big update is broken into small segments, subtasks, of some 50 or 100 rows each." (Running subtasks)
- And throttle between chunks by checking lag. "If lag is higher than desired, we throttle: we stall the operation, and keep polling lag until we’re satisfied it is low enough for us." (Throttling)
- Semisync doesn't bound lag. "Closest would be semisynchronous replication, but even that doesn’t guarantee replication lag to be caught up nor be within reasonable margins." (Throttling)
- Heartbeat measurement: pt-heartbeat writes a timestamp every 100 ms. "A common tool part of Percona Toolkit called pt-heartbeat inserts a timestamp each 100ms in the master." (The old GitHub throttler)
- Reads on the primary come from the consistent-read problem. "Reads from the master are typically due to the consistent-read problem: a change has been made, and needs to be immediately visible in the next read." (Master reads)
- The old rule: read from replicas only if the last write was five or more seconds ago. "Before freno, web and API GET requests were routed to the replicas only if the last write happened more than five seconds ago." (Master reads)
- The reasoning behind five seconds. "if the replica is lagging above five seconds, it means that there are worse problems to handle than a read inconsistency" (Master reads)
- The new rule: compare cluster lag with time since last write. "Now, upon a GET request after a write, the app asks freno for the maximum replication lag across the cluster, and if the reported value is below the elapsed time since the last write (up to some granularity), the read is known to be safe and can be routed to a replica." (Master reads)
- Result: about 30% of those reads moved off the primary. "By applying that strategy, we managed to route to the replicas ~30% of the requests that before were routed to the master." (Master reads)
- Background jobs wait until the data has replicated, usually well under a second. "This happens in less than 600ms 95% of the time." (Master reads)
- Lag can't grow faster than the clock, so the value can be cached briefly. "replication delay cannot grow faster than the clock, and we used this fact to optimize access" (Master reads)

## Visuals worth redrawing

None.

## My notes

None.

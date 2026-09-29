---
id: vogels-eventually-consistent-2008
title: "Eventually Consistent, Revisited"
author: Werner Vogels
url: https://www.allthingsdistributed.com/2008/12/eventually_consistent.html
kind: blog
primary: true
---

## Summary

Amazon's CTO on consistency in replicated systems (the ACM Queue version
of the article, reposted on his blog in 2008). Client-side models
(strong, weak, eventual, causal, read-your-writes, session, monotonic
reads and writes), the server side as N, W and R, and how
primary-backup databases with readable backups are already eventually
consistent.

## Key claims

- Replication is used for performance and availability, and clients see its side effects. "Although replication brings us closer to our goals, it cannot achieve them in a perfectly transparent manner; under a number of conditions the customers of these services will be confronted with the consequences of using replication techniques inside the services." (intro)
- The inconsistency window. "The period between the update and the moment when it is guaranteed that any observer will always see the updated value is dubbed the inconsistency window." (Client-side Consistency)
- Read-your-writes. "Read-your-writes consistency. This is an important model where process A, after it has updated a data item, always accesses the updated value and will never see an older value." (Client-side Consistency)
- It's a special case of causal consistency. "This is a special case of the causal consistency model." (Client-side Consistency)
- Session consistency and its limit. "If the session terminates because of a certain failure scenario, a new session needs to be created and the guarantees do not overlap the sessions." (Client-side Consistency)
- Monotonic reads. "Monotonic read consistency. If a process has seen a particular value for the object, any subsequent accesses will never return any previous values." (Client-side Consistency)
- Those two are the most wanted. "From a practical point of view these two properties (monotonic reads and read-your-writes) are most desirable in an eventual consistency system, but not always required." (Client-side Consistency)
- Primary-backup databases: sync makes the replica part of the transaction, async ships logs later. "In synchronous mode the replica update is part of the transaction. In asynchronous mode the updates arrive at the backup in a delayed manner, often through log shipping." (Client-side Consistency)
- Promoting a backup after async loss gives old values. "In the latter mode if the primary fails before the logs are shipped, reading from the promoted backup will produce old, inconsistent values." (Client-side Consistency)
- Reading from backups is eventual consistency. "RDBMSs have started to provide the ability to read from the backup, which is a classical case of providing eventual consistency guarantees in which the inconsistency windows depend on the periodicity of the log shipping." (Client-side Consistency)
- N, W, R: sync primary-backup is N=2, W=2, R=1; async with backup reads is N=2, W=1, R=1. "In asynchronous replication with reading from the backup enabled, N=2, W=1, and R=1. In this case R+W=N, and consistency cannot be guaranteed." (Server-side Consistency)
- If a write needs W nodes and they aren't there, the write fails. "With N=3 and W=3 and only two nodes available, the system will have to fail the write." (Server-side Consistency)
- Stickiness gives read-your-writes and monotonic reads. "If this is the same server every time, then it is relatively easy to guarantee read-your-writes and monotonic reads." (Server-side Consistency)
- Clients can do it themselves with versions. "By adding versions on writes, the client discards reads of values with versions that precede the last-seen version." (Server-side Consistency)
- User-perceived consistency on a web site. "In this scenario the inconsistency window needs to be smaller than the time expected for the customer to return for the next page load." (Summary)
- Strong consistency from the client's view. "After the update completes, any subsequent access (by A, B, or C) will return the updated value." (Client-side Consistency)
- The definition of eventual consistency. "the storage system guarantees that if no new updates are made to the object, eventually all accesses will return the last updated value." (Client-side Consistency)
- Without failures the window can be bounded by delays, load and replica count. "If no failures occur, the maximum size of the inconsistency window can be determined based on factors such as communication delays, the load on the system, and the number of replicas involved in the replication scheme." (Client-side Consistency)
- DNS is the best-known example. "The most popular system that implements eventual consistency is DNS (Domain Name System)." (Client-side Consistency)
- Monotonic writes. "In this case the system guarantees to serialize the writes by the same process." (Client-side Consistency)
- W + R > N means read and write sets overlap. "If W+R > N, then the write set and the read set always overlap and one can guarantee strong consistency." (Server-side Consistency)
- W + R <= N means eventual. "Weak/eventual consistency arises when W+R <= N, meaning that there is a possibility that the read and write set will not overlap." (Server-side Consistency)
- The shopping cart keeps taking writes during a partition and merges later. "The cart application assists the storage system with merging the carts once the partition has healed." (Server-side Consistency)
- Two reasons to accept inconsistency. "Data inconsistency in large-scale reliable distributed systems has to be tolerated for two reasons: improving read and write performance under highly concurrent conditions; and handling partition cases where a majority model would render part of the system unavailable even though the nodes are up and running." (Summary)
- Vogels lists causal, read-your-writes, session and monotonic consistency as variations of eventual consistency. "The eventual consistency model has a number of variations that are important to consider:" (Client-side Consistency)
- ACID consistency is a different kind of guarantee. "In ACID, consistency relates to the guarantee that when a transaction is finished the database is in a consistent state" (Historical Perspective)
- DNS spreads updates through time-controlled caches. "Updates to a name are distributed according to a configured pattern and in combination with time-controlled caches; eventually, all clients will see the update." (Client-side Consistency)

## Visuals worth redrawing

None.

## My notes

- ACM Queue's own copy (queue.acm.org/detail.cfm?id=1466448) was
  blocked when opened; this is the author's repost of the same text.

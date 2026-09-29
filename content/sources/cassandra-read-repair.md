---
id: cassandra-read-repair
title: "Read repair (Apache Cassandra operating docs)"
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/latest/cassandra/managing/operating/read_repair.html
kind: docs
primary: true
---

## Summary

How Cassandra 5.0 repairs replicas during a read: one full read plus
digest reads, compare, pick the newest by timestamp, and write it back to
the stale replicas that took part before answering. Explains why it's
blocking (monotonic quorum reads), the 4.0 option to turn it off, and
that background read repair was removed in 4.0.

## Key claims

- Read repair happens in the foreground and the client waits for it. "The read repair runs in the foreground and is blocking in that a response is not returned to the client until the read repair has completed and up-to-date data is constructed." (Read repair)
- Blocking read repair gives monotonic quorum reads. "in 2 successive quorum reads, it’s guaranteed the 2nd one won’t get something older than the 1st one, and this even if a failed quorum write made a write of the most up to date value only to a minority of replicas." (Expectation of Monotonic Quorum Reads)
- Without it, a write that failed to reach a quorum can appear and then vanish. "When monotonic quorum reads are not provided and a write fails to reach a quorum of replicas, it may be visible in one read, and then disappear in a subsequent read." (Table level configuration)
- Cassandra 4.0 made it configurable per table. "Cassandra 4.0 adds support for table level configuration of monotonic reads (CASSANDRA-14635)." (Table level configuration)
- Read repair can break write atomicity. "read repair can break write atomicity when data is read at a more granular level than it is written." (Table level configuration)
- Extra replicas return only a hash. "A digest read request is not a full read and only returns the hash value of the data." (Read Repair Example)
- The newest copy is picked by timestamp. "Data from the two replicas is compared and based on the timestamps the most recent replica is selected." (Read Repair Example)
- Only stale replicas that took part in the read get repaired. "If read repair is performed it is made only on the replicas that are not up-to-date and that are involved in the read request." (Read Consistency Level and Read Repair)
- At ONE there's no read repair. "Read repair is not performed as the data from the first direct read request satisfies the consistency level ONE." (Table 1)
- Background read repair was removed in 4.0. "Background read repair, which was configured using read_repair_chance and dclocal_read_repair_chance settings in cassandra.yaml is removed Cassandra 4.0 (CASSANDRA-13910)." (Background Read Repair)
- Read repair doesn't replace full repair. "Read repair is not an alternative for other kind of repairs such as full repairs or replacing a node that keeps failing." (Background Read Repair)
- The full read goes to the fastest replica. "A direct read request is forwarded to the fastest node (as determined by dynamic snitch) as shown in Figure 2." (Read Repair Example)
- Blocking means waiting for the repair writes. "the read will block on writes sent to other replicas until the CL is reached by the writes." (Blocking)
- BLOCKING is the default. "Blocking The default setting. When read_repair is set to BLOCKING , and a read repair is started, the read will block on writes sent to other replicas until the CL is reached by the writes." (Blocking)
- NONE trades monotonic reads for write atomicity. "Write Atomicity: Provided by NONE ." (Table level configuration)
- QUORUM and TWO reads repair on a mismatch. "Read repair is performed if inconsistencies in data are found as determined by the direct and digest read requests." (Table 1, rows TWO, THREE, LOCAL_QUORUM, QUORUM)

## Visuals worth redrawing

- Figures 1 to 6: direct read, digest read, mismatch, second full read,
  repair write, answer. A clean sequence diagram.

## My notes

- Pairs with cassandra-repair for the background half.

---
id: in-sync-replicas
title: In-sync replicas
depth: short
phase: 11
note: >-
  Kafka's rule: the leader waits for the followers that are caught up
  and drops slow ones from the set.
needs: [sync-vs-async-replication, kafka-architecture]
leads_to: []
compare_with: [quorums]
---

# In-sync replicas

Kafka replicates each partition from a leader to followers, and it
decides when a write is safe with one rule: a message is committed once
every replica in the **in-sync replica set** (ISR) has it. The ISR is
the leader plus the followers that are keeping up. A follower that falls
too far behind is dropped from the set, so it can't hold up writes, and
it can't be elected leader either. It's Kafka's middle road between
waiting for every copy and waiting for a majority.

## How the set changes

In [[kafka-architecture]], a partition with replication factor 3 has
one leader and two followers. Followers
fetch from the leader like consumers and append what they get to their
own logs (see [[leader-follower-replication]]).

A follower counts as in sync while two things hold:

1. Its broker keeps a live session with the cluster's controller.
2. It keeps up with the leader. If it can't catch up to the end of the
   leader's log within `replica.lag.time.max.ms`, the leader drops it.

The first catches dead brokers. The second catches followers that are
alive but too slow, or stuck, for example in a long
[[process-pauses|process pause]]. A dropped follower keeps fetching, and when it
has caught up it's added back.

![Two snapshots of one partition's three logs. Before: the leader and follower 2 hold offsets 0 to 5, follower 3 has stalled at offset 2; all three are in the ISR, so the high watermark, the last committed offset, is stuck at 2. After follower 3 is dropped from the ISR, the high watermark moves to 5, and messages 3 to 5 become visible to consumers.](img/in-sync-replicas-isr.svg)

*A stalled follower holds back the high watermark until it's dropped from the ISR.*

The leader tracks the **high watermark**: the highest offset every ISR
member has. Everything up to it is committed, and consumers are only
given committed messages. A write that only the leader has isn't
visible yet.

## What the producer waits for

A producer picks how much of this to wait for with `acks`:

- `acks=0`: don't wait at all.
- `acks=1`: wait until the leader has written it to its own log.
- `acks=all`: wait until every member of the current ISR has it.

`acks=all` is the synchronous option from
[[sync-vs-async-replication]], but "all" means all of the *current*
ISR, not all replicas. If a topic has two replicas and one fails, the
ISR is just the leader, and `acks=all` writes succeed with one copy.
Lose that broker too and they're gone.

That's what `min.insync.replicas` is for. With `acks=all`, the leader
refuses writes when the ISR is smaller than this number. Three replicas
with `min.insync.replicas=2` means every acknowledged write is on at
least two brokers, and the partition keeps taking writes with one broker
down. With two down, it stops accepting `acks=all` writes rather than
keep a single copy.

## Why not a majority

A majority [[quorums|quorum]] needs 2f + 1 copies to survive f failures:
three copies for one failure, five for two. The ISR approach survives f
failures with f + 1 copies, because only ISR members, which have every
committed message, may become leader. Kafka's designers chose this to
save disk and throughput on high-volume data.

The cost is latency. A majority commits as soon as the fastest members
answer. The ISR waits for its slowest member, until that member is
dropped. `replica.lag.time.max.ms` is the upper bound on how long one
slow follower can hold everyone up.

## Where it gets tricky

**If every in-sync replica dies.** Kafka can wait for an ISR member to
come back, staying unavailable, or elect whichever replica returns first,
even one missing committed messages. The second is unclean leader
election. It's been off by default since Kafka 0.11.0.0.

**Kafka doesn't [[fsync]] every write.** It counts on having the data on
several brokers rather than on each broker's disk being up to date. A replica that restarts
after a crash may have lost unflushed data, so it must fully catch up
before it rejoins the ISR.

**The last replica standing.** That rule had a gap. Say the ISR has
shrunk to one broker, and that broker loses power and its unflushed
writes. When it comes back it's the only ISR member, so it becomes
leader, and the other replicas truncate their logs to match it. Data that
was committed is now gone from every copy. KIP-966 fixed this with two
changes. The high watermark can't advance while the ISR is below
`min.insync.replicas`, even for `acks=1` writes. And the controller
keeps a list of **eligible leader replicas** (ELR): replicas that left
the ISR but are known to have everything up to the high watermark, so
they can safely be elected. ELR shipped in Kafka 4.0 and is on by
default for new clusters from 4.1.

## What this means when you build

- For data you can't lose, use replication factor 3, `acks=all` and
  `min.insync.replicas=2`, and keep unclean leader election off.
- Expect `acks=all` writes to be refused when too few replicas are in
  sync, and decide whether producers should retry or fail.
- Watch ISR shrinks. A follower that keeps dropping out is a slow disk
  or a pausing process.

## Further reading

- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka project, Kafka 4.3. The Replication, Replicated Logs, Unclean Leader Election and Availability sections: the ISR rule, `acks`, `min.insync.replicas`, and the comparison with majority quorums.
- [Eligible Leader Replicas](https://kafka.apache.org/43/operations/eligible-leader-replicas/), Apache Kafka project, Kafka 4.3. What ELR changed and in which versions.
- [KIP-966: Eligible Leader Replicas](https://cwiki.apache.org/confluence/display/KAFKA/KIP-966%3A+Eligible+Leader+Replicas), Calvin Liu, Apache Kafka. The last-replica-standing data loss, step by step, and the design of the fix.

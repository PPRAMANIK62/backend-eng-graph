---
id: kafka-architecture
title: Kafka's architecture
depth: deep
phase: 10
note: >-
  Topics split into partitions, spread over brokers, one leader per
  partition: how Kafka lays a log across machines.
needs: [log-based-messaging]
leads_to: [message-ordering, idempotent-producers, consumer-groups, in-sync-replicas]
compare_with: []
---

# Kafka's architecture

Kafka takes the idea of a [[log-based-messaging|log that readers
don't consume]] and spreads it over a cluster of machines. A topic is
split into partitions, each partition is a log that lives on a few
brokers, and one of those brokers leads it. Knowing that layout tells
you where Kafka's limits come from: how far it scales, what order it
keeps, and what happens when a machine dies.

## From one log to a topic of partitions

The unit of data is an event, also called a record or message. It has
a key, a value, a timestamp and optional headers. A payment event
might have the customer's ID as its key and the payment details as
its value.

Events go into a **topic**, a named stream such as `payments`. Any
number of producers can write to a topic and any number of consumers
can read it. Reading doesn't remove anything. The topic keeps events
for as long as its retention setting says.

A topic is split into **partitions**, Kafka's form of
[[partitioning]]. Each partition is its own ordered log, and each new event is appended to exactly one of them.
Which one is up to the producer:

- **With a key,** the producer hashes the key to pick the partition,
  so every event with the same key lands in the same partition. Key by
  user ID and all of one user's events sit in one log, in the order
  they were written. That's what [[message-ordering]] relies on.
- **Without a key,** the default producer sticks to one partition
  until it has sent a batch's worth of bytes to it, then moves to
  another.

Partitions are what let Kafka scale. Each partition lives whole on one
server, as a folder of files under the log directory (the file layout
is [[log-segments]]). Different partitions can live on different
servers, so a topic's reads and writes spread over the cluster. The
flip side: a topic with 20 partitions can't use more than 20 servers,
not counting copies, and the partition count caps how many consumers
can share the work.

## Every partition has one leader

Each partition is copied to several brokers; the number of copies is
the topic's replication factor. Three is a common production setting.
Kafka has no separate code path for unreplicated topics: they are
replicated topics with a replication factor of one.

Of a partition's copies, one is the **leader** and the rest are
**followers**, the [[leader-follower-replication|leader-follower]]
shape:

![Three brokers, each holding a copy of partitions P0, P1 and P2. Broker 1 leads P0, broker 2 leads P1, broker 3 leads P2; every other copy is a follower. A producer sends a record for P1 to broker 2, the P1 leader. Arrows show the P1 followers on brokers 1 and 3 copying from the leader. A consumer fetches from the P1 leader starting at an offset. A controller quorum, running Raft, sits apart; brokers fetch cluster metadata from it.](img/kafka-architecture-cluster.svg)

*One topic with three partitions and replication factor three. Each
broker leads one partition and follows the others.*

- **All writes go to the leader.** Reads normally go there too, though
  they can be served by followers.
- **Followers copy the leader by fetching from it,** exactly like a
  consumer would, and append what they get to their own log. Their
  logs match the leader's, offset for offset, except that the leader
  may have a few newest records the followers haven't copied yet.
- **Leaders are spread out.** A cluster usually has far more
  partitions than brokers, and Kafka spreads leadership evenly, so
  every broker takes a share of the writes.

A record is committed, and becomes visible to consumers, once every
follower that counts as caught up has a copy. Consumers only ever see
committed records, so a consumer
never reads something that could vanish if the leader dies. Which
followers count as caught up, and what the producer's `acks` setting
waits for, is [[in-sync-replicas]] (phase 11). The promise is that a
committed record isn't lost as long as one of those caught-up replicas
survives.

When a broker dies, the cluster notices and elects a new leader for
each partition it led ([[failover]]), from the caught-up followers. When the broker
comes back, it's only a follower for all its partitions until
leadership is moved back. Each partition has a preferred leader, the
first broker in its replica list, and Kafka by default tries to hand
leadership back to it. Replicas can also be spread across racks, so a
whole rack failing doesn't take every copy with it.

## Clients go straight to the leader

There is no routing tier in front of the brokers. Any broker can
answer a metadata request: which brokers are alive, and which one
leads each partition. The producer asks once, then sends each record
directly to its partition's leader. It collects records in memory and
sends them in batches, trading a little latency for throughput.

Consumers also go to the leader. Each fetch says "give me records from
offset N", and gets a chunk of the log back. The consumer pulls, so a
slow consumer falls behind instead of being flooded. A fetch can wait
on the broker until data arrives, so an idle consumer doesn't spin. To
share a topic's partitions among several processes, consumers join a
group; that's [[consumer-groups]].

## The controller, and why ZooKeeper left

Something has to know which brokers are alive, which broker leads
each partition and which followers are caught up, and pick a new
leader when one fails. In Kafka that's the **controller**.

For most of Kafka's life, that metadata lived in ZooKeeper, a separate
[[coordination-services|coordination service]], which also elected
one broker as controller. KIP-500 laid out the problems. Operators had
to run and secure two different distributed systems. The controller
pushed changes out to brokers, and a broker that missed some could end
up with a different view of the cluster from the others.

The fix was to treat the metadata the way Kafka treats data: as a log.
In KRaft mode, a small set of controller nodes runs [[raft]] over a
metadata log. Their elected leader is the active controller, and the
others are hot standbys with the whole state already loaded. Brokers
fetch metadata changes from the active controller, like followers
fetching from a leader, so every broker sees the changes in the same
order.

A cluster usually runs 3 or 5 controllers. A majority must be up, so 3
survive one failure and 5 survive two. A server can be a broker, a
controller or both, and "both" isn't recommended for production. KRaft
was declared production ready in Kafka 3.3, and Kafka 4.0 removed
ZooKeeper mode entirely. Moving an old ZooKeeper cluster to KRaft goes
through Kafka 3.9, the last release that can do the migration.

## Where it gets tricky

**The partition count is hard to change.** You can't reduce it. You
can add partitions, but with key hashing that sends existing keys to
different partitions, which breaks per-key order for anything already
in flight, and Kafka doesn't move old data to match. New partitions
also take a while to show up in clients' metadata. Pick a number with
room to grow.

**Durability comes from copies, not from the disk.** Kafka writes
records to the [[filesystem]] without forcing them to disk on every write.
In practice they sit in the kernel's [[page-cache]] until it writes
them out. A record survives a crash because other brokers have it,
not because of an [[fsync]]. With replication factor 1, a crash can
lose records the broker had already accepted. How Kafka serves reads straight from the page
cache is [[zero-copy]].

**Node failures, yes; network partitions, not always.** Kafka stays
available through broker failures after a short failover, but it may
not stay available during a [[network-partitions|network partition]].

**Old guides describe a cluster that no longer exists.** Tutorials
that start ZooKeeper first, or talk to ZooKeeper to find brokers,
predate Kafka 4.0.

**The producer's retries need care.** A producer that retries after a
network error could write a record twice. An idempotent producer
tags records with sequence numbers so the broker can drop the
duplicate; that's [[idempotent-producers]].

## What this means when you build

- Pick the record key on purpose: it decides the partition, and the
  partition decides both order and load.
- Choose the partition count for your peak consumer count, since you
  can't reduce it and adding more reshuffles keys.
- Use replication factor 3 and spread replicas across racks or zones
  for anything you can't lose.
- Current Kafka only runs in KRaft mode. Give production clusters 3 or
  5 dedicated controllers.

## Further reading

- [Introduction](https://kafka.apache.org/43/getting-started/introduction/), Apache Kafka 4.3 docs. Events, topics, partitions and replication in one page.
- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. Why Kafka leans on the filesystem, how producers and consumers talk to leaders, and how replication and leader election work.
- [Basic Kafka Operations](https://kafka.apache.org/43/operations/basic-kafka-operations/), Apache Kafka 4.3 docs. What the partition count limits, what adding partitions does, leader balancing and rack awareness.
- [Producer Configs](https://kafka.apache.org/43/configuration/producer-configs/), Apache Kafka 4.3 docs. How the default partitioner picks a partition, with and without a key.
- [KIP-500: Replace ZooKeeper with a Self-Managed Metadata Quorum](https://cwiki.apache.org/confluence/display/KAFKA/KIP-500%3A+Replace+ZooKeeper+with+a+Self-Managed+Metadata+Quorum), Colin McCabe. Why metadata moved into a Raft log inside Kafka.
- [KRaft](https://kafka.apache.org/43/operations/kraft/), Apache Kafka 4.3 docs. Process roles, controller counts and the migration path.
- [Upgrading](https://kafka.apache.org/43/getting-started/upgrade/), Apache Kafka 4.3 docs. When KRaft became production ready and when ZooKeeper was removed.

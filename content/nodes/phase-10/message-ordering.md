---
id: message-ordering
title: Message ordering
depth: short
phase: 10
note: >-
  Order holds within a partition, not across partitions. Choosing the
  key.
needs: [kafka-architecture]
leads_to: []
compare_with: [dead-letter-queue, hot-spots, idempotent-producers]
---

# Message ordering

Kafka keeps records in order within a partition and makes no promise
across partitions. So "will my consumer see these events in order?"
comes down to one question: did they land in the same partition? You
control that with the record's key.

## Order lives in the partition

Take an online shop that publishes order events: `created`, `paid`,
`shipped`. If a consumer sees `shipped` before `paid`, it may refund
a parcel that's already on its way. These three events have to be
read in the order they happened.

In [[kafka-architecture|Kafka]], each partition is an ordered log, and
every consumer of a partition reads its records in exactly the order
they were written. Between two partitions there is no order at all: a
consumer reading both can see them interleaved any way.

The producer picks the partition by hashing the record's key (see
[[range-vs-hash-partitioning]]). Give the
three events the same key, the order ID, and they hash to the same
partition, so they stay in order. Give them no key, or different
keys, and they can end up in different partitions and be read out of
order.

![A producer keyed by order ID sends six events. Events for order 17 (created, paid, shipped) all hash to partition 0 and sit there in order. Order 88's created event goes to partition 1. Events for order 42 (created, paid) hash to partition 2 and sit there in order. A consumer reads each partition in order, but events from different orders can interleave in any way.](img/message-ordering-keys.svg)

*Same key, same partition, same order. Different keys give no order
between them.*

A total order over a whole topic would mean a single partition. A
partition is the smallest unit of parallelism: within a consumer group,
only one consumer reads it at a time. Splitting by key keeps the order
you need and lets the rest run in parallel.

## Choosing the key

The key should be the thing whose events must stay in order: an order
ID, an account ID, a user ID, the primary key of the database row.
Events for different orders don't care about each other's order, so
they can go to different partitions and be processed in parallel.

Two ways to get it wrong:

- **Too coarse.** Key everything by country, and most traffic lands on
  the partition for your biggest market. That partition's consumer
  can't keep up while others sit idle, a [[hot-spots|hot spot]].
  Google Cloud Pub/Sub has a name for this, a hot key: a backlog on
  one key because it gets more messages than its consumer can process.
- **Too fine.** Key by event ID, and every event gets its own
  ordering, which means none that matters. Events for the same order
  scatter.

## How order breaks anyway

A key alone isn't enough. Order can still slip in a few places.

**Producer retries.** A producer can have several batches in flight
to one partition at once. If batch 1 fails and is retried while batch
2 succeeds, batch 2's records land first. Kafka's producer prevents
this when idempotence is on (the default in Kafka 4.3), or when
retries are off. But conflicting settings quietly turn idempotence
off, and then more than one request in flight with retries can
reorder records. The details are in [[idempotent-producers]].

**Adding partitions.** The key-to-partition mapping depends on the
number of partitions. Add partitions and some keys start going to a
different partition than before, while their older records stay where
they were. For a while a consumer can read a key's new records before
its old ones. Kafka doesn't move old data to fix this. If order
matters, choose the partition count up front.

**Parallel processing inside the consumer.** Kafka hands you a
partition's records in order. If your consumer then gives them to a
[[thread-pool]], they can finish in any order. The same goes for a Pub/Sub client
callback that starts async work: keeping that work in order is your
job.

**Redelivery.** After a consumer crash, whoever takes over its
partitions reads again the records since its last committed offset:
in order, but for the second time. Consumers that share a partition's
records instead of owning the partition give up order; see Kafka's
[[share-groups|share groups]] in [[log-based-messaging]].

## Other ways to scope order

Kafka ties order to partitions, and partitions are few. Google Cloud
Pub/Sub scopes it to an ordering key instead, and expects far more
keys than a system has partitions. The costs show up elsewhere:
publishing per key is limited (1 MBps per key), a redelivered message
brings every later message for that key back with it, and ordered
delivery lowers publish availability and raises latency compared with
unordered delivery. Order costs something in every system; the
question is where you pay.

## What this means when you build

- Key each record by the entity whose events must stay in order.
- Check the key's spread: a key with a few huge values makes hot
  partitions.
- Leave idempotence on and check the producer's settings don't
  silently turn it off.
- Choose the partition count up front, and don't add partitions to a
  topic whose consumers rely on per-key order without a plan.
- Keep one partition's records in order inside your consumer too.

## Further reading

- [Kafka: a Distributed Messaging System for Log Processing](https://notes.stephenholiday.com/Kafka.pdf), Jay Kreps, Neha Narkhede, Jun Rao, NetDB 2011. The original promise: order within a partition, none across partitions.
- [Producer Configs](https://kafka.apache.org/43/configuration/producer-configs/), Apache Kafka 4.3 docs. How the default partitioner uses the key, and when retries reorder records.
- [Basic Kafka Operations](https://kafka.apache.org/43/operations/basic-kafka-operations/), Apache Kafka 4.3 docs. What adding partitions does to keys.
- [Order messages](https://cloud.google.com/pubsub/docs/ordering), Google Cloud Pub/Sub. Ordering keys instead of partitions, hot keys, and what ordering costs.

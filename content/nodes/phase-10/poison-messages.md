---
id: poison-messages
title: Poison messages
depth: short
phase: 10
note: >-
  A message that crashes every consumer that reads it.
needs: [dead-letter-queue, message-queue, offsets-and-commits, message-schemas]
leads_to: [background-jobs]
compare_with: [share-groups]
---

# Poison messages

A poison message is one that fails every time a consumer reads it: it
can't be parsed, or it makes your code throw, or it crashes the
process. Retrying never helps, so unless you plan for it, one message
stops everything queued behind it. In a log like Kafka, "behind it"
means the whole partition.

## Why one bad message stops a partition

Say an order in partition 3 has a price field that's a string instead
of a number, and your consumer throws on it.

In a classic [[message-queue]], that hurts one message. The queue
tracks each message on its own, redelivers the failing one, and moves
it to a [[dead-letter-queue]] after a set number of receives. The
messages after it carry on.

A Kafka consumer's progress on a partition is one number, the committed
offset (see [[offsets-and-commits]]). It can't commit past the bad
message without saying "done" to it. So it doesn't commit, reads the
same message again, fails again, and every new message in that
partition waits behind it. From the outside it shows up as a stalled
partition: the offset doesn't move and [[consumer-lag|lag]] grows.

If the message crashes the process instead of throwing, it's worse. The
consumer dies, the group rebalances, the partition goes to another
consumer, and that one reads the same message and dies too. That's the
"poison": it kills every consumer that touches it.

Some poison never reaches your code. If the bytes don't match the
format your deserializer expects (corrupt data, a producer on a
different serializer, or a record type the reader doesn't know), the
client library fails before your handler runs. That's one reason
[[message-schemas]] matter.

## What you can do with it

There are only three moves: stop, skip, or set it aside.

**Stop.** Halt the consumer and page someone. Nothing is lost and order
is kept, but that partition doesn't move until a person acts. Kafka
Streams does this by default for records it can't deserialize.

**Skip.** Log it and commit past it. The partition keeps moving, but the
message is gone unless someone reads the log. Kafka Streams offers this
as the other built-in choice, and its own proposal for a dead-letter
queue calls it easy to miss.

**Set it aside.** Write the message somewhere else, then commit. Uber's
design chains topics:

![Four topics down the left: orders, orders-retry-1, orders-retry-2 and orders-dlq. Each topic has a consumer on the right. When a consumer fails on a message, it publishes the message to the next topic down and then commits. The retry consumers wait before trying, the second one longer than the first. The dead-letter topic goes to a person and alerts, and after the fix its messages are replayed into orders-retry-1.](img/poison-messages-retry-topics.svg)

*Failures step down through retry topics with longer waits, and land in a dead-letter topic. Adapted from Ning Xia, "Building Reliable Reprocessing and Dead Letter Queues with Apache Kafka" (Uber, 2018), figure 4.*

A consumer that fails on a message a few times publishes it to a retry
topic and commits, so the partition moves on. Consumers of each retry
topic wait longer before trying. The last one publishes to a
dead-letter topic. After a fix, messages from there are published back
into the first retry topic, away from live traffic. Errors that no
retry can fix, such as a null pointer in your code, can go straight to
the dead-letter topic.

Kafka Streams has this built in by Kafka 4.3 (KIP-1034): set
`errors.dead.letter.queue.topic.name` and a failed record goes there
with its raw key and value, and the exception, stack trace, source
topic, partition and offset in headers. Writing to a dead-letter topic
yourself from an error handler also works, but that write happens
outside Streams' processing guarantees.

## Where it gets tricky

**Setting a message aside breaks order.** When order 17 goes to a
retry topic, order 18 for the same customer is processed first. If your
messages are updates to one record, a later retry can overwrite newer
data. Partitions exist to keep order per key (see
[[message-ordering]]), and a retry topic quietly gives that up. If
order matters, stopping may be the right call.

**Poison or bad luck?** A message that failed because a downstream
service was down looks the same as one that can never succeed. Retry
topics with growing waits give passing failures time to clear; only
what's left in the dead-letter topic is likely poison.

**Share groups count attempts for you.** Kafka 4.2 made [[share-groups|share groups]]
production-ready. Their consumers don't each own whole partitions,
records are acknowledged one by one, and delivery attempts are
counted. That's queue-style
handling on a Kafka topic, meant for work done one record at a time,
not ordered streams.

## What this means when you build

- Decide per consumer: stop, skip, or set aside. Don't let the default
  decide.
- Catch errors per message, not per batch, so one record doesn't fail
  the others.
- Keep the raw bytes, the error, and the source partition and offset
  with every dead-lettered message.
- Alert on anything reaching the dead-letter topic, and on a partition
  whose offset stops moving.
- Make processing safe to repeat before you build replay
  ([[idempotency]]).

## Further reading

- [Building Reliable Reprocessing and Dead Letter Queues with Apache Kafka](https://www.uber.com/blog/reliable-reprocessing/), Ning Xia, Uber, 2018. Why a failing message blocks a partition, and a chain of retry topics that fixes it.
- [KIP-1034: Dead letter queue in Kafka Streams](https://cwiki.apache.org/confluence/display/KAFKA/KIP-1034%3A+Dead+letter+queue+in+Kafka+Streams), Apache Kafka. Why stop and skip both fall short, and what a useful dead-letter record carries.
- [Configuring a Streams Application](https://kafka.apache.org/43/streams/developer-guide/config-streams/), Apache Kafka 4.3 docs. The deserialization and processing exception handlers, and the catch with writing to a dead-letter topic yourself.
- [Upgrading](https://kafka.apache.org/43/getting-started/upgrade/), Apache Kafka 4.3 docs. When share groups arrived and what they're for.

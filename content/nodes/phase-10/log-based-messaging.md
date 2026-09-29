---
id: log-based-messaging
title: Logs vs queues
depth: deep
phase: 10
note: >-
  A queue deletes messages once they're handled; a log keeps them and
  lets each reader track its own place.
needs: [message-queue]
leads_to: [kafka-architecture, log-segments, change-data-capture, event-sourcing, stream-processing]
compare_with: [message-queue, pub-sub, total-order-broadcast]
---

# Logs vs queues

A [[message-queue]] hands each message out and deletes it once a
consumer acknowledges it. A log keeps every message, in order, for a
set time, whether anyone has read it or not, and each reader keeps
track of how far it has got. That one change moves the bookkeeping
from the broker to the reader, and it's why Kafka behaves so
differently from RabbitMQ or SQS.

## A log is a numbered list you only append to

A log, in this sense, is an [[append-only-log|append-only]] sequence
of records. Each new record goes on the end and gets the next number,
its offset. Nothing in the middle changes. Readers go from left to
right.

Now give it two readers. The billing service has handled offsets 0 to
2, so the next record it wants is offset 3. The search indexer is
faster and wants offset 7 next. Neither reader changes the log. Each
one just remembers a single number: the offset of the next record it
wants.

![A log drawn as a row of numbered cells, offsets 0 to 9, with a producer appending at offset 10 on the right. Offsets 0 and 1 are greyed out as removed by retention. An arrow marks the billing consumer's position at offset 3 and another marks the search consumer's position at offset 7. Reading does not remove anything.](img/log-based-messaging-positions.svg)

*Two readers, two positions, one copy of the data. Retention, not
reading, removes old records.*

## Where the "what's been read" lives

The difference with a queue is where the state lives.

**In a queue, the broker tracks every message.** When it hands out a
message it has to lock it so no one else gets it, wait for the ack,
then mark it done and delete it. That's several states per message,
kept on the broker, and the familiar problems come with them: a
consumer that finishes but crashes before acking gets the message
again, and messages that are sent but never acked need special
handling. Traditional brokers often store this as a per-consumer
queue with a B-tree index on the side.

**In a log, the reader tracks one number.** The broker doesn't record
what each consumer has read. A consumer asks for "records from offset
7" and gets a chunk back. Saying "I've processed up to offset 7" means
everything before 7 is done too. The whole state of a consumer is one
integer per log, which is cheap to store and cheap to save often
(that's [[offsets-and-commits]]).

## Deleting by age, not by reading

If the broker doesn't know who has read a record, it can't delete a
record when "everyone" has read it. So a log deletes by time or size
instead: keep records for a week, say, then drop the oldest. The
first Kafka paper (2011) named 7 days as the typical setting;
in Kafka today it's a per-topic setting. The storage side of this,
dropping whole files of old records at a time, is [[log-segments]].
Keeping the latest record per key instead of deleting by age is
[[log-compaction]].

Older brokers were built for queues that stay short and slowed down a
lot when messages piled up. Appending to a file and reading it in
order costs the same whether the log holds a gigabyte or a terabyte,
so a log can keep days of data without getting slower.

## What keeping the data buys you

- **Replay.** A consumer can move its position back and read again.
  Found a bug that corrupted a day of output? Fix it, rewind, and
  reprocess. That breaks the usual contract of a queue on purpose.
- **New readers for free.** A new service can start from the oldest
  retained record and catch up. The producer doesn't change, and
  doesn't even know the new reader exists.
- **Readers at their own pace.** A batch job that reads once an hour
  and a service that must be up to the second can read the same log.
  A reader that crashes or is down for maintenance catches up when it
  comes back. The log is a large buffer between the two sides, so one
  slow reader doesn't push back on the producer or on other readers.
- **The same order for everyone.** Every reader sees the records in
  the same order. If two services apply the same changes in the same
  order, they end in the same state, which is the idea behind
  [[replicated-state-machine|replicated state machines]], and why logs
  sit under [[change-data-capture]], [[event-sourcing]] and
  [[stream-processing]].

Kafka's consumers pull: each fetch names an offset. A consumer that
falls behind just reads further back later, instead of being flooded
by a broker pushing at it. A fetch can wait on the broker until new
data arrives, a form of [[long-polling]], so an idle consumer doesn't
spin.

## Sharing work means splitting the log

A queue lets many consumers compete for messages because the broker
tracks each message. A single log with one position per reader can't
do that: if two workers shared one position, they'd both read the
same records.

So a log is split into partitions, each its own ordered log. Within a
group of consumers, each partition is read by exactly one consumer,
and different groups each read everything independently. That gives
you both patterns at once: work sharing inside a group, and
[[pub-sub]] across groups. The details are in [[consumer-groups]] and
[[kafka-architecture]].

The cost is that the work is split up front. A consumer whose
partitions run dry can't help a consumer whose partitions are backed
up. And a group can't usefully have more consumers than there are
partitions, so the partition count caps how many readers can share the
work.

## Where it gets tricky

**A log isn't a queue with retention.** A consumer's position is one
number, and committing offset 8 says everything before it is done.
There's no way to say "7 failed, skip it for now, retry it later" the
way a queue's per-message ack and requeue does. A message that fails
has to be handled, parked somewhere else, or it holds up everything
behind it in that partition (see [[poison-messages]]).

**Retention still deletes.** A consumer that falls further behind than
the retention period loses records it never read. Watch
[[consumer-lag]].

**The two models are borrowing from each other.** RabbitMQ, a queue
broker, added streams: append-only logs that consumers read without
removing anything, with offsets and retention, to complement its
queues rather than replace them. Its super streams, partitioned
streams, arrived in RabbitMQ 3.11. Kafka went the other way. [[share-groups|Share
groups]] (KIP-932, previewed in Kafka 4.1 and production-ready in 4.2)
let consumers share a partition's records, acknowledge each record on
its own, hold a record under a lock with a timeout (30 seconds by
default) and count delivery attempts. That's queue behaviour on top of
a log. The price is order: records in a share group can come out of
order, especially when some are redelivered.

**Pull and push are a trade.** Pull lets a slow consumer lag instead
of drowning, and batches well. It also means a consumer must ask, and
an empty fetch must wait somewhere, which is why Kafka's fetches can
block until data arrives.

## What this means when you build

- Use a queue for independent jobs that are retried one by one. Use a
  log when several systems need the same events, when you may need to
  replay, or when order per key matters.
- With a log, store your consumer's position deliberately, and plan
  what happens to a record that fails: a retry topic or a dead-letter
  topic, not an endless retry that blocks the partition.
- Set retention longer than your worst realistic outage plus catch-up
  time.
- Choose the partition count with your peak number of consumers in
  mind.

## Further reading

- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://web.archive.org/web/2025/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, 2013 (archived copy; the original link is dead). The log as the common idea under databases, replication and data pipelines.
- [Kafka: a Distributed Messaging System for Log Processing](https://notes.stephenholiday.com/Kafka.pdf), Jay Kreps, Neha Narkhede, Jun Rao, NetDB 2011. Why the brokers of the time didn't fit, offsets instead of message ids, the stateless broker and time-based retention.
- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. The "Consumer Position" and "Push vs. pull" sections compare broker-tracked acks with offsets; "The Share Consumer" describes share groups.
- [Streams and Super Streams](https://www.rabbitmq.com/docs/streams), RabbitMQ 4.3 docs. A queue broker's own log type, and what it can and can't do compared with its queues.
- [KIP-932: Queues for Kafka](https://cwiki.apache.org/confluence/display/KAFKA/KIP-932%3A+Queues+for+Kafka), Andrew Schofield. Why Kafka added queue-like consumption, and what it costs in ordering.
- [Upgrading](https://kafka.apache.org/43/getting-started/upgrade/), Apache Kafka 4.3 docs. Which release previewed share groups and which made them production-ready.
- [Competing Consumers](https://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html), Gregor Hohpe and Bobby Woolf, Enterprise Integration Patterns. The classic pattern, and how Kafka's partitions differ from it.

---
id: share-groups
title: Share groups
depth: short
phase: 10
note: >-
  Queue-style consumption on a Kafka topic: consumers share partitions
  and acknowledge each record.
needs: [consumer-groups]
leads_to: []
compare_with: [message-queue, poison-messages]
---

# Share groups

A share group is a way to read a Kafka topic like a work queue. Its
consumers don't each own whole partitions: they take records from a
shared pool, acknowledge them one by one, and a record that isn't
acknowledged in time goes back for someone else. Kafka 4.1 shipped
them as a preview and Kafka 4.2 made them production-ready. You'd reach
for one when the jobs are independent and you want more workers than
you have partitions.

## The problem with one owner per partition

In a [[consumer-groups|consumer group]], each partition goes to exactly
one member. That keeps records in order, and it also caps your
parallelism at the partition count. So teams over-partition, just to
have room for more consumers at peak load.

And a consumer group tracks progress as one number per partition, the
committed [[offsets-and-commits|offset]]. That's cheap, but it can't
say "records 100 to 109 are done except 104, which failed". The offset
can't move past a failing record until you deal with it.

A classic [[message-queue]] has neither problem: workers compete for
messages and acknowledge each one on its own. Share groups bring that
model to a Kafka topic. They don't add a new kind of queue object: the
records stay in an ordinary topic, with its usual retention.

## Records are locked, not owned

Say three consumers in the share group `resizers` read a one-partition
`thumbnails` topic. The broker leading that partition tracks each
record in one of four states:

- **Available**: waiting to be handed out.
- **Acquired**: handed to one consumer under a lock with a timeout.
  While it's locked, no other consumer in the group gets it.
- **Acknowledged**: processed.
- **Archived**: done with, one way or another. Nobody gets it again.

When a consumer polls, the broker finds available records, marks them
acquired for that consumer, adds one to each record's delivery count,
starts the lock timer (30 seconds by default) and sends them as a
batch. The consumer then does one of these for each record:

- **Accept** it, once processed. It becomes acknowledged.
- **Release** it, to put it back for another attempt.
- **Reject** it as unprocessable. It's archived for good.
- **Renew** the lock, to get more time.
- **Nothing.** When the lock runs out, it's as if it had been released.

A released or timed-out record is only put back while its delivery
count is under the limit, 5 by default (the broker allows 2 to 10).
At the limit it's archived instead: the built-in answer to
[[poison-messages]].

![A row of offsets 0 to 9 in one share-partition. Offsets 0 and 1 are archived, before the share-partition start offset. Offset 2 is acquired with delivery count 1, offset 3 is available again after two attempts, offset 4 is acquired with count 1, offset 5 is acknowledged, offset 6 was rejected and is archived, offsets 7 and 8 are available. The in-flight window runs from the start offset at 2 to the end offset at 8; from offset 9 on, records are available but not yet in flight.](img/share-groups-in-flight.svg)

*One share-partition's in-flight records. Adapted from Andrew Schofield, "KIP-932: Queues for Kafka", the in-flight records example.*

The broker keeps a window of these in-flight records per partition,
from a start offset (everything before it is finished) to an end
offset. The start offset only moves forward once the records at the
front are done. The window has a cap,
`group.share.partition.max.record.locks` (2,000 by default). When that
many records are in flight, polls return nothing more from that
partition until locks are acknowledged or time out. There's no limit on
queue depth; the topic holds whatever its retention allows.

A share coordinator writes the states and delivery counts to an
internal topic, so they're durable. Consumers can outnumber partitions,
and several share groups can read one topic, each with its own
window.

## Where it gets tricky

**Order is gone.** Records in one batch come in increasing offset
order, but nothing is promised between batches. Picture two consumers
on one partition. The first takes records 100 to 109 and crashes. The
second takes and finishes 110 to 119, then polls again and gets 100 to
109, now with delivery count 2. That's the right behaviour for a queue
and the wrong one for anything that needs [[message-ordering|per-key
order]]. If order matters, use a consumer group.

**At least once, and the count is approximate.** A consumer can finish
the work and then die before its acknowledgement lands. The lock
expires and the record is delivered again, so processing must be
[[idempotency|idempotent]]. The delivery counts aren't updated with
exactly-once guarantees either, so treat the count as a guard against
poison records, not an exact tally. The first version has no
transactional acknowledgements, so the
[[exactly-once-processing|exactly-once]] tricks of consumer groups
don't carry over.

**Late acknowledgements fail.** If the lock expires mid-job, your
acknowledgement fails with `InvalidRecordStateException`, and the
record may already be with another consumer.

**No seeking, and a new group starts at the end.** A new share group
starts at the latest offset by default. Resetting it is an admin
action on an empty group, and wipes all in-flight state.

**Retention still rules.** Size-based retention can delete records the
group never delivered, silently. With `read_committed`, an open producer
transaction stalls the whole group at that point.

## What this means when you build

- Use a share group for independent jobs that are retried one by one,
  where you want to scale workers without adding partitions. Keep
  consumer groups for anything ordered.
- Set the lock longer than your slowest normal job, or renew it.
- Make the handler idempotent, and reject records you know can't be
  processed rather than letting them time out until the limit.
- Decide what happens to records that hit the limit. The broker stops
  delivering them; copying them to a [[dead-letter-queue]] was left
  for a later version, so if you need one, write the record there
  yourself before you reject it.

## Further reading

- [KIP-932: Queues for Kafka](https://cwiki.apache.org/confluence/display/KAFKA/KIP-932%3A+Queues+for+Kafka), Andrew Schofield. The design: share-partitions, record states, delivery counts, the in-flight window and the ordering trade-off.
- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. "The Share Consumer" section: the five ways to handle an acquired record and the lock limit.
- [Broker Configs](https://kafka.apache.org/43/configuration/broker-configs/), Apache Kafka 4.3 docs. Defaults and ranges for the lock duration, delivery limit and in-flight cap.
- [Upgrading](https://kafka.apache.org/43/getting-started/upgrade/), Apache Kafka 4.3 docs. Which release previewed share groups and which made them production-ready.

---
id: exactly-once-processing
title: Exactly-once processing
depth: deep
phase: 10
note: >-
  Read, process and write as one transaction, and what "exactly once"
  means from end to end.
needs: [idempotent-producers, offsets-and-commits, delivery-guarantees]
leads_to: [transactional-sinks]
compare_with: [transactional-outbox, idempotency-keys]
---

# Exactly-once processing

Exactly-once processing means that when a consumer reads a message and
writes a result, the result shows up once, even if the consumer
crashes, retries or gets replaced halfway through. Kafka does it by
making "write the result" and "mark the input as read" one
transaction. It works inside Kafka, needs care at the edges, and its
name promises more than it delivers, so it pays to know exactly what
it covers.

## One message, three ways to get it wrong

Take a fraud checker. It reads payment A from the `payments` topic,
computes a verdict B, and writes B to `payment-checks`. The goal: A
counts as consumed if and only if B was written, and B is written
once.

Start from at least once, the normal guarantee (see
[[delivery-guarantees]]), and three things still produce a second B:

1. **The producer retries.** B's write succeeded but the ack was lost,
   so the producer sends B again. Kafka's
   [[idempotent-producers|idempotent producer]] fixes this one: the
   broker drops the retried copy by its sequence number.
2. **The consumer crashes between the two steps.** It wrote B, then
   died before committing A's offset (see [[offsets-and-commits]]).
   Whoever takes over reads A again and writes B again.
3. **A zombie.** The checker freezes (a long [[process-pauses|GC pause]], a
   network blip). The group decides it's dead and gives its partition to
   another instance, which starts on A. Then the first one wakes up and
   carries on writing too. Now two processes are doing the same work.

Transactions exist for the second and third.

## The trick: an offset commit is just another write

Kafka stores a group's committed offsets as messages in an internal
topic. So from Kafka's side, "write B to `payment-checks`" and "commit
offset 44 for partition 0" are both writes to topics. A
[[transaction]] that spans several partitions can make them atomic:

![The fraud checker reads payment A at offset 43 of payments partition 0 and computes B. Inside a dashed box labelled "one transaction: both writes, or neither" it writes B to payment-checks and writes the group's next offset, 44, to the offsets topic. It then asks the transaction coordinator to commit, and the coordinator writes commit markers.](img/exactly-once-processing-transaction.svg)

*The output and the input's offset commit go in one transaction. Adapted from Apurva Mehta and Jason Gustafson, "Transactions in Apache Kafka" (Confluent, 2017).*

The loop looks like this:

1. `poll` a batch from the input.
2. `beginTransaction`.
3. Process, and `send` every output record.
4. `sendOffsetsToTransaction` with the offsets you just consumed and
   the consumer's group metadata.
5. `commitTransaction`.

Only the producer is transactional. It commits the offsets on the
consumer's behalf, which is why the consumer runs with
`enable.auto.commit=false`. If anything fails before step 5, the
transaction aborts: read_committed readers never see B, and the
committed offset stays at 43.

## How the commit works

Each broker runs a transaction coordinator, and every producer's
`transactional.id` maps to exactly one of them. The coordinator keeps
transaction state in its own internal topic, so a new coordinator can
take over if a broker dies.

Committing is a [[two-phase-commit]] run by the coordinator:

- **Prepare.** It writes "prepare commit" to its log. From that moment
  the transaction will commit, whatever fails next.
- **Markers.** It writes a commit marker into each partition that was
  part of the transaction, then records the transaction as complete.

The markers are how readers know what to show. A consumer with
`isolation.level=read_committed` only gets transactional records whose
transaction committed, and it can't move past a transaction that's
still open, so later records in that partition wait. Markers are
written into the log like records.

Watch the default: **it's `read_uncommitted`**,
which hands out records from aborted transactions too. Every consumer
downstream has to opt in to `read_committed`, or it will read verdicts
that were rolled back.

The cost is per transaction, not per message: a few extra requests,
one marker per partition, and a few log writes. So bigger transactions
are cheaper per message. Confluent measured a 3% throughput drop for
1 KB records committed every 100 ms, on Kafka 0.11 in 2017. The catch
is latency: read_committed readers wait for the commit, so a longer
commit interval delays them. Kafka Streams, in
Kafka 4.3, commits every 100 ms under exactly-once, against every 30
seconds under at-least-once.

## Fencing the zombie

The third failure needs something else: a way to shut out the old
instance.

A transactional producer registers its `transactional.id` when it
starts. The coordinator finishes any transaction the previous holder of
that id left open and bumps an epoch. From then on, writes from an
older epoch are rejected. The zombie wakes up, tries to commit, and
gets fenced. That's the same idea as a [[fencing-tokens|fencing
token]].

This only works if the same `transactional.id` always handles the same
input partitions. But a [[consumer-groups|consumer group]] moves
partitions between members on every rebalance. Kafka Streams first
solved this with one producer per input partition, which doesn't scale:
each producer has its own buffers, thread and connections.

KIP-447 (Kafka 2.6) fixed it from the other side. The producer now
sends the consumer's group metadata (the generation and member id)
with its offset commit, and the group coordinator rejects a commit
from a member that's no longer current. If a new owner asks for a
partition's offset while the old owner still has offsets in an open
transaction, it's told to wait until that transaction commits or times
out. That trades a little availability for correctness. In Kafka
Streams this is `processing.guarantee=exactly_once_v2`, which needs
brokers from 2.5 on.

## When the output isn't Kafka

Kafka's transactions cover writes to Kafka topics. Side effects in any
other system are outside them.

If the checker writes verdicts into Postgres instead, the same idea
still works without Kafka's help: store the offset in the database, in
the same transaction as the verdict. On startup, read the offset from
the database and resume from there. That's simpler than coordinating Kafka
and the database with two-phase commit, which many systems don't
support anyway. [[stream-processing|Stream processors]] that write to external systems use
variations on this; see [[transactional-sinks]].

If processing sends an email or calls a payment API, no transaction
covers it. A retry sends the email again. Those effects need their own
[[idempotency]], such as an [[idempotency-keys|idempotency key]] the other side
checks.

## Where it gets tricky

**It's about effects, not delivery.** A message can still be read
twice; what exactly-once promises is that the committed results look
as if it was processed once. That's why the name confuses people, and
why a product's exactly-once claim needs its fine print read.

**An abort doesn't rewind your consumer.** When a transaction aborts,
the committed offset stays put, but the consumer's in-memory position
has already moved on. If you just keep polling, you skip the records
from the aborted transaction. You have to seek back to the committed
offset yourself, or throw away the producer and consumer and start
fresh. A 2024 Jepsen analysis found this happening in tests (the
consumer rewound only if a rebalance happened to occur), learned it was
intended, and noted it wasn't documented then. The Kafka 4.3 design
docs now say it plainly.

**The protocol itself had a hole.** The same analysis found aborted
reads and torn transactions in Kafka under process pauses,
tracked as KAFKA-17754. The cause: the protocol had no transaction
number, so a delayed commit or abort from one transaction could land
in the next. Kafka 4.0 shipped KIP-890, which bumps the producer's
epoch on every transaction so each one is uniquely identified, for 4.0
clients. Kafka's engineers expected that to fix the problem; the
Jepsen report was written while that work was still in progress. The
upgrade notes also ask applications to handle
`TransactionAbortableException` by aborting the transaction.

**It rests on assumptions you have to keep.** Exactly-once holds only
if you process every record you poll, process every record inside a
transaction, and commit the offsets of what you consumed. Skip one of
those and the guarantee quietly goes away.

**Reads aren't atomic.** A read_committed consumer sees only committed
data, but it may not be subscribed to every partition a transaction
wrote to, so it can't see a transaction as one unit.

## What this means when you build

- For Kafka-to-Kafka work, use Kafka Streams with `exactly_once_v2`
  before rolling your own loop.
- If you roll your own: a `transactional.id`, `read_committed`, auto
  commit off, offsets sent with the group metadata, and a rewind on
  every abort.
- Set `read_committed` on every consumer downstream.
- For a database output, commit the offset in the same database
  transaction. For anything else, make the effect idempotent.
- Pick the commit interval as a latency choice: it sets how long
  readers wait for results.

## Further reading

- [Kafka design: Message Delivery Semantics and Using Transactions](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. The official account: offsets in the same transaction, storing offsets with external output, the required settings, and rewinding on abort.
- [Transactions in Apache Kafka](https://www.confluent.io/blog/transactions-apache-kafka/), Apurva Mehta and Jason Gustafson, Confluent, 2017. The three failure cases, zombie fencing, the coordinator and markers, and the performance trade-offs, from the people who built it.
- [KIP-447: Producer scalability for exactly once semantics](https://cwiki.apache.org/confluence/display/KAFKA/KIP-447%3A+Producer+scalability+for+exactly+once+semantics), Jason Gustafson and others, Apache Kafka. Why transactional ids clashed with consumer groups, and how group metadata fixed it.
- [Jepsen: Bufstream 0.1.0](https://jepsen.io/analyses/bufstream-0.1.0), Kyle Kingsbury, 2024. What Kafka transactions actually guarantee under faults, the abort-rewind surprise, and KAFKA-17754.
- [Upgrading](https://kafka.apache.org/43/getting-started/upgrade/), Apache Kafka 4.3 docs. KIP-890's per-transaction epoch bump in Kafka 4.0.
- [Configuring a Streams Application](https://kafka.apache.org/43/streams/developer-guide/config-streams/), Apache Kafka 4.3 docs. `processing.guarantee` and the commit interval under each guarantee.

---
id: idempotent-producers
title: Idempotent producers
depth: short
phase: 10
note: >-
  The broker drops a producer's retried duplicates by checking a
  sequence number per partition.
needs: [kafka-architecture, idempotency, delivery-guarantees]
leads_to: [exactly-once-processing]
compare_with: [idempotency-keys, log-compaction, message-ordering]
---

# Idempotent producers

A producer sends a batch, the broker writes it, and the acknowledgment
is lost on the way back. The producer retries, and now the batch is in
the log twice. An idempotent producer tags every batch with a producer
ID and a sequence number per partition, so the broker can recognize a
retry it has already written and drop it. In Kafka it's on by default
since 3.0.

## Why retries make duplicates

A request that times out tells the producer nothing. The write may
have failed, or it may have succeeded and only the reply was lost. The
producer can't tell which. If it retries, a lost reply turns into a
duplicate, which is at-least-once delivery. If it doesn't, a failed
write turns into a lost message, which is at-most-once (see
[[delivery-guarantees]]).

The fix is the usual one for retries: make the write
[[idempotency|idempotent]], so doing it twice has the effect of doing
it once. Here the broker does it, with no keys from the application.

## Producer ID and sequence numbers

When an idempotent producer starts, it gets a producer ID (PID) from
the cluster. Then, for each partition it writes to, it numbers its
records from 0 upward, one number per record. Every batch in
[[kafka-architecture|Kafka]] carries, in its header, the producer ID,
a producer epoch, and the sequence number of its first record. With
the record count, that gives the batch's last sequence number too.
They sit once per batch, not per record.

For each partition and each producer ID, the partition leader
remembers the last sequence number it appended and the sequence ranges
of the last 5 batches. When a batch arrives it checks:

- **First sequence is one past the last one appended:** append it.
- **Same epoch, and first and last sequence match one of the 5 cached
  batches:** a duplicate. Don't write it; reply with the offsets the
  original got, so the producer sees success.
- **First sequence is further ahead:** there's a gap, so records were
  lost. The broker rejects it with `OutOfOrderSequenceException`.

Sequence numbers wrap to 0 after the largest 32-bit integer.

![Sequence diagram between a producer and a partition leader. The producer sends a batch with PID 7 and sequence 0 to 9; the leader appends it at offsets 100 to 109, but the acknowledgment is lost. The producer times out and resends the same batch, sequence 0 to 9; the leader finds that range in its cache of the last 5 batches for PID 7, writes nothing, and replies with offsets 100 to 109. The next batch, sequence 10 to 19, is appended at offsets 110 to 119. A batch starting at sequence 25 would be rejected as out of order.](img/idempotent-producers-retry.svg)

*A retried batch is recognized by its sequence range and answered with the original offsets.*

## Why at most 5 requests in flight

A producer can send several requests without waiting for replies. With idempotence on, Kafka 4.3 allows at most 5 in flight
per connection, because the broker keeps only 5 batches per producer
to compare against. With more, the broker may already have dropped the
batch a retry needs to match.

This also keeps order. Without idempotence, more than one request in
flight plus retries can reorder records: batch 2 lands, batch 1 fails
and is retried after it. With sequence numbers, the broker refuses
batch 2 until batch 1 is in (see [[message-ordering]]).

Idempotence needs `acks=all` and retries above 0 as well. The original
design (KIP-98, Kafka 0.11.0.0) required a single request in flight
and was off by default. Kafka 3.0 turned it on by default and changed
the default `acks` from 1 to `all`.

## It survives a leader change

[[tcp|TCP]] also numbers its bytes to drop duplicates, but those
numbers live only in one connection's memory. Kafka's sequence numbers
are written into the batch headers in the replicated log. When a
leader fails, the replica that takes over has them too, and still
spots a retried batch.

For the same reason, [[log-compaction]] never deletes a batch's
sequence range, even when every record in it is gone.

## Where it gets tricky

**Only within one producer session.** A restarted producer gets a new
producer ID and starts again at 0, so the broker can't match a retry
from before the restart. Surviving restarts needs a `transactional.id`,
which keeps the same ID and bumps the epoch to fence off the old
instance. That's the road to [[exactly-once-processing]].

**Only one partition at a time.** Sequence numbers are per partition.
Atomic writes across partitions need transactions.

**Only the producer's own retries.** If your application calls `send`
twice for the same event, say after crashing and redoing its work, the
broker sees two different records. Deduplicating those is an
application job, with [[idempotency-keys]] or keyed upserts.

**The broker forgets.** A partition leader drops a producer ID after
`producer.id.expiration.ms` without writes (1 day by default in Kafka
4.3), or sooner if retention deletes the producer's last write. Keep
it at least as long as the producer's `delivery.timeout.ms` (2 minutes
by default), or a late retry can slip through as a duplicate.

**It can switch off quietly.** If you set something that conflicts,
such as `acks=1`, and don't set `enable.idempotence=true` explicitly,
the producer turns idempotence off without an error. Set it explicitly
and a conflict throws a `ConfigException` instead.

## What this means when you build

- Per partition and producer ID, keep the last sequence number and the
  ranges and offsets of the last few batches. Answer a duplicate with
  the original offsets.
- Store the producer ID and sequence in the log itself, so a restart
  or a new leader can rebuild the state from the log.
- Treat a gap as data loss and fail loudly.
- Set `enable.idempotence=true` explicitly.

## Further reading

- [KIP-98: Exactly Once Delivery and Transactional Messaging](https://cwiki.apache.org/confluence/display/KAFKA/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging), Apurva Mehta and others, Apache Kafka. The design: producer IDs, sequence numbers, duplicates versus gaps, epochs, and why the fields sit in the batch.
- [Producer Configs](https://kafka.apache.org/43/configuration/producer-configs/), Apache Kafka 4.3 docs. `enable.idempotence` and what it requires, and why in-flight requests stop at 5.
- [Kafka storage log package](https://github.com/apache/kafka/tree/4.3.0/storage/src/main/java/org/apache/kafka/storage/internals/log), Apache Kafka 4.3.0 source. ProducerStateEntry and UnifiedLog: the 5-batch cache and the duplicate check.
- [Exactly-once Semantics are Possible: Here's How Apache Kafka Does it](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/), Neha Narkhede, Confluent, 2017. Why sequence numbers in the replicated log beat TCP's.
- [KIP-679: Producer will enable the strongest delivery guarantee by default](https://cwiki.apache.org/confluence/display/KAFKA/KIP-679%3A+Producer+will+enable+the+strongest+delivery+guarantee+by+default), Cheng Tan and others, Apache Kafka. The default change in 3.0.
- [Broker Configs](https://kafka.apache.org/43/configuration/broker-configs/), Apache Kafka 4.3 docs. How long a leader remembers a producer ID.

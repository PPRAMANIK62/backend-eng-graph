---
id: log-compaction
title: Log compaction
depth: short
phase: 10
note: >-
  Keeping only the latest value for each key instead of deleting by age.
needs: [log-segments]
leads_to: [change-data-capture]
compare_with: [compaction, idempotent-producers, event-sourcing]
---

# Log compaction

Time-based retention forgets data by age. Log compaction forgets it by
key: for each key, the log keeps at least the latest record and drops
older ones. The topic stops growing without bound, and a new consumer
can still read it from the start and rebuild the current value of
every key.

## A topic of email addresses

Say every time a user changes their email, you write a record keyed
by their user ID:

```
123 => bill@microsoft.com
...
123 => bill@gatesfoundation.org
...
123 => bill@gmail.com
```

With seven days of time-based retention, a user who changed their
email eight days ago has vanished from the topic. A consumer building a
cache from it would never learn their address. Keeping everything
forever fixes that, but the log grows with every update even when the
number of users doesn't.

Compaction keeps `123 => bill@gmail.com` and throws away the two
older values. The topic becomes a full snapshot of the latest value per
key, with recent changes still in order on top. That's what you want
for rebuilding a cache or search index from a stream of database
changes ([[change-data-capture]]), for [[event-sourcing|event-sourced]]
state, or for restoring a stream processor's local state after a
crash.

In Kafka it's a per-topic setting: `cleanup.policy=compact` instead of
the default `delete`.

## Head and tail

Picture the partition's log in two parts. The **head** is everything
written since the last cleaning: dense offsets, every record. The
**tail** has been cleaned: only the latest record per key survives.

![A log before and after one cleaning pass. Before: offsets 0 to 7 in closed segments hold keys A, B, C and D, with several values for A and B, and offset 6 a tombstone for B; offsets 8 and 9 sit in the active segment. After: only offsets 3 (C), 5 (A), 6 (the B tombstone) and 7 (D) survive in the closed segments, with gaps where the others were, and the active segment is untouched. Offsets never change, and a read starting at offset 1 returns offset 3 first.](img/log-compaction-before-after.svg)

*One cleaning pass over the tail. The example is ours; the head and tail framing is from the Kafka 4.3 design docs.*

Three things never change, and they're what make a compacted log safe
to read:

- **Offsets.** A surviving record keeps the offset it was written at.
  The removed ones leave gaps. Asking for a missing offset returns the
  next one that exists.
- **Order.** Compaction only removes records. It never reorders them.
- **The head.** A consumer that keeps up with the head sees every
  record, in order, with no gaps.

## How the cleaner works

Compaction runs in background threads, the log cleaner, working on
[[log-segments]]. Each pass goes like this:

1. **Pick a log.** The one with the highest ratio of dirty head to
   clean tail. A log is only eligible once that ratio passes
   `min.cleanable.dirty.ratio`, 0.5 by default in Kafka 4.3, which
   means at most half the log can be old duplicates.
2. **Map the head.** Read the head and build a hash table from each
   key to its last offset. The table is kept compact, 24 bytes per
   entry. At that size, 8 GB of cleaner buffer covers about 366 GB of head,
   assuming 1 kB messages.
3. **Recopy.** Read the log from the start and copy each record to new
   segment files, unless the map shows a later offset for its key.
4. **Swap.** Put each clean segment in place of the old ones as soon
   as it's ready, so the extra disk space needed is about one segment.

The active segment is never compacted. Cleaning doesn't block reads,
and it can be throttled to a set amount of I/O so producers and
consumers don't notice.

## Deleting a key: tombstones

To delete a key, write a record with that key and a null value, called
a tombstone. The cleaner then removes every earlier record for the
key. The tombstone itself stays for `delete.retention.ms` (1 day by
default), so consumers can see the delete, and then it's removed too.

That gives a deadline: a consumer rebuilding state from offset 0 has
to reach the head within `delete.retention.ms`. If it's slower, a
tombstone can be cleaned away before it's read, and the consumer keeps
a key that was deleted.

## Where it gets tricky

**"Latest value only" means "at least the latest".** Until the cleaner
reaches them, old values are still there, and a consumer reading from
the start sees several values for one key. Treat every record as an
upsert. `max.compaction.lag.ms` sets a deadline for cleaning, but not a
hard one: it still depends on free cleaner threads.

**Delete and compact together.** `cleanup.policy=delete,compact`
compacts, and also drops whole segments by age or size. Then the topic
is no longer a full snapshot.

**It isn't LSM compaction.** An [[lsm-tree]]'s [[compaction]] merges
sorted files by key. A compacted Kafka log is in offset order, and the
cleaner keeps that order and every surviving offset.

**Empty batches can stay.** The cleaner keeps each batch's first and
last sequence numbers even when every record in it is gone, because
[[idempotent-producers]] need them to spot duplicates. A compacted log
can hold batches with no records.

## What this means when you build

- Key records by the entity they describe, so "latest per key" means
  "current state".
- Make consumers of a compacted topic idempotent upserts, and handle
  null values as deletes.
- Set `delete.retention.ms` longer than your slowest full replay.
- In a broker of your own, the cleaner is a hash map over the head, a
  recopy of closed segments, and an atomic swap.

## Further reading

- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. The Log Compaction section: the email example, head and tail, guarantees, tombstones and the cleaner's steps.
- [Topic Configs](https://kafka.apache.org/43/configuration/topic-configs/), Apache Kafka 4.3 docs. `cleanup.policy`, the dirty ratio, compaction lag and tombstone retention, with defaults.
- [Implementation, Message Format](https://kafka.apache.org/43/implementation/message-format/), Apache Kafka 4.3 docs. What compaction keeps from each batch so producer state survives.

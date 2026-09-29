---
id: offsets-and-commits
title: Offsets and commits
depth: short
phase: 10
note: >-
  A consumer's place in the log, and when to save it.
needs: [consumer-groups, delivery-guarantees]
leads_to: [consumer-lag, exactly-once-processing, distributed-snapshots, poison-messages]
compare_with: []
---

# Offsets and commits

A consumer's place in a Kafka partition is a single number, the offset
of the next record it will read. Committing saves that number so a
restarted consumer, or whoever takes over the partition, knows where to
resume. When you commit, relative to when you do the work, decides
whether a crash loses messages or repeats them.

## One number per partition

Every record in a partition has an offset, a number that identifies it
there and gives its place in the order. A consumer at position 5 has
seen offsets 0 to 4 and will get 5 next.

Because each partition is read by only one member of a
[[consumer-groups|consumer group]] at a time, the group's progress on
that partition is just one integer. Compare a classic
[[message-queue]], where the broker tracks every message as handed out,
acknowledged or not. Here there's nothing per message to track, so
"acknowledging" is cheap: you save one number now and then.

Offsets aren't always consecutive. Compacted topics (see
[[log-compaction]]) and transactions leave gaps, so never assume the
next record is your offset plus one.

## Two positions, not one

A consumer holds two numbers for each partition:

- **The position**: the offset of the next record `poll` will return.
  It moves forward on every poll, in memory.
- **The committed offset**: the last position saved to the broker. On
  restart, or when another consumer takes over, this is where reading
  starts.

Kafka stores committed offsets as messages in an internal topic.

![A partition with records 0 to 11. Records 0 to 3 are processed and committed; the committed offset marker sits at 4. Records 4 to 7 have been fetched but not committed; the position marker sits at 8. Records 8 to 11 have not been fetched; the log end marker sits at 12. A note says a restart resumes at 4, so records 4 to 7 are read again whether or not they were processed.](img/offsets-and-commits-positions.svg)

*Everything between the committed offset and the position gets read again after a crash.*

The committed number is the offset of the *next* record to read, not
the last one you handled. Commit 4 after processing record 3. An
off-by-one here reprocesses or skips a record on every restart.

## When to commit

The gap between the two numbers is the window a crash can hit. What you
do at each end of it gives you the guarantees in
[[delivery-guarantees]]:

- **Commit, then process.** A crash after the commit skips the records
  you hadn't finished. At most once.
- **Process, then commit.** A crash before the commit makes the next
  owner redo them. At least once.

The Java client offers three ways to commit:

- **Automatic** (`enable.auto.commit=true`, the default, every 5
  seconds). It gives at least once only if you finish every record from
  one `poll` before calling `poll` again. Hand records to another
  [[thread]] and return early, and the committed offset can run ahead of
  what's done: a crash then loses records.
- **`commitSync`** after the work. For example, batch records, insert
  them into a database, then commit. A crash between insert and commit
  repeats the insert.
- **Store the offset yourself**, in the same database [[transaction]] as
  the results, and `seek` to it on start. Then the results and the
  offset can't disagree. That's the base of
  [[exactly-once-processing]].

## Where it gets tricky

**No committed offset.** A new group, or a partition it never
committed, starts wherever `auto.offset.reset` says: `earliest`,
`latest`, a duration back, or `none` (throw an error). The same
happens when the committed offset points at data retention has already
deleted. `latest` has a trap: add partitions to a topic, and producers
may write to the new ones before the consumers pick an offset, so those
first messages are skipped.

**Committed offsets expire.** In Kafka 4.3 the broker drops a group's
committed offsets 10,080 minutes (7 days) after the group has no
members (`offsets.retention.minutes`). A consumer that was stopped
longer than that comes back with no committed offset, and
`auto.offset.reset` decides whether it rereads everything or skips to
the end.

**Commits from a consumer that was kicked out fail.** After a
rebalance, a consumer that lost its partitions can't commit for them.
Its work since the last commit is redone by the new owner.

**Rewinding is a feature.** You can `seek` back and reread, for
example after fixing a bug that mangled the last hour of output, as
long as the data is still retained. Your processing has to be safe to
repeat for that to be useful.

## What this means when you build

- Commit after the work, and make the work safe to repeat
  ([[idempotency]]).
- If you process on other threads, turn off auto commit and commit only
  offsets whose records are fully done.
- Set `auto.offset.reset` on purpose; the choice decides what a new or
  expired group does.
- If a consumer can be down for days, know your offset retention.

## Further reading

- [KafkaConsumer](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html), Apache Kafka 4.3 Javadoc. Position vs committed offset, auto and manual commits, and storing offsets outside Kafka.
- [Kafka design](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. Why a consumer's position is one integer, and how commit order sets the delivery guarantee.
- [Consumer Configs](https://kafka.apache.org/43/configuration/consumer-configs/), Apache Kafka 4.3 docs. `enable.auto.commit`, `auto.commit.interval.ms` and `auto.offset.reset`, with their defaults and warnings.
- [Broker Configs](https://kafka.apache.org/43/configuration/broker-configs/), Apache Kafka 4.3 docs. `offsets.retention.minutes`: when committed offsets are thrown away.

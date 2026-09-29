---
id: checkpoints
title: Checkpoints
depth: short
phase: 7
note: >-
  Flushing dirty pages so recovery doesn't replay the whole log, and the
  I/O spike that comes with it.
needs: [write-ahead-log, buffer-pool]
leads_to: [full-page-writes, crash-recovery]
compare_with: [distributed-snapshots]
---

# Checkpoints

A checkpoint is a point in the log where the database makes sure every
change logged before it has reached the data files. After a crash,
recovery can start from the last checkpoint instead of the start of the
log, and the log before it can be thrown away. The cost is a burst of
page writes, one you'll see in latency graphs if it isn't spread out.

## Why the log needs cutting

A [[write-ahead-log]] database commits by flushing the log, and leaves
the changed pages dirty in the [[buffer-pool]] to be written later.
That's fast, but it means the data files are always behind the log.
After a crash, recovery has to replay the log to catch them up.

Without anything else, the log grows forever, and recovery has to replay
all of it. Checkpoints put a bound on that.

## What happens at a checkpoint

Postgres does it like this:

1. Write every dirty page in the buffer pool to the data files.
2. Write a special checkpoint record to the WAL.

Once that's done, every change logged before the checkpoint's starting
point, which Postgres calls the **redo record**, is on the data pages.
After a crash, recovery looks up the latest checkpoint record and
replays the WAL only from its redo record onward. Log segments older
than that are no longer needed and get recycled or removed (after
archiving, if you archive WAL).

![The WAL drawn as a row of segment files, oldest on the left. A checkpoint starts at the redo record and writes dirty pages spread out over a stretch of log; the checkpoint record is written when it finishes. The segments before the redo record are greyed out as no longer needed. A crash near the right end means recovery replays only from the redo record to the crash.](img/checkpoints-log.svg)

*A checkpoint moves the starting point of recovery forward, and frees the log behind it.*

Postgres starts a checkpoint every `checkpoint_timeout` (5 minutes by
default) or when the WAL is about to exceed `max_wal_size` (1 GB by
default), whichever comes first. It skips one if nothing was written
since the last, and you can force one with the `CHECKPOINT` command.

## Stop the world, or keep going

The simplest checkpoint stops new [[transaction|transactions]] from starting, waits for
running ones to finish, and flushes every dirty page. Recovery is then
simple, but the database is frozen while it happens.

A **fuzzy checkpoint** lets transactions keep running. It writes a
begin record, then an end record holding two tables: the transactions
that were active and the pages that were dirty, each with the LSN of
the record that first dirtied it. Only when the end record is safe does
a master record point at the new checkpoint. Recovery then knows which
transactions to look at and where the oldest unwritten change could be.
This is the approach ARIES uses; see [[crash-recovery]].

## The I/O spike

Writing out every dirty page is a lot of I/O at once. If it all goes in
one burst, everything else running on the database slows down while it
lasts.

Postgres spreads it out. `checkpoint_completion_target` (0.9 by
default) sets what fraction of the interval the writes should take, and
Postgres paces them to finish around then. The catch is that recovery
needs more WAL kept around while a slow checkpoint is still running.

There's a second trap at the end. Pages the checkpoint wrote may still
sit in the operating system's [[page-cache]], and the final [[fsync]] then
has to push them all out at once, which stalls. Postgres's
`checkpoint_flush_after` asks the kernel to write them out as it goes.
It often helps latency, but it can hurt workloads that fit in the page
cache and not in Postgres's own buffers.

## Where it gets tricky

**More often isn't simply better.** Frequent checkpoints make recovery
faster, since there's less log to replay. But they write dirty pages
more often, and in Postgres they also make the WAL bigger: the first
change to each page after a checkpoint logs the whole page
([[full-page-writes]]). Rare checkpoints mean less I/O but longer
recovery. Postgres logs a warning (`checkpoint_warning`) if WAL-driven
checkpoints come too close together, as a hint to raise `max_wal_size`.

**Same word, different idea.** A stream processor's checkpoint ([[stateful-stream-processing]]) is a
consistent snapshot of operator state, closer to
[[distributed-snapshots]] than to this. A database checkpoint is about
bounding the log.

## What this means when you build

- Your engine needs some point where "everything before this is in the
  data files" is true, written down in a place recovery reads first.
- Spread checkpoint writes out rather than doing them in one burst.
- Pick the interval by how long you can afford recovery to take, then
  check what it costs in I/O.

## Further reading

- [WAL Configuration](https://www.postgresql.org/docs/current/wal-configuration.html), PostgreSQL Global Development Group, PostgreSQL 18. What a Postgres checkpoint writes, when it runs, and how it's spread out.
- [Lecture #21: Database Crash Recovery](https://15445.courses.cs.cmu.edu/fall2024/notes/21-recovery.pdf), Andy Pavlo, CMU 15-445, 2024. Blocking vs fuzzy checkpoints, and the tables a fuzzy checkpoint records.

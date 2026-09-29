---
id: group-commit
title: Group commit
depth: short
phase: 7
note: >-
  Many transactions sharing one fsync.
needs: [write-ahead-log]
leads_to: []
compare_with: []
---

# Group commit

Group commit means several [[transaction|transactions]] that commit at about the same
time share one [[fsync]] of the log. Every commit has to wait for a
flush, and flushes can be slow, so sharing them is how a database
commits more transactions per second than its drive can do fsyncs.

## One fsync, many commits

A commit in a [[write-ahead-log]] database isn't done until the log is
flushed up to its commit record. Picture three clients, A, B and C,
committing a moment apart, with each commit doing its own flush:

1. A writes its commit record and fsyncs. Everyone else waits.
2. B writes its commit record and fsyncs.
3. C writes its commit record and fsyncs.

That's three flushes, one after another. But the log is written in
order, so a flush that reaches C's commit record also covers everything
before it. B and C don't need a flush each. They need one flush that
goes past both of their records.

So the database does this instead:

1. A reaches commit first. It becomes the **leader** and starts the
   fsync.
2. B and C reach commit while A's fsync is running. They add their
   commit records to the log buffer and queue up behind.
3. When A's fsync returns, the next leader flushes up to the newest
   commit record, C's. That one fsync makes both B and C durable.
4. Everyone whose commit record is now on disk gets their reply.

![Two timelines. Top, one fsync per commit: A, B and C each wait for their own fsync in turn, three fsyncs in a row. Bottom, group commit: A's fsync runs alone; B and C arrive during it and wait; one fsync then covers both B and C. Replies go out when the fsync covering each commit record returns.](img/group-commit-timeline.svg)

*Three commits, two fsyncs: B and C ride the same flush.*

Nobody is told "committed" early. Each reply still waits for an fsync
that covers its commit record. The group just means one fsync covers
more than one of them.

## How real engines do it

**Postgres** forms groups on its own: with the default settings, a group
is every session that got to its commit while the previous flush was
running. At higher client counts this happens a lot, enough to have a
name: the "gangway effect".

You can also ask Postgres to wait for a bigger group. With
`commit_delay` set (in microseconds; the default is zero), the leader
sleeps that long before flushing, so more commit records can join. It
only sleeps if at least `commit_siblings` other transactions are
active, since sleeping with nobody else around is pure waste. A good
starting value is half the time `pg_test_fsync` reports for one flush
after an 8 kB write; then test it against a real workload.

**RocksDB** does the simple version. When several [[thread|threads]] write at
once, the writes that can be combined go into the WAL as one write with
one fsync. A group is capped at 1 MB, writes with different options may
not combine, and RocksDB never delays a write to make the group bigger.

## Where it gets tricky

**It only helps with company.** A single client committing in a loop
gets nothing: there's never anyone to share a flush with. Group commit
helps when several transactions commit at once and the commit rate is
what limits throughput.

**Waiting trades latency for throughput.** `commit_delay` makes the
leader, and everyone queued behind it, wait longer for their reply. Set
it too high and the extra latency grows so much that total throughput
drops instead of rising.

**It's not asynchronous commit.** Both sound like "commit without paying
for a whole fsync", but they're opposites. Asynchronous commit replies
before the flush and accepts losing the last few transactions in a
crash (see [[write-ahead-log]]). Group commit never replies before the
flush, even with `commit_delay` set.

## What this means when you build

- In your own log, don't fsync per write. Have one writer collect every
  pending record, fsync once, then acknowledge all of them together.
  The phase 1 [[append-only-log]] can work this way.
- Acknowledge each write only when the fsync that covers it returns.
- Don't add a deliberate delay until you've measured your fsync time
  and seen that commit rate is really the limit.

## Further reading

- [WAL Configuration](https://www.postgresql.org/docs/current/wal-configuration.html), PostgreSQL Global Development Group, PostgreSQL 18. How Postgres's group commit leader and followers work, and how to tune `commit_delay` and `commit_siblings`.
- [WAL Performance](https://github.com/facebook/rocksdb/wiki/WAL-Performance), RocksDB team. RocksDB's simpler group commit: combine concurrent writes, one fsync, no delay.

---
id: write-ahead-log
title: The write-ahead log
depth: deep
phase: 7
note: >-
  Log every change and fsync the log before the changed pages reach
  disk. Log records, LSNs, and when a commit counts.
needs: [fsync, append-only-log]
leads_to: [group-commit, checkpoints, full-page-writes, crash-recovery, lsm-tree, logical-replication, leader-follower-replication, backups, transaction]
compare_with: [redis-persistence, open-table-formats]
---

# The write-ahead log

A write-ahead log (WAL) is a file where a database writes down every
change before it changes the data itself. The rule is short: the log
record for a change reaches stable storage before the changed page does,
and a transaction counts as committed only once its log records are
there. Almost every database is built on one, Postgres and RocksDB
included, and it decides what "committed" means, how fast a commit can
be, and how the database comes back after a crash.

## One transfer, two pages

Say your app moves 100 from account 7 to account 42 in one
[[transaction]]: two `UPDATE`s. The two rows sit on two different
[[database-pages|pages]] of the table file. The database reads both
pages into its [[buffer-pool]], changes them in memory, and now holds
two dirty pages.

The obvious way to make the commit durable is to write both pages back
and [[fsync]] the table file before you reply. It works, but every
commit then pays for writes to scattered spots in the file, each a whole
page, to save a few changed bytes.

With a write-ahead log the database does this instead:

1. For each change, it appends a small record to the log, something
   like "page 12, row 3: balance 500 → 400". The records collect in a
   log buffer in memory.
2. At commit, it appends a commit record, then writes and fsyncs the log
   up to and including that record.
3. It replies "committed".
4. Later, whenever it suits, it writes the dirty pages to the table
   file.

If the machine dies between steps 3 and 4, the table file is missing
the transfer, but the log has it. On restart the database reads the log
and applies the changes again. That replay is [[crash-recovery]].

This is faster for three reasons. Only the log has to be flushed at
commit, not every data file the transaction touched. The log is written
in order, one record after another, so syncing it costs much less than
flushing pages spread across the disk. And when many small transactions
commit at once, one fsync of the log can cover all of them; that's
[[group-commit]].

![Memory above, disk below. In memory, pages 12 and 31 in the buffer pool are dirty with page LSNs 100 and 140, and the log buffer holds records LSN 100 and 140 (updates) and 180 (commit). Step 1: the log is written and fsynced to the WAL file up to LSN 180. Step 2: only then does the client get "committed". Step 3, later: the dirty pages are written over the old ones in the table file, each only after the log is flushed past its page LSN.](img/write-ahead-log-rule.svg)

*The order that makes a WAL work: log first, reply second, data pages whenever.*

## Two rules

Everything above comes down to two rules.

**Log before data.** A page may not be written to disk until the log
records describing its changes are on stable storage.

**Log before commit.** A transaction isn't committed until all its log
records, up to and including the commit record, are on stable storage.
Only then may you tell anyone it's done.

The first rule is what lets the buffer pool write a page whenever it
likes, even one holding changes from a transaction that hasn't
committed yet. If that transaction later fails, the log has what's
needed to undo the change on disk.

Database people name the two freedoms this buys:

- **Steal**: the buffer pool may write a page with uncommitted changes
  to disk. Without it, every page a transaction changes has to fit in
  memory until commit, and a busy page that always holds someone's
  uncommitted update might never get written at all.
- **No-force**: a transaction may commit without its pages being
  written. Without it, every commit pays for page writes.

A WAL gives you both, which is why nearly every database uses one. The
price is paid at restart: recovery has to redo committed changes that
never reached the data file (no-force) and undo uncommitted changes
that did (steal).

## LSNs: numbering the log

Every log record gets a **log sequence number** (LSN), and LSNs only go
up. In Postgres the LSN is simply a byte offset into the WAL, so
subtracting two LSNs tells you how many bytes of log lie between them.
That's how Postgres measures how far behind a replica is, or how far
recovery has got.

The LSN is also how a database enforces the rules cheaply:

- Every page stores the LSN of the last record that changed it (the
  page LSN).
- Before writing a page, the database makes sure the log has been
  flushed at least up to that page LSN. If it hasn't, it flushes the
  log first.

During recovery the same number answers "is this change already on the
page?". If the page on disk has an LSN at or past the log record's, the
change is there and gets skipped. That's what makes replaying the log
safe to repeat.

## What a record holds

A log record needs enough to replay or reverse one change: the
transaction, the object it touched, the old value (for undo), the new
value (for redo), plus housekeeping like a [[checksums|checksum]].

There are three ways to describe the change:

- **Physical**: the exact bytes at an exact place, like a diff.
- **Logical**: the operation, such as the SQL statement. Records are
  small, but replay means re-running every statement, and getting the
  same result with concurrent transactions is hard.
- **Physiological**: aimed at one page, but naming the row by its slot
  number rather than a byte offset, so the page can be tidied up after
  the record is written. This is the most common choice.

On disk, the log itself is an [[append-only-log]]: records with a
length and a checksum, so recovery can spot a record cut short by the
crash and stop there. Postgres keeps its WAL in the `pg_wal` directory
as a series of segment files, 16 MB each by default, split into 8 kB
pages. The files get ever-increasing names starting at
`000000010000000000000001`.

## When a commit really counts

A commit is durable at exactly one moment: when the fsync covering its
commit record returns. Anything you tell a client before that is a
promise the database might not keep.

Some systems let you move that line on purpose:

- **Postgres asynchronous commit** (`synchronous_commit = off`) replies
  as soon as the transaction is done in memory, before its log records
  are flushed. For short transactions the flush is a big part of the
  commit time, so this is a real speed-up. If the server crashes, you
  lose the last few transactions, but the database stays consistent:
  replay happens in commit order, so if B depended on A, you can't end
  up with B and not A. The window is at most three times
  `wal_writer_delay`, and you can pick the mode per transaction.
- **RocksDB's default** (`WriteOptions.sync = false`) doesn't sync the
  WAL at all on each write, so in this mode the WAL write isn't crash
  safe. Set `sync = true` and the WAL is fsynced before the write
  returns.

Postgres's `fsync = off` is a different thing entirely. It stops
Postgres from syncing anything, and an operating system crash or power
cut can then corrupt the database, not just lose the last few commits.

## Where it gets tricky

**Having a WAL doesn't mean your writes are durable.** RocksDB is the
clearest case: it has a WAL, and by default it doesn't fsync it. Check
the setting in whatever engine you use.

**The log is only as honest as the drive.** Drives that report a write
as done while it's still in a volatile cache can defeat the whole
scheme. [[fsync]] covers where drives and filesystems lie.

**The log grows forever unless something cuts it.** After a crash,
replaying a huge log from the very beginning takes a long time.
[[checkpoints]] flush the dirty pages every so often, so recovery only
has to replay the log written since.

**A torn page needs more than row changes.** A crash can leave a data
page half old and half new ([[torn-writes]]). Postgres handles this by
saving the whole page in the WAL the first time it changes after a
checkpoint, so replay can restore it before applying later records.
That trick, and InnoDB's answer to the same problem, is
[[full-page-writes]].

**The log is useful for more than crashes.** Restore an old physical
backup and replay archived WAL up to a chosen moment, and you have
point-in-time recovery ([[backups]]). Read the log as a stream of
changes and you can keep another copy of the data up to date, which is
the idea behind replicas ([[leader-follower-replication]],
[[logical-replication]]) and [[change-data-capture]].

## What this means when you build

- Don't reply "saved" until the fsync covering the commit record
  returns, unless you've chosen, per write, to risk losing it.
- Give every record an increasing LSN and store the last one on every
  page. It's the cheapest way to enforce "log before data" and to make
  replay safe to repeat.
- Put a length and a checksum on every record, so recovery can find
  where the good log ends.
- Know your engine's default: Postgres syncs at commit by default,
  RocksDB doesn't.
- If you can, put the log on a different disk from the data files, as
  Postgres recommends.
- Next, [[lsm-tree]] builds a whole [[storage-engine]] around this log.

## Further reading

- [Write-Ahead Logging (WAL)](https://www.postgresql.org/docs/current/wal-intro.html), PostgreSQL Global Development Group, PostgreSQL 18. The rule in one paragraph, and why flushing only the log is cheaper.
- [WAL Internals](https://www.postgresql.org/docs/current/wal-internals.html), PostgreSQL Global Development Group, PostgreSQL 18. LSNs as byte offsets, segment files, and where recovery starts.
- [Asynchronous Commit](https://www.postgresql.org/docs/current/wal-async-commit.html), PostgreSQL Global Development Group, PostgreSQL 18. What you risk by replying before the flush, and how that differs from `fsync = off`.
- [ARIES](https://web.stanford.edu/class/cs345d-01/rl/aries.pdf), C. Mohan and others, IBM, 1992. The paper behind the WAL protocol, page LSNs, and steal/no-force. Long; sections 1 and 3 are enough to start.
- [Lecture #20: Database Logging](https://15445.courses.cs.cmu.edu/fall2024/notes/20-logging.pdf), Andy Pavlo, CMU 15-445, 2024. Clear notes on steal/force, shadow paging vs WAL, what a record holds, and physical vs logical logging.
- [WAL Performance](https://github.com/facebook/rocksdb/wiki/WAL-Performance), RocksDB team. Sync vs non-sync WAL writes, group commit, and the I/O each synced write costs.

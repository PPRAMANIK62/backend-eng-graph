---
id: crash-recovery
title: Crash recovery
depth: deep
phase: 7
note: >-
  Rebuilding a consistent state from the log after a crash: redo, undo,
  and the ideas behind ARIES.
needs: [write-ahead-log, checkpoints, buffer-pool, full-page-writes]
leads_to: []
compare_with: []
---

# Crash recovery

When a database restarts after a crash, its data files are in a state
nobody chose: some committed changes are missing, some uncommitted ones
are there. Crash recovery reads the log and puts things right, so that
every committed [[transaction]] is in the data and nothing else is. The
classic design is ARIES, from an IBM paper published in 1992, and
knowing it tells you why restarts take the time they take.

## What a crash leaves behind

A [[write-ahead-log]] database runs under two freedoms. Pages with
uncommitted changes may be written to disk at any time ("steal"), and a
transaction may commit without its pages being written ("no-force").
Both are good for speed, and both leave a mess after a crash.

Picture three transactions at the moment the power goes:

- **T1 committed**, but its changed pages were still dirty in the
  [[buffer-pool]]. The log has T1's changes; the data files don't.
  Recovery has to **redo** them.
- **T2 was still running**, and one of its changed pages had already
  been written to disk. The data files hold a change that was never
  committed. Recovery has to **undo** it.
- **T3 committed**, and its pages had been written. Nothing to do,
  but recovery has to be able to tell.

Recovery works only from what's on disk: the log up to the last flush,
and the data files. The transactions still running at the crash are
called **losers**; they'll be rolled back.

## Where to start reading

Reading the whole log would take too long, so recovery starts from the
last [[checkpoints|checkpoint]]. A small record in a fixed place on disk
points at it: ARIES calls it the master record; Postgres keeps it in a
file called `pg_control`, which is smaller than one disk page so it
can't be torn.

In ARIES the checkpoint is fuzzy: transactions kept running while it was
taken, and it recorded two tables:

- the **transaction table**: which transactions were active, and the
  LSN of each one's last log record;
- the **dirty page table**: which pages were dirty in memory, and for
  each, the LSN of the record that first dirtied it (its recLSN).

Those tables are out of date by the time of the crash. Recovery's first
job is to bring them up to date.

## Three passes over the log

ARIES recovery makes three passes.

![A log drawn left to right from the oldest record of a loser transaction, through the smallest recLSN, the start of the last checkpoint, to the crash. Analysis scans forward from the checkpoint to the crash. Redo scans forward from the smallest recLSN to the crash. Undo scans backward from the crash to the oldest record of any loser.](img/crash-recovery-passes.svg)

*The three passes of ARIES recovery. Adapted from Andy Pavlo, "Lecture #21: Database Crash Recovery" (CMU 15-445, 2024), figure 4.*

**1. Analysis.** Read forward from the checkpoint to the end of the log.
Every transaction that shows up gets added to the transaction table;
one that finished gets taken off. Every page that gets updated goes
into the dirty page table if it isn't there yet. At the end you know
the losers, and the smallest recLSN tells you the oldest change that
might be missing from disk.

**2. Redo.** Read forward from that smallest recLSN and reapply every
logged change, for every transaction, losers included. A change is
skipped if its page isn't in the dirty page table, if its LSN is below
that page's recLSN, or if the page on disk already carries an LSN at or
past the record's. That last check is why each page stores the LSN of
its latest change: it answers "is this already here?". Redo writes no
new log records.

At the end of redo, the database is back exactly where it was the
instant before the crash, half-finished losers and all. ARIES calls
this **repeating history**.

**3. Undo.** Roll back the losers, walking the log backward: at each
step, take the loser whose next record to undo has the highest LSN.
For every change undone, write a **compensation log record** (CLR)
saying what was undone and which record to undo next. When the last
loser is rolled back, flush the log, and the database is open for work.

## Why redo the losers' changes too

It looks wasteful to redo a change you're about to undo. Why not redo
only committed work?

Because pages are shared. Say loser T2 changes a row on page P (LSN
20), then committed T1 changes another row on P (LSN 30). If recovery
redoes only T1's change, P's LSN becomes 30. Now undo comes to T2's
change at LSN 20 and has no way to know whether it's on the page: the
page LSN says 30, which is past 20, but the change at 20 was never
redone. Once history isn't repeated, the page LSN no longer tells the
truth about the page. Earlier systems like IBM's System R redid only
committed work and got away with it because they used shadow pages; the
ARIES paper shows that approach breaks with a write-ahead log and
row-level locking.

Repeating history makes the rule simple: after redo, every page is in
its real pre-crash state, and undo is just an ordinary rollback of the
losers.

## Crashing during recovery

Recovery can itself be interrupted by another crash. That's fine:

- Analysis and redo change nothing permanent that can't be done again.
  Redo checks page LSNs, so running it twice applies each change once.
- Undo writes a CLR for every step, and CLRs are never undone. Each
  CLR points at the next record still to undo, so a second recovery
  picks up where the first stopped instead of undoing things twice.
  That keeps the amount of logging bounded even if you crash over and
  over.

So the answer to "what if it crashes while recovering?" is: run
recovery again.

## How real engines do it

**Postgres** reads `pg_control`, then the checkpoint record, then
redoes forward from the point that record names. Because the first
change to every page after a checkpoint was logged as a whole page
([[full-page-writes]]), every page changed since the checkpoint comes
back consistent, even one that was torn.

**InnoDB** (MySQL 8.4) applies its redo log while starting up, before
it accepts any connections. Then it opens for business and rolls back
the losers in a background [[thread]], alongside new transactions. New
connections can hit lock conflicts with the transactions still being
rolled back, and depending on load, rolling back an incomplete
transaction can take three or four times as long as it had been
running.

**[[sqlite|SQLite]]** in rollback-journal mode needs only undo. Before
changing the database file, it copies the original pages into a journal
and flushes it. It then writes and flushes the database file itself,
and deletes the journal, which is the moment of commit. After a crash, a
leftover journal means a commit didn't finish, so SQLite copies the
original pages back.

**RocksDB** writes every update to an in-memory table (the memtable of
an [[lsm-tree]]) and to its WAL. Recovery replays the WAL to rebuild the
in-memory table. A WAL file is deleted only once everything in it has
been flushed to sorted files on disk, so the log recovery needs is
always there.

## Where it gets tricky

**Restart time follows the checkpoints.** Redo has to replay
everything since the oldest change that might not be on disk. Rare
checkpoints mean more log to replay and a longer restart; see
[[checkpoints]].

**Open before undo finishes, or not.** InnoDB lets new work in while
losers are still being rolled back, which cuts downtime but means early
queries can block on locks the dead transactions held. A
[[long-running-transactions|long-running transaction]] that was killed
by the crash can keep that going for a while.

**The log itself can be damaged.** The crash may have torn the last
records of the log. Telling a torn tail from real corruption in the
middle is its own problem; [[append-only-log]] covers it, including
RocksDB's four ways to handle a bad record.

**Crash recovery isn't disaster recovery.** Everything here assumes the
log and data files survived. If a disk is gone or corrupt, that's
[[disaster-recovery]]: you need a backup plus the log written since
([[backups]]).

## What this means when you build

- Store the LSN of the latest change on every page. Redo becomes safe
  to repeat, and you can always tell whether a change is on disk.
- Keep recovery idempotent: a crash during recovery should mean "run
  it again", nothing more.
- If your design never writes uncommitted data to its main files
  (no steal), recovery never has to undo anything. If it never commits
  without flushing its pages (force), it never has to redo committed
  work, which is why SQLite's journal is undo only.
- Test recovery by crashing on purpose, over and over; that's what
  [[crash-testing]] is for.

## Further reading

- [ARIES](https://web.stanford.edu/class/cs345d-01/rl/aries.pdf), C. Mohan and others, IBM, 1992. The original: steal/no-force, fuzzy checkpoints, the three passes, CLRs, and section 10 on why history must be repeated.
- [Lecture #21: Database Crash Recovery](https://15445.courses.cs.cmu.edu/fall2024/notes/21-recovery.pdf), Andy Pavlo, CMU 15-445, 2024. The clearest walk-through of ARIES, with the LSNs each part keeps.
- [WAL Internals](https://www.postgresql.org/docs/current/wal-internals.html), PostgreSQL Global Development Group, PostgreSQL 18. Where Postgres recovery starts and why full page images make torn pages safe.
- [InnoDB Recovery](https://dev.mysql.com/doc/refman/8.4/en/innodb-recovery.html), Oracle, MySQL 8.4. InnoDB's steps: redo before connections, rollback in the background.
- [Atomic Commit In SQLite](https://www.sqlite.org/atomiccommit.html), SQLite developers. An undo-only design step by step: the rollback journal and hot journals.
- [Write Ahead Log (WAL)](https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log-%28WAL%29), RocksDB team. How an LSM engine uses its WAL to rebuild the memtable, and when WAL files can go.

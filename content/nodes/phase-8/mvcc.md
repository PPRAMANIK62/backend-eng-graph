---
id: mvcc
title: MVCC
depth: deep
phase: 8
note: >-
  Keep several versions of each row so readers don't block writers.
  Where the old versions live: in the table or in an undo log.
needs: [isolation-levels, heap-files]
leads_to: [snapshot-isolation, vacuum, distributed-transactions, hot-updates]
compare_with: [two-phase-locking, open-table-formats]
---

# MVCC

Multiversion concurrency control (MVCC) means a database keeps more than
one version of each row. A write makes a new version instead of
overwriting the old one, and each reader is shown the version that fits
the moment its snapshot was taken. The payoff is that readers and
writers stop waiting for each other. The cost is that old versions pile
up and something has to clean them away. Postgres, MySQL's InnoDB and
Oracle all work this way, but they store the old versions in very
different places, and that choice shapes how each one behaves under
load.

## One row, two versions

Take an `accounts` table in Postgres and a row with `id = 7` and
`balance = 100`. The row was inserted by transaction 100.

Transaction 105 runs `UPDATE accounts SET balance = 70 WHERE id = 7`.
Postgres doesn't touch the bytes of the old row. It writes a whole new
row somewhere in the table, with `balance = 70`, and marks the old one
as replaced. Every row in a Postgres table carries a small header with
two transaction IDs:

- `xmin`, the transaction that created this version (100 for the old
  row, 105 for the new one).
- `xmax`, the transaction that deleted or replaced it (105 on the old
  row, empty on the new one).

The header also holds `t_ctid`, which points from the old version to the
newer one. An update is, for most purposes, a delete plus an insert.

Now a report that started before 105 committed reads `id = 7`. Its
snapshot is, in effect, a list of which transactions count as committed
for it. Transaction 100 is in that list and 105 isn't. So the old row
(created by 100, deleted by a transaction it can't see) is visible, and
the new row (created by a transaction it can't see) is not. The report
gets 100. A transaction that starts after 105 commits gets 70. Nobody
waited for anybody.

That's the whole trick. Each version says who made it and who ended it,
and each reader decides what it can see by checking those two numbers
against its snapshot.

## Why you'd want it

In a database that keeps one version per row, a reader has to stop a
writer from changing a row under it, usually with a shared lock that
the writer's exclusive lock has to wait for. That's how
[[two-phase-locking]] works. A long report can hold up every update to
the rows it touched.

With MVCC, a plain read takes no lock that conflicts with a write.
Reading never blocks writing, and writing never blocks reading. Postgres
keeps that promise even at its strictest level, Serializable. The
report sees a stable picture of the data, and updates keep flowing.

Two writers to the same row still conflict. If transaction 106 tries to
update `id = 7` while 105 hasn't committed yet, 106 waits for 105's
row write lock. What happens after that depends on the
[[isolation-levels|isolation level]] ([[snapshot-isolation]] covers the
Repeatable Read case). MVCC removes read-write waiting, not write-write
waiting.

The snapshot itself is where isolation levels come from. At Read
Committed, Postgres takes a new snapshot for every statement. At
Repeatable Read, it takes one and keeps it for the whole
transaction. That one-snapshot-per-transaction rule is
[[snapshot-isolation]].

## Where the old versions live

Every MVCC database has to answer three questions: where to store the
new version, how a reader finds the version it should see, and when to
throw old versions away. The first answer drives the other two, and the
big databases answered it differently.

![Two panels. Left, Postgres: an index on id has two entries for id 7, pointing at item 1 (balance 100, xmin 100, xmax 105, shaded as old) and item 2 (balance 70, xmin 105, xmax 0, live) in the same heap page, with a t_ctid arrow from the old item to the new one. Right, InnoDB: a secondary index maps an email to id 7; the clustered index row holds balance 70, DB_TRX_ID 105 and a DB_ROLL_PTR that points down to an undo record holding balance 100.](img/mvcc-version-storage.svg)

*The same update in two storage designs. Adapted from Wu, Arulraj, Lin, Xian and Pavlo, "An Empirical Evaluation of In-Memory Multi-Version Concurrency Control", figure 3 (PVLDB, 2017).*

**Postgres: every version in the table.** New versions go into the
table's own pages ([[heap-files|the heap]]) next to the old ones. The
chain runs from oldest to newest, through `t_ctid`. Because a reader
that landed on the oldest version would have to walk the chain forward,
Postgres gives each version its own index entry instead. That's why an
update in Postgres normally adds an entry to every index on the table,
even indexes on columns that didn't change. With a dozen indexes, one
changed column means a dozen index writes, and each goes to the
[[write-ahead-log]] and to replicas too. This write amplification was
central to Uber's move from Postgres to MySQL in 2016.

Postgres softens this with [[hot-updates|heap-only tuples (HOT)]]. If no indexed column
changed, and the new version fits on the same page as the old one, the
update adds no index entries: the index keeps pointing at the old slot,
and a reader follows the chain on that one page.

**InnoDB and Oracle: newest in place, old values elsewhere.** InnoDB
stores each row in the table's clustered index (see [[heap-files]]) and
updates it in place. Before it does, it writes the old column values to
an undo log in a rollback segment. Each row has a 6-byte `DB_TRX_ID`
(the last transaction to write it) and a 7-byte `DB_ROLL_PTR` pointing
at its undo record. A reader whose snapshot is too old for the current
row follows the pointer and rebuilds the version it should see. The
chain runs newest to oldest, so the common case, reading the latest
version, is one step. An undo record holds only what changed, and it's
usually smaller than the row. Secondary indexes point at the primary
key rather than a physical address, so they only change when their own
column changes.

The research literature calls these designs append-only storage and
delta storage. A third, time-travel storage, keeps old versions in a
separate table while the main table holds the current one. None of them
wins everywhere. Delta storage is cheap for updates that touch a few
columns and costly for reads of old versions, which have to be rebuilt.
Append-only keeps versions together, which suits big scans, but copies
the whole row on every update.

## Cleaning up

Old versions are only useful while some snapshot might still need them.
A version is garbage once it was made by a transaction that aborted, or
no running transaction can see it any more. Without cleanup the table
grows forever and readers wade through dead versions.

In Postgres the dead versions sit in the same pages as live rows, so
they cost space and scan time until [[vacuum]] removes them. In InnoDB
the dead data is in the undo log, and a background purge discards it;
deleted rows are only marked and are physically removed by the same
purge. Either way the rule is the same: the cleaner can't remove
anything that the oldest open snapshot might still read. That's why a
single forgotten transaction can make a whole database bloat, the
subject of [[long-running-transactions]].

## Where it gets tricky

**"MVCC" doesn't name an isolation level.** It's a storage and
visibility mechanism. Postgres builds Read Committed, Repeatable Read
and Serializable on it; the difference is how often the snapshot is
taken and what extra checks run at commit. Saying a database "uses
MVCC" tells you readers don't block writers, not which anomalies you're
protected from.

**Readers don't block writers, but writers still block writers.** Two
updates to one row queue up, same as with locks. `SELECT ... FOR UPDATE`
takes the same kind of row lock a write does (see [[explicit-locking]]).

**Postgres's design is argued about.** Critics, Andy Pavlo among them,
call whole-row copies plus vacuum the worst MVCC design of the big
relational databases: more bloat, an index write per update, and a
cleanup process that needs tuning. An attempt to add delta storage to
Postgres (EnterpriseDB's zheap, started in 2013) stalled. Delta storage
has its own failure mode, though: InnoDB's undo log can grow until it
fills its tablespace when a transaction stays open.

**Descriptions disagree on the chain direction.** Uber's 2016 post
described Postgres's version chain as newest to oldest; Pavlo points out
that each version points to the newer one, so it's oldest to newest. The
Postgres page layout docs agree with Pavlo: `t_ctid` holds the location
of the row itself or of a newer version.

**The history is fuzzier than it looks.** MVCC goes back to a late
1970s MIT dissertation by David Reed (dated 1978 in one source, 1979 in
another). Postgres was designed around multiple versions from the 1980s,
and its early versions kept every old version for time-travel queries,
but its concurrency control was lock-based until MVCC replaced it in
1999.

## What this means when you build

- Updates in Postgres are copies. Frequent updates to wide rows, or to
  tables with many indexes, cost far more than the SQL suggests. Keep
  hot, frequently updated columns out of indexes where you can, so
  updates stay HOT.
- Readers and writers don't block each other, so long reports are safe
  for write latency. They are not safe for cleanup: every open snapshot
  pins old versions.
- Keep transactions short. That's the single rule that keeps both
  vacuum and purge healthy.
- Don't read "uses MVCC" as a promise about anomalies. Check the
  isolation level.

## Further reading

- [66.6 Database Page Layout](https://www.postgresql.org/docs/current/storage-page-layout.html), PostgreSQL 18 documentation. The row header with `t_xmin`, `t_xmax` and `t_ctid`.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner, 2012. Section 5.1 is a compact explanation of Postgres snapshots and row visibility, and when MVCC arrived.
- [An Empirical Evaluation of In-Memory Multi-Version Concurrency Control](https://www.vldb.org/pvldb/vol10/p781-Wu.pdf), Yingjun Wu, Joy Arulraj, Jiexi Lin, Ran Xian and Andrew Pavlo, 2017. The design space: version storage, chain order, garbage collection, index pointers, and which systems chose what.
- [InnoDB Multi-Versioning](https://dev.mysql.com/doc/refman/8.4/en/innodb-multi-versioning.html), MySQL 8.4 Reference Manual. The hidden row fields, undo logs, purge, and secondary indexes.
- [The Part of PostgreSQL We Hate the Most](https://www.cs.cmu.edu/~pavlo/blog/2023/04/the-part-of-postgresql-we-hate-the-most.html), Andy Pavlo and Bohan Zhang, 2023. The case against Postgres's design, with the version chain and index costs drawn out.
- [Why Uber Engineering Switched from Postgres to MySQL](https://www.uber.com/blog/postgres-to-mysql-migration/), Evan Klitzke, 2016. Write amplification from index updates, seen in production (on Postgres 9.2).

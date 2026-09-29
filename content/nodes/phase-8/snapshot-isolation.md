---
id: snapshot-isolation
title: Snapshot isolation
depth: deep
phase: 8
note: >-
  Every transaction reads from one consistent snapshot, and the first
  committer wins a write conflict. Postgres calls it REPEATABLE READ.
  What it prevents and what it lets through.
needs: [mvcc, isolation-levels]
leads_to: [serializable-snapshot-isolation]
compare_with: []
---

# Snapshot isolation

Under snapshot isolation, every transaction reads from one frozen,
consistent picture of the database, taken when it starts, and a
transaction that tries to overwrite a row someone else changed in the
meantime is rolled back. It stops most of the classic anomalies without
making readers wait, which is why it's the level many databases really
give you, under names like REPEATABLE READ or even SERIALIZABLE. It is
not serializable, though, and the gap it leaves has a name: write skew.

## One snapshot for the whole transaction

Snapshot isolation (SI) was first written down in 1995 as a critique of
the SQL standard's isolation levels. The definition is short. When a
transaction starts, it gets a start timestamp. Every read it makes sees
the committed data as of that timestamp, plus its own writes. Anything
another transaction commits later is invisible to it, however long it
runs.

This is what [[mvcc]] was built for. The database already keeps old row
versions, so "show me the data as of timestamp 1000" means picking, for
each row, the newest version committed before 1000. A reader never
waits for a writer; it just reads an older version.

In Postgres, SI is the REPEATABLE READ level. One detail differs from
the textbook: the snapshot is taken at the first real statement in the
transaction, not at `BEGIN`. So a transaction that starts, waits, then
runs its first `SELECT` sees data as of that `SELECT`.

Take a bank row `id = 7` with `balance = 100`:

![Timeline with three columns. T1 at repeatable read runs SELECT balance and takes its snapshot, seeing 100. T2 then runs UPDATE balance = 70, which creates a new version 70 while 100 becomes an old version, and commits. T1 runs SELECT balance again and still sees the old 100. T1 then runs UPDATE balance - 10 on a row changed since its snapshot and gets ERROR: could not serialize access, so it rolls back and the app retries.](img/snapshot-isolation-timeline.svg)

*One row, two transactions, under Postgres's REPEATABLE READ.*

T1's two reads agree, even though T2 committed in between. That's the
point of the snapshot: T1 can compute a report, a total or a check
without the ground moving under it.

## First committer wins

Reads are free, but writes can't be. Suppose T1 had gone ahead and
written `balance = 90` based on the 100 it read. T2's change would be
silently lost: a [[lost-update]].

SI forbids that with one rule. When a transaction commits, it gets a
commit timestamp. It may commit only if no other transaction that
committed between its start and its commit wrote any of the same data.
Otherwise it aborts. This rule is called first-committer-wins: of two
concurrent transactions that wrote the same row, the first to commit
keeps its write and the other is rolled back.

Postgres enforces the rule earlier, at the moment of the write. When
T1's `UPDATE` reaches a row that another transaction has changed:

- If that transaction is still running, T1 waits for it to finish.
- If it rolls back, T1 carries on with the row as it found it.
- If it commits, T1 gets `ERROR: could not serialize access due to
  concurrent update`, and the whole transaction is rolled back.

The fix for that error is always the same: retry the whole transaction
from the top. The second time, its snapshot includes T2's change, so
it starts from 70. Read-only transactions never get this error, because
they never write.

## What it prevents

Compare it with the [[isolation-levels]] you'd get from locking or
from READ COMMITTED:

- **[[dirty-read|Dirty reads]]:** impossible. The snapshot only holds
  committed data.
- **[[non-repeatable-read|Non-repeatable reads]] and read skew:**
  impossible. Every read in the transaction uses the same snapshot, so
  reading two related rows at different moments can't mix old and new.
- **[[phantom-read|Phantoms]], in the narrow sense:** a query run twice
  returns the same rows, because rows inserted after the snapshot are
  invisible.
- **Lost updates:** stopped by first-committer-wins.

That makes SI stronger than READ COMMITTED on every count, and it does
all of this without any read locks.

## What it lets through

SI checks only for two transactions writing the *same* data. It never
checks what a transaction read. So two transactions can each read the
same rows, make a decision, and write *different* rows, and both
commit. If the decisions depended on each other, the result can be one
that no serial order would produce.

The standard example: a hospital needs at least one doctor on call.
Alice and Bob are both on call, and each asks to go off at the same
moment. Each transaction counts the doctors on call, sees two, and
takes its own doctor off. The writes touch different rows, so
first-committer-wins has nothing to catch. Both commit, and nobody is on
call. This is [[write-skew]], and it's the anomaly that separates SI
from [[serializability]].

It also comes in a predicate form. A rule says a set of tasks can't
total more than 8 hours. Two transactions each sum the tasks, see 7,
and each insert a new 1-hour task. They insert different rows, so again
nothing conflicts, and the total is now 9.

There's a stranger one: an anomaly that needs a read-only transaction to
show itself. A batch-processing app has a control row with the current
batch number, and a report for the closed batch. With the wrong
interleaving, the report can show a batch as closed and totalled, and a
receipt for that batch can still commit afterwards. Each transaction
alone did the right thing.

## Where it gets tricky

**The names lie.** Postgres calls SI REPEATABLE READ. Before Postgres
9.1, asking for SERIALIZABLE also gave you SI. Oracle's SERIALIZABLE is
SI as well. SQL Server offers it as a separate level named SNAPSHOT.
Hermitage, a test suite that runs the same anomaly scripts against many
databases, is the easiest way to see what each name really means.

**MySQL's REPEATABLE READ is not quite SI.** InnoDB's plain `SELECT`
reads a snapshot, but `UPDATE` and `DELETE` act on the latest committed
rows, not the snapshot. So there's no first-committer-wins check: two
read-modify-write transactions can both succeed, and one update is
lost. Hermitage lists InnoDB's default level as not preventing lost
updates, where Postgres's REPEATABLE READ does.

**SI and locking REPEATABLE READ are not ranked.** A locking
implementation of REPEATABLE READ allows phantoms but not write skew. SI
allows write skew but not (narrow) phantoms. Neither is stronger. People
often assume that ruling out the three anomalies in the SQL standard
makes a level serializable; SI is the counterexample.

**Definitions vary.** Papers disagree on how strict SI is, for example
whether a new transaction must see everything that committed before it
started in real time. Under the looser definitions, a transaction may
not see a write your app already got an OK for, or even the app's own
write from a previous transaction.

**Long writers lose.** A long transaction that updates rows busy short
transactions also update is unlikely to be first to commit on all of
them, so it keeps getting rolled back. Long transactions also hold back
cleanup of old versions (see [[long-running-transactions]]).

## What this means when you build

- Use SI (Postgres REPEATABLE READ) when a transaction reads several
  things and needs them consistent: reports, exports, multi-step checks.
- Always handle serialization failures (SQLSTATE `40001`) by retrying
  the whole transaction from the beginning, including the logic that
  decided what to write.
- If a transaction checks a rule across rows and then writes, SI won't
  protect the rule. Use [[serializable-snapshot-isolation]], a real
  [[constraints|constraint]] (unique, foreign key, exclusion), or
  [[explicit-locking|explicit locks]] on the rows the rule depends on.
- On MySQL, don't assume REPEATABLE READ stops lost updates. Read rows
  you're about to update with a locking read (`SELECT ... FOR UPDATE`);
  [[lost-update]] covers the other fixes.
- Check what your database's level names mean before you rely on them.

## Further reading

- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Hal Berenson, Phil Bernstein, Jim Gray, Jim Melton, Elizabeth O'Neil and Patrick O'Neil, 1995. Where SI is defined, with first-committer-wins, write skew and the 8-hour example.
- [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 documentation. How REPEATABLE READ takes its snapshot and handles concurrent updates.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner, 2012. Section 2: the doctors example, the read-only batch anomaly, and why SI isn't enough.
- [Snapshot Isolation](https://jepsen.io/consistency/models/snapshot-isolation), Jepsen. What SI allows, and why papers define it differently.
- [Hermitage](https://github.com/ept/hermitage), Martin Kleppmann and contributors. What each database's "repeatable read" and "serializable" actually prevent.
- [Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html), MySQL 8.4 Reference Manual. Why InnoDB's writes don't use the snapshot.

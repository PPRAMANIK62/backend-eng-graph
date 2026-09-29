---
id: serializable-snapshot-isolation
title: Serializable snapshot isolation
depth: deep
phase: 8
note: >-
  Snapshot isolation plus tracking dangerous read-write patterns.
  Postgres's SERIALIZABLE.
needs: [snapshot-isolation, write-skew, predicate-locks, serializability]
leads_to: []
compare_with: [two-phase-locking]
---

# Serializable snapshot isolation

Serializable snapshot isolation (SSI) runs every transaction under
[[snapshot-isolation]], and on top of that watches which transaction
read data that another one changed. When those read-write dependencies
line up in a pattern that could make the result impossible in any
one-at-a-time order, it rolls one transaction back. You get true
serializability while readers still never block writers. It's what
Postgres gives you when you ask for SERIALIZABLE, since version 9.1.

## The hole in snapshot isolation

Snapshot isolation stops two transactions from writing the same row. It
never looks at what they read. That's the opening for [[write-skew]]:
Alice and Bob are the only doctors on call, both ask to go off at once,
each transaction sees two doctors on call, and each takes its own doctor
off. They wrote different rows, so nothing conflicts, and both commit.

Before SSI, the fixes were all manual: lock the rows the rule depends on
with `SELECT ... FOR UPDATE`, invent a dummy row that every such
transaction must update so they collide, or turn the rule into a real
[[constraints|constraint]]. Each fix needs someone to find the dangerous pair of
transactions first, and that means checking every transaction against
every other one it might run beside. With hundreds of tables, many
developers and ORM-generated queries, nobody keeps that analysis up to
date. SSI does it at runtime instead.

## Reading the conflicts as a graph

Any run of transactions can be drawn as a dependency graph (see
[[serializability]]). There's one node per transaction, and an edge
from A to B when A has to come before B in any equivalent serial order.
There are three kinds of edge:

- **wr:** B read a version A wrote. A committed before B started.
- **ww:** B overwrote a version A wrote. Under SI, again A committed
  before B started.
- **rw:** A read a version that B later replaced. A didn't see B's
  change, so A must come first. This is the only kind that can link two
  transactions running at the same time.

If the graph has a cycle, no serial order fits, and something went
wrong. In the doctors example, T1 read Bob's row before T2 changed it,
and T2 read Alice's row before T1 changed it. That's an rw edge each way:
a cycle.

![Two panels. Left: T1 (Alice goes off) and T2 (Bob goes off) with an rw edge from T1 to T2 and another from T2 to T1, forming a cycle; no serial order fits. Right: Tin with an rw edge to Tpivot, marked rolled back, which has an rw edge to Tout, marked commits first; a dashed arrow from Tout back to Tin shows that any path back would close a cycle. SSI doesn't look for the path back, so some aborts are false positives.](img/serializable-snapshot-isolation-dangerous-structure.svg)

*The write-skew cycle, and the pattern SSI actually checks. Adapted from Ports and Grittner, "Serializable Snapshot Isolation in PostgreSQL", figure 3 (2012), and the diagram in Postgres's README-SSI.*

Testing a big graph for cycles all the time is expensive. SSI rests on a
result about snapshot isolation in particular: every cycle it allows
contains two rw edges in a row, T_in → T_pivot → T_out, between
transactions that overlapped in time, and T_out is the first transaction
in the cycle to commit. So SSI doesn't build the whole graph. It only
tracks rw edges, and when some transaction has one coming in and one
going out, it treats that "dangerous structure" as a possible cycle and
aborts something.

That shortcut can abort transactions that were fine, because not every
dangerous structure has a path back that closes a cycle. The designers
accepted those false positives to keep the tracking small.

## How Postgres spots the rw edges

An rw edge means one transaction read something another one wrote,
while both were running. Postgres catches it from either end.

**The write happened first.** When a transaction reads a row, it
already checks the row's `xmin` and `xmax` against its snapshot (that's
[[mvcc]] visibility). If it skips a version because the writer hadn't
committed when the snapshot was taken, that's an rw edge from reader to
writer, found with no locks at all.

**The read happened first.** Then the writer has to learn that somebody
read the old data. For this, serializable transactions take SIREAD
locks on what they read. These aren't locks in the usual sense: they
never block anything and can't cause a deadlock. They're markers. When a
transaction writes a row, Postgres checks for SIREAD locks on it, and
each one it finds is an rw edge.

SIREAD locks have to cover rows that don't exist yet, or a concurrent
insert that should have shown up in someone's query would slip through.
That's the job of [[predicate-locks]], and Postgres approximates them
with locks on what the query physically touched:

- each tuple a query read,
- the B-tree leaf pages an index scan covered, which also locks the gaps
  where new keys could go,
- the whole table, for a sequential scan.

Many fine locks get promoted to one coarser lock (tuples to a page, pages
to a table) when the lock table runs short of memory. You can see them
in `pg_locks` with mode `SIReadLock`. And because an rw edge can still
form after the reader commits, SIREAD locks stay until every transaction
that overlapped it has finished.

## Choosing who to roll back

When a dangerous structure appears, Postgres doesn't abort anything
until T_out commits. If T_in or T_pivot commits before T_out, there's no
cycle, and nothing needs to die. Once it must act, it rolls back T_pivot
if it can. The goal is a safe retry: the transaction it kills should
succeed if you run it again straight away. T_pivot overlapped T_out,
which has now committed, so when it retries it starts after T_out, sees
its writes, and can't form the same edge again.

The loser gets `ERROR: could not serialize access due to read/write
dependencies among transactions`, with SQLSTATE `40001`, the same code
as any serialization failure. Your code retries the whole transaction.

Read-only transactions get special help. A read-only T_in can only be
part of an anomaly if T_out committed before T_in took its snapshot, so
Postgres ignores structures that don't meet that. If a read-only
transaction starts when no read-write transaction is running, its
snapshot is safe from the start: no SIREAD locks, no chance of abort.
And `BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE` waits
until it can get such a safe snapshot, then runs a long report with no
SSI overhead. That's the one case where Serializable blocks and
Repeatable Read doesn't.

## What it costs

Ports and Grittner measured the first release, PostgreSQL 9.1. Most
tests ran on a 2.83 GHz Core 2 Quad with 8 GB of RAM (the disk-bound
one on a 16-core Xeon), each against Postgres's own REPEATABLE READ:

| Benchmark | SSI compared with snapshot isolation |
|---|---|
| Transaction processing (TPC-C-like, in memory) | about 5% slower, from CPU spent tracking |
| Same, disk-bound, 150 warehouses | no visible difference; failure rate under 0.25% |
| RUBiS auction site (85% read-only) | 422 vs 435 requests/s; failures 0.03% vs 0.004% |
| SIBENCH microbenchmark | 10 to 20% extra CPU for tracking reads |

On RUBiS their two-phase locking build managed 208 requests/s, with
0.76% failures. Their headline was a cost under 7% against snapshot
isolation. Those are one team's numbers on old versions and hardware;
they show the shape (SSI close to SI, well ahead of locking on
read-heavy work), not what your workload will see.

The costs grow with the number of active transactions, since every
SIREAD lock lives until all overlapping transactions finish. A single
long-running transaction can keep the state of thousands of others
alive.

## Where it gets tricky

**It only protects transactions that run at SERIALIZABLE.** A
transaction at REPEATABLE READ or READ COMMITTED doesn't take SIREAD
locks, so it can still take part in an anomaly. If you rely on SSI for a
rule, every transaction that touches that data has to run at
SERIALIZABLE; the simplest way is to make it the default.

**What you read isn't settled until commit.** A serializable
transaction can read something, act on it outside the database, and
then be rolled back. Don't trust data read in a transaction that hasn't
committed yet. `DEFERRABLE` read-only transactions are the exception.

**False positives depend on the plan.** A sequential scan locks the
whole table, so any write to that table becomes an rw edge. Page-level
locks cover more than the rows you asked for. Running short of
predicate-lock memory promotes locks and raises the failure rate. Good
indexes (so the planner picks index scans) and more predicate-lock
memory (`max_pred_locks_per_transaction` and its siblings) mean fewer
pointless retries.

**Sometimes the error is a unique violation.** Two serializable
transactions that each check a key is free and then insert it can end
with one getting a unique-constraint error instead of `40001`. It's
really a serialization failure the server can't label as one.

**Postgres is the odd one out.** Nearly every other database that
offers serializability does it with strict [[two-phase-locking]],
where readers and writers block each other and deadlocks pick the
losers. MySQL's SERIALIZABLE, for example, gives the same guarantees
with a completely different implementation and performance profile.
SSI was new research when Postgres adopted it (Cahill, Röhm and Fekete
published it in 2008), and Postgres 9.1 was its first production
release.

**Index locks are still coarse.** The 2012 paper planned to move B-tree
predicate locks from pages to next-key locks. The PostgreSQL 18 source
still locks B-tree leaf pages.

## What this means when you build

- If your app enforces rules across rows (limits, quotas, "at least
  one"), run those transactions at SERIALIZABLE and retry on `40001`.
  It's simpler and safer than finding every write-skew pair by hand.
- Wrap every serializable transaction in a retry loop that re-runs all
  of it, including the code that decided what to write.
- Declare read-only transactions `READ ONLY`, use `DEFERRABLE` for long
  reports, and keep transactions short.
- Keep the number of active connections modest, with a pool (see
  [[db-connection-pooling]]).
- Once everything runs at SERIALIZABLE, drop the `SELECT ... FOR
  UPDATE` calls that were only there to stop anomalies.

## Further reading

- [Serializable Isolation for Snapshot Databases](https://people.eecs.berkeley.edu/~kubitron/courses/cs262a-F13/handouts/papers/p729-cahill.pdf), Michael Cahill, Uwe Röhm and Alan Fekete, 2008. The paper that introduced SSI: dangerous structures, pivots and SIREAD locks.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan Ports and Kevin Grittner, 2012. How Postgres built it: conflict detection from MVCC data, safe retry, read-only optimizations, memory limits, and benchmarks.
- [README-SSI](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README-SSI), PostgreSQL source. Which reads take which SIREAD locks, per index type, in the current code.
- [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 documentation. The user-facing rules, the error, and the tuning list for Serializable.
- [13.5 Serialization Failure Handling](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html), PostgreSQL 18 documentation. What to retry, and why a unique violation can be a serialization failure in disguise.
- [Hermitage](https://github.com/ept/hermitage), Martin Kleppmann and contributors. Same guarantees, different implementations: Postgres's and MySQL's serializable side by side.

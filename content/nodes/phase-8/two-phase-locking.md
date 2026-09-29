---
id: two-phase-locking
title: Two-phase locking
depth: deep
phase: 8
note: >-
  Take locks as you go and never take one after releasing one. Why that
  gives serializability, and why databases hold locks until commit.
needs: [serializability, latches]
leads_to: [lock-granularity, predicate-locks, deadlock-detection, explicit-locking]
compare_with: [mvcc, optimistic-concurrency, serializable-snapshot-isolation, latches]
---

# Two-phase locking

Two-phase locking (2PL) is the classic way a database makes concurrent
[[transaction|transactions]] behave as if they ran one at a time. Each
transaction takes a lock before it touches a piece of data, and once it
has released any lock, it may never take another. That one rule is
enough to guarantee [[serializability]]. It's what SQL Server and MySQL
do at SERIALIZABLE, and it's the baseline every other scheme, including
Postgres's, gets compared with.

## An audit that sees money vanish

Take two accounts, A and B, each holding 500. Transaction T1 moves 100
from A to B. Transaction T2 is an audit: it reads both balances and
checks that they add up to 1,000.

Give the database locks. A **shared** lock lets you read and can be
held by many transactions at once. An **exclusive** lock lets you write,
and nobody else can hold any lock on that item while you have it. A
central lock manager hands them out and makes a transaction wait when
its request conflicts with a lock someone else holds.

Locks alone don't fix anything. Suppose T1 is polite and releases each
lock as soon as it's done with that account:

![Timeline of two transactions. T1 locks A, writes A = 400, and releases A. T2 then locks and reads A (400) and B (500), gets a total of 900, and releases both. Only after that does T1 lock B and write B = 600. The audit saw 900, a state that never existed between whole transactions. A second timeline shows the same work under two-phase locking: T1 keeps its lock on A until it has locked B, so T2 waits and reads 400 and 600, a total of 1,000.](img/two-phase-locking-audit.svg)

*Releasing early lets the audit slip in between T1's two writes. Holding locks until all of them are taken closes that gap.*

T1 writes A = 400 and unlocks A. Before T1 gets to B, the audit locks A,
reads 400, locks B, reads 500, and reports 900. Then T1 writes B = 600.
Every single read and write was protected by a lock, and the audit still
saw a state that no one-at-a-time order could produce: 100 had left A
and not arrived at B.

The problem is that T1 let go of A and then went on to take a new lock.
Between the two, other transactions could see its half-done work.

## The rule: grow, then shrink

2PL splits each transaction's life in two:

1. **Growing phase.** The transaction takes locks as it needs them. It
   may not release any.
2. **Shrinking phase.** It starts the moment the transaction releases its
   first lock. From then on it may only release locks, never take new
   ones.

The transaction doesn't need to know its queries in advance. It asks for
each lock when it reaches the data, and the lock manager grants it or
makes it wait.

![Two plots of how many locks a transaction holds over time. In basic two-phase locking the count climbs during the growing phase, peaks at the lock point, then falls step by step during the shrinking phase before commit. In strict two-phase locking the count climbs the same way, stays at its peak, and drops to zero all at once at commit or abort.](img/two-phase-locking-phases.svg)

*Basic 2PL may release locks before commit; strict 2PL releases them all at the end.*

In the audit example, T1 under 2PL has to lock B before it releases A.
So the audit's request for A waits until T1 is past both writes, and it
reads 400 and 600.

## Why the rule is enough

The proof goes back to a team at IBM Research: Eswaran, Gray, Lorie
and Traiger showed in 1976 that if every transaction locks what it touches
and is two-phase, every schedule the lock manager allows is equivalent
to some serial one. They also showed the converse: if you run alongside
transactions you don't know about, being two-phase is the only rule
that guarantees it.

Here's an intuition. Call the moment a transaction holds all its locks
its **lock point**. If T1 and T2 conflict on some item, one of them had
to wait for the other to release it. Say T2 waited for T1. T1 released
that lock in its shrinking phase, so T1's lock point came first. Every
conflict points from an earlier lock point to a later one, so the
conflicts can never form a cycle, and the transactions line up in lock
point order. No cycle in the conflict graph is exactly what
[[serializability]] asks for.

## Strict 2PL: hold everything until the end

Basic 2PL still has a hole. If T1 releases its exclusive lock on A
during its shrinking phase and then aborts, another transaction may
already have read A = 400, a value that never committed. That's a
[[dirty-read|dirty read]], and it forces a **cascading abort**: the
reader has to be rolled back too, and anything that read from the
reader.

So real systems use **strict 2PL**: hold locks until the transaction
commits or aborts. (Course notes sometimes call this hold-everything
version "strong strict" or "rigorous" 2PL; the Postgres source and
papers just say strict 2PL, or S2PL.) A transaction that may still abort can't let others see its writes
early anyway, because it might need to undo them.

Strict 2PL has a handy side effect: the order in which transactions
commit is the order they appear to have run in.

## What it costs

**Readers and writers block each other.** Under strict 2PL a read takes
a shared lock and holds it to commit, so a writer that wants that row
waits for every reader to finish, and a reader waits for any writer.
That's the main reason Postgres never implemented SERIALIZABLE with
2PL: its users expect readers not to block writers, which
[[mvcc|multiversion concurrency control]] gives them.

**Deadlocks.** Two transactions that lock the same rows in opposite
orders wait for each other forever (a [[deadlock]]). A 2PL database has
to find the cycle and abort one of them; that's
[[deadlock-detection]].

**Phantoms.** Locking the rows you read doesn't stop someone inserting
a new row that your query would have matched. For full serializability
2PL has to lock the search condition, not just the rows: that's
[[predicate-locks]], usually done by locking ranges of an index.

**Lock bookkeeping.** A transaction that touches a billion rows would
need a billion locks. Databases lock at several sizes at once to keep
that in check ([[lock-granularity]]).

How much does the blocking matter? In the 2012 paper describing
Postgres's serializable mode, Ports and Grittner ran the RUBiS auction
benchmark (85% read-only transactions, with frequent read-write
conflicts). [[snapshot-isolation|Snapshot isolation]] did 435 requests a second, serializable
snapshot isolation 422, and their strict 2PL for Postgres 208. That 2PL
was a simple implementation the authors built for the comparison, not a
tuned commercial one, so read it as the shape of the cost rather than a
verdict.

## Who actually uses it

- **SQL Server** at SERIALIZABLE keeps read and write locks until the
  end of the transaction and takes key-range locks for range queries.
  Below REPEATABLE READ it releases shared locks as soon as each read
  finishes, which is not two-phase.
- **MySQL's InnoDB** has strict 2PL underneath. At SERIALIZABLE it turns
  plain SELECTs into `SELECT ... FOR SHARE` (when autocommit is off), so
  reads take shared locks too, and its next-key locks cover the ranges.
- **Postgres** holds row write locks until commit, but plain reads take
  no read locks; you have to ask with `SELECT FOR UPDATE` or
  `SELECT FOR SHARE`. Its SERIALIZABLE is
  [[serializable-snapshot-isolation]], which watches for dangerous
  patterns instead of blocking.

## Where it gets tricky

**Holding write locks isn't 2PL.** Most databases keep a
row's write lock until commit. That stops two writers from clobbering
the same row, but a transaction that only *reads* a row and decides
based on it takes no lock on it. Two transactions that each read, check
a rule and then write different rows sail past each other: that's
[[write-skew]], and only read locks (or something that tracks reads)
catch it.

**It's not two-phase commit.** Two-phase locking is about concurrency
inside one database. [[two-phase-commit]] is about getting several
machines to agree to commit. Same word, unrelated protocols.

**Locks aren't latches.** Database people use "lock" for the
transaction-level locks in this article, held for a whole transaction
on rows and tables. The short-lived [[mutex|mutexes]] that protect the
database's own memory structures, such as a [[b-plus-tree]] node while
a scan reads it, are called [[latches]]. They're held only for the
moment of the operation, not until commit.

**It rejects some fine schedules.** 2PL is a sufficient rule, not a
necessary one. Some interleavings are serializable but can't happen
under 2PL, because the rule doesn't look at what the transactions
actually do. The 1976 paper already noted that for two known
transactions, being two-phase can be stronger than needed.

**Pessimism has a price, and so does optimism.** 2PL makes transactions
wait in case of a conflict. [[optimistic-concurrency]] lets them run and
restarts them if a conflict happened. Waiting costs throughput when
conflicts are rare; restarting costs throughput when they're common.

## What this means when you build

- Know what your [[isolation-levels|isolation level]] really does. In Postgres at the
  default READ COMMITTED, your reads lock nothing. If a decision depends
  on a row staying the same, lock it with `SELECT ... FOR UPDATE` or
  `FOR SHARE` ([[explicit-locking]]) or use SERIALIZABLE.
- Locks live until commit, so keep transactions short. Never hold one
  open while you wait on a user, a slow API call or a queue.
- Touch rows in a consistent order (by primary key, say) to make
  deadlocks rarer, and retry the transaction when you're picked as a
  deadlock victim.
- At SERIALIZABLE in any database, write your code to retry whole
  transactions. Whether the database blocks (2PL) or aborts (SSI),
  some of them won't commit the first time.

## Further reading

- [The Notions of Consistency and Predicate Locks in a Database System](https://people.csail.mit.edu/tdanford/6830papers/eswaran-notions-of-consistency.pdf), K. P. Eswaran, J. N. Gray, R. A. Lorie, I. L. Traiger, 1976. The original proof that two-phase transactions give consistent schedules, and why phantoms need predicate locks.
- [Lecture #16: Two-Phase Locking](https://15445.courses.cs.cmu.edu/fall2023/notes/16-twophaselocking.pdf), Andy Pavlo and Jignesh Patel, CMU 15-445, 2023. A compact walk through 2PL, strict 2PL, cascading aborts and deadlock handling.
- [README-SSI (PostgreSQL 18 source)](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README-SSI), PostgreSQL Global Development Group. How S2PL works and why Postgres chose SSI instead.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan R. K. Ports and Kevin Grittner, 2012. Why Postgres rejected 2PL, and the RUBiS comparison of SI, SSI and S2PL.
- [Transaction locking and row versioning guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide), Microsoft. How SQL Server holds locks at each isolation level, a real 2PL system.
- [Transaction Isolation Levels (MySQL 8.4)](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html), Oracle. InnoDB's SERIALIZABLE turning plain reads into locking reads.

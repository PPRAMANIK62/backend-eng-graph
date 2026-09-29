---
id: predicate-locks
title: Predicate locks
depth: short
phase: 8
note: >-
  Locking a search condition instead of rows, so new matching rows can't
  slip in. Next-key locks in InnoDB, SIREAD locks in Postgres.
needs: [phantom-read, two-phase-locking]
leads_to: [serializable-snapshot-isolation]
compare_with: [lock-granularity, write-skew]
---

# Predicate locks

A predicate lock locks a search condition, such as "every account in
the Napa branch", instead of the rows that happen to match right now.
That way a new row that would match can't slip in while you're working.
Without it, [[two-phase-locking]] still lets [[phantom-read|phantoms]]
through. Real databases approximate it by locking ranges of an [[indexes|index]]:
next-key locks in InnoDB, and non-blocking SIREAD locks in Postgres.

## Locking rows that don't exist yet

Here's the example from the 1976 IBM paper that introduced the idea.
T1 adds up the balances of all Napa accounts and checks the total
against a Napa row in an `assets` table. T2 opens a new Napa account
and adds its deposit to the Napa assets.

Shared locks on every Napa account T1 reads don't help: T2's new
account didn't exist when T1 took them. If T2 runs between T1's sum and T1's read of
`assets`, T1 sees the deposit in `assets` but not the account behind
it.

T1 needs to lock every account that exists or could exist with
`branch = 'Napa'`. That's a predicate lock: any write to a row matching
the predicate conflicts with it.

## Why databases don't lock predicates directly

Two predicate locks conflict if some row could satisfy both. Deciding
that for arbitrary conditions is undecidable in general. The paper
showed it's manageable if you restrict locks to simple comparisons
joined by AND, OR and NOT, but databases went another way: they lock
the physical things a query touched while it searched, usually ranges
of an index. If a query found its rows by walking an index from one key
to another, locking that stretch of the index, gaps included, blocks
any insert that would land in it.

## Next-key locks in InnoDB

InnoDB locks index records, not rows. A **gap lock** covers the space
between two index records, and a **next-key lock** is a record lock
plus a gap lock on the gap just before that record. For an index
holding 10, 11, 13 and 20, the next-key locks are the intervals
(−∞, 10], (10, 11], (11, 13], (13, 20] and (20, +∞).

![A number line for an index holding 10, 11, 13 and 20, split into next-key intervals: up to 10, 10 to 11, 11 to 13, 13 to 20, and above 20. A locking read of c1 BETWEEN 10 AND 20 FOR UPDATE locks the records 10 to 20 and the gaps between them. An insert of 15, which falls in the gap between 13 and 20, has to wait, even though no row with 15 existed.](img/predicate-locks-next-key.svg)

*A range scan locks the records it passes and the gaps between them, so an insert into the range waits. Adapted from Oracle, "InnoDB Locking" (MySQL 8.4 Reference Manual, 17.7.1).*

A locking read like `SELECT ... WHERE c1 BETWEEN 10 AND 20 FOR UPDATE`
takes next-key locks as it scans, so another transaction can't insert
15, whether or not a 15 was there before. At REPEATABLE READ, the
default, InnoDB does this for searches and index scans, which is how it
prevents phantoms for locking reads. At READ COMMITTED it turns gap
locking off, except for foreign key and duplicate key checks.

Gap locks exist only to stop inserts, so two transactions can hold
them on the same gap. A lookup of one row by a unique index needs no
gap lock at all.

## SIREAD locks in Postgres

Postgres takes predicate locks only at SERIALIZABLE, and they never
block anyone. It calls them SIREAD locks. Each one records what a transaction read:
a tuple, a B-tree leaf page for an index range, or a whole table for a
sequential scan. When another transaction later writes something one of
those locks covers, Postgres notes a read-write conflict, and
[[serializable-snapshot-isolation]] uses those conflicts to decide
whether to abort someone.

To save memory, Postgres promotes many tuple locks into a page lock and
many page locks into a table lock, which means more false conflicts and
more serialization failures. SIREAD locks also have to outlive their transaction's commit
until the transactions that overlapped it have finished.

## Where it gets tricky

**What gets locked depends on the plan, and it's more than the
predicate.** An index range, a leaf page or a table covers rows your
condition wouldn't match, which shows up as extra waiting under locking
or extra aborts under SSI. Without a usable index it's the whole table:
Postgres takes a relation-level SIREAD lock for any sequential scan.

**Gap locks surprise people.** In InnoDB at REPEATABLE READ, a
`SELECT ... FOR UPDATE` over a range blocks inserts of rows nobody has
yet, because the lock covers the gaps the scan walked through.

## What this means when you build

- Postgres's only predicate locks don't block. To protect "check that nothing matches, then insert", use a unique or
  exclusion [[constraints|constraint]], run at SERIALIZABLE, or lock a row that stands
  for the whole set (a parent or dummy row every transaction updates).
- In MySQL, know that locking reads at REPEATABLE READ lock gaps. An
  insert into a range someone else read with `FOR UPDATE` waits until
  that transaction ends.

## Further reading

- [The Notions of Consistency and Predicate Locks in a Database System](https://people.csail.mit.edu/tdanford/6830papers/eswaran-notions-of-consistency.pdf), K. P. Eswaran, J. N. Gray, R. A. Lorie, I. L. Traiger, 1976. The Napa example and the original definition of predicate locks.
- [InnoDB Locking (MySQL 8.4)](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html), Oracle. Record, gap and next-key locks, with the intervals for a sample index.
- [README-SSI (PostgreSQL 18 source)](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/lmgr/README-SSI), PostgreSQL Global Development Group. How SIREAD locks are taken on tuples, index pages and tables, and why coarse locks give false positives.
- [Serializable Snapshot Isolation in PostgreSQL](https://drkp.net/papers/ssi-vldb12.pdf), Dan R. K. Ports and Kevin Grittner, 2012. Index-range locks as the practical form of predicate locks, and ways to protect a rule without SERIALIZABLE.

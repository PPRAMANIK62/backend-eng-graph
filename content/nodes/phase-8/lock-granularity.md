---
id: lock-granularity
title: Lock granularity
depth: short
phase: 8
note: >-
  Row, page and table locks, and intention locks between them.
needs: [two-phase-locking]
leads_to: []
compare_with: [predicate-locks]
---

# Lock granularity

A lock can cover one row, a page of rows, a whole table or the whole
database. Small locks let more transactions work side by side; big ones
are cheaper to keep track of. Databases that use [[two-phase-locking]]
lock at several sizes at once, and use intention locks so that a table
lock and a row lock can find out about each other without checking
every row.

## Small locks or big locks

Picture an `orders` table and two jobs. One updates a single order;
the other rewrites every old order.

With only row locks, the first job takes one lock and gets out of
everyone's way, but the second needs a lock, and a call into the lock
manager, per row. With only table locks, the second job takes one lock,
but the first now blocks everyone who wants any row in `orders`.

Gray, Lorie, Putzolu and Traiger at IBM described this trade-off in
1976, and their answer was to let each transaction pick the size that
fits, all in one system.

## Intention locks tie the sizes together

Mixing sizes raises a problem. T1 holds an exclusive lock on order 7.
T2 asks for a shared lock on the whole `orders` table. Those conflict,
because T2's table lock covers order 7. But to notice, the lock manager
would have to search every row lock under the table.

The fix is to lock the path down to the row. Before T1 locks order 7,
it takes an **intention exclusive** (IX) lock on the table, a tag
saying "I'll lock something in here exclusively". Now T2's
request for S on the table meets T1's IX, and one check at the table
level is enough to see the conflict.

![On the left, a lock hierarchy: database, then the orders table, then pages, then rows. T1 holds IX on the database, IX on the table, IX on page 1 and X on row 7. T2 asks for S on the orders table and is blocked by T1's IX there. On the right, the compatibility matrix for IS, IX, S, SIX and X: IS is compatible with everything but X; IX is compatible with IS and IX; S with IS and S; SIX only with IS; X with nothing.](img/lock-granularity-hierarchy.svg)

*Intention locks on the way down let a table-level request see row locks with one check. Adapted from Gray, Lorie, Putzolu and Traiger, "Granularity of Locks and Degrees of Consistency" (1976), figure 1 and table 1.*

The modes and their rules:

- **IS** (intention shared): I'll take shared locks somewhere below.
- **IX** (intention exclusive): I'll take exclusive (or shared) locks
  below.
- **SIX** (shared plus intention exclusive): I'm reading this whole
  subtree and will update a few things in it.
- Take locks from the top down, intention locks on every ancestor
  first, and release them from the bottom up (or all at commit).

IS and IX never conflict with each other: two transactions with IX on
a table will meet, if at all, at the row level. IX does conflict with a
real S or X lock on the same node, and IS conflicts only with X.

InnoDB works this way: `SELECT ... FOR SHARE` takes IS on the table,
`SELECT ... FOR UPDATE` takes IX, and intention locks block only
whole-table requests like `LOCK TABLES ... WRITE`. SQL Server does the
same across rows, pages and tables.

## Lock escalation

A transaction that touches a lot of rows can swap its many small locks
for one big one. SQL Server does this: when one statement holds at
least 5,000 locks on one table (or lock memory passes a threshold), it
tries to turn its IX on the table into X, or its IS into S, and drop
all the row and page locks. It goes straight from rows to the table,
never to pages. If other transactions' locks are in the way, it keeps
its row locks and tries again after every 1,250 more.

Escalation saves memory (about 100 bytes per lock in SQL Server) but
can make a big job block the table.

Postgres avoids the question for row locks. It doesn't keep them in
the lock manager's memory at all: `SELECT ... FOR UPDATE` marks the
row itself, so there's no limit on how many rows you can lock, but
locking a row can cause a disk write. Its shared lock table holds
table locks and other objects, with room for 64 per server process by
default (`max_locks_per_transaction`). Postgres does escalate in one place: the
non-blocking predicate locks behind SERIALIZABLE get promoted from rows
to pages to the whole table when they pile up (see [[predicate-locks]]).

## Where it gets tricky

**Postgres's "row" lock modes are table locks.** ROW SHARE and ROW
EXCLUSIVE are two of Postgres's eight table-level modes; the names are
historical. They play much the same part as intention locks: every
`UPDATE`, `DELETE` and `INSERT` takes ROW EXCLUSIVE on the table, which
doesn't conflict with other writers but does conflict with SHARE (taken
by `CREATE INDEX`) and ACCESS EXCLUSIVE (many `ALTER TABLE` forms). Those
table-level conflicts are what bite during migrations ([[ddl-locks]]).

**Page locks mean different things.** In SQL Server a page lock is a
transaction lock, held like a row lock. In Postgres, page-level locks
are brief locks on buffers, released as soon as a row is read or
updated.

## What this means when you build

- In SQL Server (and anywhere with escalation), break big updates and
  deletes into batches of a few hundred rows so a cleanup job doesn't
  lock the whole table.
- In Postgres, a bulk `SELECT ... FOR UPDATE` won't escalate, but
  writes to every row it locks.
- The table lock that usually hurts is the strong one DDL takes. Check
  a statement's lock mode before running it on a busy table.

## Further reading

- [Granularity of Locks and Degrees of Consistency in a Shared Data Base](https://web.stanford.edu/class/cs245/readings/granularity-of-locks.pdf), J. N. Gray, R. A. Lorie, G. R. Putzolu, I. L. Traiger, 1976. Where intention locks and the root-to-leaf protocol come from.
- [Transaction locking and row versioning guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide), Microsoft. SQL Server's lock hierarchy, intent locks and escalation thresholds.
- [InnoDB Locking (MySQL 8.4)](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html), Oracle. Intention locks and their compatibility matrix in InnoDB.
- [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html), PostgreSQL 18 docs. The eight table-level modes, row locks stored on the rows, and page locks.
- [Lock Management settings](https://www.postgresql.org/docs/current/runtime-config-locks.html), PostgreSQL 18 docs. How many locks the lock table holds, and when predicate locks get promoted.

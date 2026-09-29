---
id: transaction
title: Transactions
depth: deep
phase: 8
note: >-
  A group of reads and writes that succeeds or fails as one: BEGIN,
  COMMIT, ROLLBACK, and what autocommit hides.
needs: [sql, write-ahead-log]
leads_to: [acid, isolation-levels, optimistic-concurrency, dual-writes, transactional-outbox, two-phase-commit, oltp-vs-olap]
compare_with: []
---

# Transactions

A transaction is a group of [[sql|SQL]] reads and writes that the
database treats as one unit: either all of it happens or none of it does, and nobody
else sees it half done. You start one with `BEGIN`, end it with
`COMMIT` or `ROLLBACK`, and in between the database keeps your changes
to yourself. Most of the time you're using transactions without
typing `BEGIN`, which is why it's worth knowing exactly where they
start and stop.

## One transfer, four updates

Take a bank that keeps a balance per account and a total per branch.
Moving 100 from Alice to Bob takes four `UPDATE`s: take 100 from
Alice, take 100 from Alice's branch total, add 100 to Bob, add 100 to
Bob's branch total.

Run them as four separate statements and two things can go wrong.

- **A crash in the middle.** The server dies after the first two
  updates. Alice has lost 100 and Bob never got it. The money is gone.
- **Someone reads in the middle.** A report that adds up all the branch
  totals runs between the second and fourth update. It sees the debit
  but not the credit, and reports 100 less money than the bank has.

Wrap the same four statements in a transaction and both problems go
away:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
UPDATE branches SET balance = balance - 100 WHERE name = 'north';
UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob';
UPDATE branches SET balance = balance + 100 WHERE name = 'south';
COMMIT;
```

If the server crashes before `COMMIT`, none of the four updates count
when it comes back. If the report runs while the transaction is open,
it doesn't see any of the four. When `COMMIT` returns, all four become
visible to other sessions at the same moment, and they're on disk: the
database logs a transaction's changes to permanent storage before it
tells you the commit succeeded.

![Two timelines of the same transfer. On top, in autocommit mode, each UPDATE commits on its own; a crash after the debit leaves Alice's 100 taken and Bob's never added. Below, the four UPDATEs sit between BEGIN and COMMIT; a crash before COMMIT undoes all of them, and other sessions see the old values until COMMIT, then all four changes at once, never the middle.](img/transaction-autocommit-vs-block.svg)

*The same four updates, one statement at a time and as one transaction.*

## Three ways a transaction ends

A transaction ends in one of two states, committed or aborted, and it
can get to aborted in several ways:

- **You commit.** `COMMIT` makes every change permanent and visible.
- **You roll back.** `ROLLBACK` throws away every change since `BEGIN`.
  You'd do this when your code notices something wrong halfway, like
  Alice's balance going negative.
- **The database aborts it.** A crash, a session that ends before
  committing, or the database's own concurrency control can roll it
  back for you. Even a `COMMIT` can turn into an abort, when the
  database decides the transaction can't be allowed to finish.

That last case surprises people. A database that deals with clashes
between transactions when they try to commit, rather than blocking
them up front, handles a clash by aborting one of them. How often that
happens depends on the [[isolation-levels|isolation level]]. Your code
has to be ready to run the whole thing again.

## What autocommit hides

You don't have to type `BEGIN` to be in a transaction. Postgres treats
every statement as a transaction: without `BEGIN`, each statement gets
an implicit `BEGIN` before it and a `COMMIT` after it (or a rollback, if
it fails). This is called autocommit. MySQL's InnoDB does the same, and
has autocommit on by default for every new connection. [[sqlite|SQLite]] goes
further: no read or write happens outside a transaction, and a
statement that isn't inside one starts its own.

So a single statement is always atomic. An `UPDATE` that touches a
million rows either changes all of them or none. The trap is the step
from one statement to two. Each statement in autocommit mode is its own
transaction, so the four-statement transfer above, sent without
`BEGIN`, is four transactions, and a crash can land between any of
them.

Autocommit hides a few more things:

- **Your library may be sending `BEGIN` for you.** Some client
  libraries send `BEGIN` and `COMMIT` without being asked, so you get
  transaction blocks you didn't write. Others don't. Read the docs for
  the one you use, because the same code means different things.
- **Turning autocommit off leaves a transaction open.** In MySQL with
  `SET autocommit = 0`, a session always has a transaction open, and if
  it disconnects without `COMMIT`, that work is rolled back. Forget a
  `COMMIT` and your changes quietly vanish, and until then the
  transaction sits open (what that costs is
  [[long-running-transactions]]).
- **Some statements commit for you.** MySQL ends the open transaction
  implicitly before certain statements, as if you'd typed `COMMIT`.
- **Many small transactions cost more than one big one.** Starting and
  committing a transaction takes real CPU and disk work. The disk part
  is the commit itself: the database has to get the transaction's log
  onto permanent storage before it reports success (that's the
  [[write-ahead-log]] and [[fsync]]). Postgres runs a batch of
  statements faster inside one transaction block than as separate
  autocommits.

## Savepoints: undoing part of a transaction

Transactions don't nest. `BEGIN` inside an open transaction is a
warning in Postgres and an error in SQLite. What you get instead is
savepoints:

```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice';
SAVEPOINT before_credit;
UPDATE accounts SET balance = balance + 100 WHERE name = 'Bob';
-- wrong account
ROLLBACK TO before_credit;
UPDATE accounts SET balance = balance + 100 WHERE name = 'Wally';
COMMIT;
```

`ROLLBACK TO` undoes everything since the savepoint and keeps what came
before. The savepoint stays defined, so you can roll back to it again.
Rolling back to a savepoint, or releasing it, also drops any savepoints
made after it.

Savepoints matter most for errors. In Postgres, when a statement in a
transaction block fails, the database puts the whole block in an
aborted state, and you can't just carry on. `ROLLBACK TO` a savepoint
is the only way back short of rolling back the whole transaction.
SQLite behaves differently: after some errors
(disk full, I/O error, out of memory) it tries to undo only the failed
statement and keep the transaction going, and sometimes rolls back the
whole transaction instead.

## One writer or many

Databases differ a lot in how many transactions can run at once.
SQLite allows many read transactions at the same time but only one
write transaction. A read transaction that later tries to write may
fail with `SQLITE_BUSY` if another connection has already started
writing, which is why `BEGIN IMMEDIATE` exists: it starts the write
transaction up front. Postgres and InnoDB run many transactions at
once, and what each one can see of the others is set by its
[[isolation-levels|isolation level]], built on [[mvcc]] and locks.

The simplest design would run one transaction at a time, which is
correct by construction and slow. Everything in phase 8 is about
running transactions at the same time while keeping that one-at-a-time
illusion, or deciding how much of it to give up.

## Where it gets tricky

**A transaction only covers the database.** If your transaction sends
an email, charges a card or calls another service, then rolls back,
the email is still sent. The database can undo its own writes and
nothing else. Jim Gray's 1981 paper already split actions into ones
that can be undone and "real" ones that can't, like a cash dispenser
handing out money. This is the root of the [[dual-writes]] problem,
and the reason for patterns like the [[transactional-outbox]].
Stretching a transaction across several systems is the job of
[[two-phase-commit]], and giving that up is what [[sagas]] are about.

**All or nothing isn't the same as correct.** A transaction makes your
four updates atomic. It doesn't check that they're the right four
updates. If a committed transaction was wrong, the fix is another
transaction that corrects it (a refund, a reversal), not an undo.
What each letter of [[acid]] actually promises, and which part is your
job, is its own article.

**Atomic isn't the same as isolated.** People often assume a
transaction also protects them from other transactions running at the
same time. It does only as far as the isolation level goes, and the
default levels let some races through, like a [[lost-update]] when two
transactions read and then write the same row.

**Long transactions are expensive.** Gray's paper already flagged
transactions that last days as an unsolved problem. Today a
transaction left open, even an idle one, holds things back for every
other session ([[long-running-transactions]]). Keep user think-time
and network calls outside them.

## What this means when you build

- When two or more writes must succeed or fail together, put them in
  one explicit transaction. One statement is already atomic.
- Know whether your driver starts transactions for you, and
  check what "autocommit off" means in it.
- Don't call other services, send email or wait on a user inside a
  transaction. Do the database work, commit, then do the side effect
  (or use an outbox).
- Be ready for the database to abort your transaction: catch the error,
  and retry the whole transaction, not just the last statement.
- Batch many small writes into one transaction when they belong
  together; it's cheaper than one commit each.
- Keep transactions short.

## Further reading

- [PostgreSQL 3.4 Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html), PostgreSQL Global Development Group, version 18. The bank transfer, BEGIN, COMMIT, ROLLBACK, implicit transactions and savepoints.
- [PostgreSQL BEGIN](https://www.postgresql.org/docs/current/sql-begin.html), PostgreSQL Global Development Group, version 18. Autocommit mode, why a transaction block is faster, and nesting with savepoints.
- [MySQL 8.4, autocommit, Commit, and Rollback](https://dev.mysql.com/doc/refman/8.4/en/innodb-autocommit-commit-rollback.html), Oracle. How InnoDB wraps every statement, and what turning autocommit off does.
- [SQLite, Transaction](https://www.sqlite.org/lang_transaction.html), SQLite developers. Implicit transactions, one writer at a time, DEFERRED and IMMEDIATE, and errors inside a transaction.
- [The Transaction Concept: Virtues and Limitations](https://jimgray.azurewebsites.net/papers/thetransactionconcept.pdf), Jim Gray, 1981. Where the idea came from, actions that can't be undone, compensating transactions, and long-lived transactions.
- [Lecture #16: Concurrency Control Theory](https://15445.courses.cs.cmu.edu/fall2024/notes/16-concurrencycontrol.pdf), Andy Pavlo, CMU 15-445, 2024. A transaction as the unit of change, who can abort it, and why its scope ends at the database.

---
id: phantom-read
title: Phantom reads
depth: short
phase: 8
note: >-
  Running the same query twice and getting new rows.
needs: [isolation-levels]
leads_to: [predicate-locks]
compare_with: [non-repeatable-read, write-skew]
---

# Phantom reads

A phantom read is when your [[transaction]] runs the same search twice
and gets a different set of rows, because another transaction inserted
(or changed) a row that matches and committed in between. The new row
is the phantom. Locking the rows you read can't prevent it, since the
phantom didn't exist when you read, so there was nothing to lock.

## A row that wasn't there

Say a `child` table has an [[indexes|index]] on `id`, and it holds rows with ids 90
and 102. Your transaction wants every row above 100, locked so it can
update them later:

```sql
SELECT * FROM child WHERE id > 100 FOR UPDATE;   -- returns 102
```

Suppose the database locks only the rows your query returned. Another
session inserts a row with id 101 and commits. You run the same SELECT
again, in the same transaction, and it returns 101 and 102. You locked
row 102, and that lock did its job. Row 101 is new, and no lock you
held covered it.

That's the difference from a [[non-repeatable-read]]. There, a row you
already read changed. Here, the set of rows your condition matches
changed. A lock on each row read is enough to stop the first. The
second needs a lock on the condition itself.

## Locking the gap

A lock on a search condition, covering every row that matches now or
could match later, is a [[predicate-locks|predicate lock]]. That set
can be infinite: it includes every row anyone might insert later that
would match.

InnoDB, MySQL's storage engine, gets the same effect by locking ranges
of the index it scanned. When a locking read scans the index, it locks
each index record it passes with a next-key lock: a lock on the record
plus the gap just before it. It can also lock the gap after the last
record, as it does here. Another session that tries to insert 101 lands
in a locked gap and is blocked.

![An index on id with records 90 and 102. The query id > 100 FOR UPDATE scans from 102 onward. A next-key lock covers the gap between 90 and 102 plus record 102, and a gap lock covers everything after 102. An insert of 101 from another session falls in the locked gap and waits.](img/phantom-read-gap-lock.svg)

*A range scan and the next-key locks that keep a phantom out. Adapted from the MySQL 8.4 Reference Manual, "Phantom Rows".*

A side effect is useful: you can lock the *absence* of a row. Read with
a locking read, see no duplicate, and the gap lock stops anyone
inserting one before you commit.

Snapshot databases take a different route. At Postgres's REPEATABLE
READ, your whole transaction reads one snapshot, so the second SELECT
can't see row 101 at all. The SQL standard allows phantoms at the
REPEATABLE READ [[isolation-levels|isolation level]]; Postgres prevents them anyway, which the standard permits because
it only sets a minimum.

## Where it gets tricky

**Not seeing the phantom isn't the same as being safe from it.**
Snapshot isolation hides the new row from your reads, but the row is
still there. The classic case: a rule says the tasks for one job may
not add up to more than 8 hours. Two transactions each sum the tasks,
see 7 hours, and each insert a new 1-hour task. Both inserts are new
rows, so nothing conflicts, and the job ends at 9 hours. Neither
transaction ever saw a phantom in its own reads, yet the result is
exactly what a phantom check would have caught. That's
[[write-skew]] driven by a phantom.

**The standard's wording is narrow.** SQL-92 talks about another
transaction *inserting* matching rows. An update that moves a row into
the condition, or a delete that takes one out, changes the result the
same way. So the useful version of the rule covers any write that
affects the rows matching a condition you read, which is how the 1995
critique of the SQL levels redefined it.

**MySQL's protection depends on the read and the level.** At
REPEATABLE READ, InnoDB takes gap and next-key locks for locking reads
(FOR UPDATE, FOR SHARE), UPDATE and DELETE with a range condition. A
plain SELECT reads a snapshot instead. At READ COMMITTED, InnoDB turns
gap locking off, so phantoms are back.

## What this means when you build

- Watch for decisions that depend on "no matching rows": a free booking
  slot, a username not yet taken, a limit not yet reached. Those are
  where phantoms turn into bugs.
- On Postgres, a snapshot keeps your reads stable. Stopping two
  transactions from both acting on the same missing row takes
  SERIALIZABLE (which tracks what your queries read with predicate
  locks) or an explicit table lock.
- On MySQL, use a locking read at REPEATABLE READ when you need the
  range held. The locks sit on the records and gaps of the index your
  query scans.
- Where the rule can be written as a unique or exclusion constraint, let
  the database enforce it; see [[write-skew]] for the options.

## Further reading

- [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 documentation. The definition of a phantom read, and why Postgres's REPEATABLE READ doesn't have them.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil, 1995. The broad definition, predicate locks, and the 8-hour job-tasks example under snapshot isolation.
- [17.7.4 Phantom Rows](https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html), MySQL 8.4 Reference Manual. The id 90/101/102 example and how next-key locks work.
- [17.7.2.1 Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html), MySQL 8.4 Reference Manual. Which statements take gap locks at REPEATABLE READ, and why READ COMMITTED has phantoms.

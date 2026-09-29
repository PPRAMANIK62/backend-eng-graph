---
id: non-repeatable-read
title: Non-repeatable reads
depth: short
phase: 8
note: >-
  Reading the same row twice and getting different values. Also called
  read skew.
needs: [isolation-levels]
leads_to: []
compare_with: [dirty-read, phantom-read]
---

# Non-repeatable reads

A non-repeatable read is when your [[transaction]] reads the same row
twice and gets two different values, because another transaction
changed it and committed in between. Nothing uncommitted was seen, so
it isn't a [[dirty-read]]. It's allowed at the READ COMMITTED
[[isolation-levels|isolation level]], which is
Postgres's default, so any code that reads, thinks, and reads again can
hit it.

## One row, two answers

A table `test` has two rows: id 1 holds 10, id 2 holds 20. Two
sessions run at READ COMMITTED:

```
T1: begin
T1: select value from test where id = 1   -- 10
T2: begin
T2: update test set value = 12 where id = 1
T2: commit
T1: select value from test where id = 1   -- 12
T1: commit
```

T1 asked the same question twice inside one transaction and got two
answers. Neither was dirty: 10 was committed when T1 first read it, and
12 was committed when T1 read it again.

The reason is how READ COMMITTED takes its snapshot. In Postgres each
statement sees the data committed before that statement began, so two
SELECTs in one transaction can see two different states.

At REPEATABLE READ, the snapshot is taken once, at the first statement,
and kept for the whole transaction. T1's second SELECT would return 10
again. This is [[snapshot-isolation]], built on [[mvcc]]: the old
version of the row is still there for T1 to read.

## The general case: read skew

Re-reading one row is the simple version. The version that bites more
often involves two related rows read at different moments. It's called
read skew.

Same table. T2 moves 2 from row 2 to row 1, so the total stays 30:

```
T1: select value from test where id = 1   -- 10
T2: update test set value = 12 where id = 1
T2: update test set value = 18 where id = 2
T2: commit
T1: select value from test where id = 2   -- 18
```

T1 never read anything twice, yet it saw row 1 before the move and row 2
after it. Its total is 28, a state that never existed. At Postgres's
REPEATABLE READ, T1's second read returns 20 and the total is 30. The
Hermitage test suite runs exactly this script against Postgres and gets
both results.

Seen this way, a non-repeatable read is read skew where the two items
happen to be the same one. The SQL standard's wording only talks about
reading an item a second time, so it misses cases like this one.
The broad reading of the rule counts any write to something you've read
while your transaction is still open. That covers read skew too.

## Where it gets tricky

**"Repeatable read" is a confusing name.** It promises your reads of
the same row repeat. It doesn't, in the SQL standard, promise that the
same *query* repeats: new rows can still appear, which is a
[[phantom-read]]. And the name means different things per database.
Hermitage's table lists Postgres's REPEATABLE READ as snapshot
isolation, while MySQL's, the InnoDB default, lets a [[lost-update]]
through that Postgres's stops.

**Locking and snapshots fix it differently.** A locking database stops
non-repeatable reads by holding read locks until commit (see
[[two-phase-locking]]), so T2's update
waits for T1. A snapshot database lets T2 go ahead and shows T1 the old
version. Both give T1 a stable answer, but only the locking one keeps
the row from changing under you. At Postgres's REPEATABLE READ, if T1
then tries to update that row, it fails with a serialization error and
has to retry.

## What this means when you build

- If a piece of code reads several things and needs them to agree (a
  report, a balance check, an export), run it in one REPEATABLE READ
  transaction. In Postgres, a read-only transaction at that level never
  gets a serialization error.
- Or read everything in one statement. Even at READ COMMITTED, a single
  statement sees a single snapshot.
- Don't assume a value you read earlier in a READ COMMITTED transaction
  is still current when you write. For read-then-write, see
  [[lost-update]].

## Further reading

- [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 documentation. How READ COMMITTED and REPEATABLE READ take their snapshots.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil, 1995. The fuzzy read, read skew, and why the broad reading is needed.
- [Hermitage](https://github.com/ept/hermitage), Martin Kleppmann and contributors. The read skew script, run at both levels on Postgres.

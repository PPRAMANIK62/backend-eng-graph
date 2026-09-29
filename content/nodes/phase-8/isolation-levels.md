---
id: isolation-levels
title: Isolation levels
depth: deep
phase: 8
note: >-
  Read committed, repeatable read, serializable: what each lets
  concurrent transactions see, and where the SQL standard's definitions
  fall short.
needs: [transaction]
leads_to: [serializability, dirty-read, non-repeatable-read, phantom-read, lost-update, write-skew, mvcc, snapshot-isolation]
compare_with: [consistency-models, acid]
---

# Isolation levels

An isolation level is the setting that decides what one
[[transaction]] can see of the others running at the same time. The
strictest level makes concurrent transactions behave as if they ran one
after another. The weaker ones are faster and let certain races
through. Most SQL databases offer the same four level names, and what
they actually do differs from one database to the next.

## Two reads, one change in between

Start with the smallest possible race. Transaction T1 reads Alice's
balance, does some work, and reads it again. In between, transaction
T2 takes 100 from Alice and commits.

![Timeline with two transactions. T1 begins and reads Alice's balance as 500. T2 then updates the balance to 400 and commits. T1 reads the balance again: at read committed it sees 400, because each statement takes a fresh snapshot; at repeatable read it sees 500 again, because the whole transaction reads from one snapshot taken at its first statement.](img/isolation-levels-two-reads.svg)

*The same two transactions at two isolation levels. The numbers are only an example.*

What should T1's second read return? Both answers are defensible.
Returning 400 shows T1 the latest committed data. Returning 500 keeps
T1's view stable, so a report computed from several reads adds up. The
isolation level is how you choose. In Postgres, the default (read
committed) returns 400 and repeatable read returns 500.

That's one race. Isolation levels are a menu of which races you accept.

## Four levels, defined by what can go wrong

The SQL standard defines four levels. The strictest, serializable, is
defined directly: any set of serializable transactions running at once
must have the same effect as running them one at a time in some order
([[serializability]]). The other three are defined by *phenomena*,
patterns of interference that must not happen at that level:

- **[[dirty-read|Dirty read]]:** you read data another transaction
  wrote but hasn't committed.
- **[[non-repeatable-read|Non-repeatable read]]:** you read a row
  again and find another transaction changed it and committed in
  between (the example above).
- **[[phantom-read|Phantom read]]:** you rerun a query with a `WHERE`
  condition and get a different set of rows, because another
  transaction added or removed matching rows.
- **Serialization anomaly:** the committed result doesn't match any
  one-at-a-time order of the transactions. Postgres adds this fourth
  phenomenon to its table; only serializable prevents it.

The standard's table, and what Postgres actually does:

| Level | Dirty read | Non-repeatable read | Phantom read | Serialization anomaly |
|---|---|---|---|---|
| Read uncommitted | allowed (not in Postgres) | possible | possible | possible |
| Read committed | no | possible | possible | possible |
| Repeatable read | no | no | allowed (not in Postgres) | possible |
| Serializable | no | no | no | no |

The standard only sets a floor. A database may prevent more than the
table asks, and Postgres does: its read uncommitted behaves exactly
like read committed, and its repeatable read doesn't allow phantoms.

## Read committed: a fresh snapshot per statement

Read committed is the default in Postgres. Each statement sees a
snapshot of the data as of the moment that statement started: only
committed data, plus your own transaction's earlier changes. Two
`SELECT`s in the same transaction can see different data, as in the
example above.

Writes are where it gets subtle. Say T1 runs
`UPDATE accounts SET balance = balance - 100 WHERE name = 'Alice'`
while T2 has already updated Alice's row but not committed. T1 waits
for T2. If T2 rolls back, T1 carries on with the original row. If T2
commits, T1 re-checks its `WHERE` clause against the new version of the
row and applies its change to that new version. So two concurrent
`balance = balance - 100` updates both take effect, which is what you
want.

The cost is that a single statement can see a mixed view: the new
version of the rows it's updating, but the old snapshot of everything
else. Take a table with two rows whose
`hits` are 9 and 10. One session runs `UPDATE website SET hits = hits + 1`
while another runs `DELETE FROM website WHERE hits = 10`. The delete
removes nothing, even though a row with `hits = 10` exists both before
and after the update: it skipped the 9 in its snapshot, and by the
time it could lock the other row, that row had become 11.

Read committed also lets through the classic
[[lost-update]]: two transactions each read a value, compute a new one
in application code, and write it back. The second write silently
replaces the first. Doing the arithmetic inside the `UPDATE`
statement avoids it; reading into your app and writing back doesn't.

## Repeatable read: one snapshot for the whole transaction

At repeatable read, Postgres takes one snapshot at the transaction's
first real statement (not at `BEGIN`) and every query in the
transaction reads from it. You never see anything another transaction
committed after that point, so repeated reads and repeated queries
return the same data. Under the hood this is snapshot isolation,
built on [[mvcc]]; the details are in [[snapshot-isolation]].

Writes change too. If T1 tries to update a row that some other
transaction is changing, T1 waits for it as before. But if that other
transaction commits a change to the row, T1 doesn't move on to the new
version like read committed does. It fails:

```
ERROR:  could not serialize access due to concurrent update
```

That error is the database refusing to let T1 overwrite a change it
never saw, which is exactly the lost update. Your application has to
catch it and run the whole transaction again from the start. The second
time, the new value is part of the snapshot and there's no conflict.
Transactions that only read never get this error.

Repeatable read is still not serializable. Two transactions can each
read some rows, decide based on what they saw, and write *different*
rows. Neither overwrote the other, so both commit, and together they
can break a rule that each one checked. That's [[write-skew]]. So
enforcing business rules at this level needs explicit locks.

## Serializable: repeatable read plus a watchdog

Since Postgres 9.1, serializable is real serializability. It
works like repeatable read, and also tracks which transactions read
data that others then wrote. When it spots a pattern of reads and
writes that could produce a result no serial order would, it aborts
one of the transactions
with SQLSTATE `40001`. That tracking doesn't block anyone; it only
costs some overhead and some aborts. The technique is
[[serializable-snapshot-isolation]]. Before 9.1, asking for serializable
gave you what is now repeatable read.

An example: a table has rows in class 1 and class 2.
Transaction A sums class 1 and inserts the total as a class 2 row.
Transaction B sums class 2 and inserts the total as a class 1 row. Run
one after the other, the second would see the first's insert. Run
concurrently at repeatable read, neither sees the other and both
commit, a result no serial order could produce. At serializable, one of
them is rolled back.

What serializable buys you is simple reasoning: if each transaction
does the right thing when run alone, it does the right thing in any mix
of serializable transactions. The price:

- Every transaction can fail with a serialization error, so you need a
  [[retries-with-backoff|retry loop]] that reruns the whole transaction, including the code
  that decided what to write. Postgres doesn't retry for you, because
  it can't know what your code would do differently. Under heavy
  contention it can take several attempts.
- Don't trust anything you read until the transaction commits. If it
  later aborts, what it read may not have been valid.

## MySQL: same names, different behaviour

MySQL's InnoDB defaults to repeatable read, not read committed. Its
plain `SELECT`s at that level read from a snapshot taken at the
transaction's first read, much like Postgres. But `UPDATE`, `DELETE` and
locking reads (`SELECT ... FOR UPDATE`) read the *latest* committed
data and lock what they touch, including the gaps between index
entries, so other sessions can't insert into a range you scanned. In
one transaction you can therefore see two different versions of the
table. MySQL's own docs advise against mixing locking and plain
reads at repeatable read: if you need both, you usually want
serializable instead.

The Hermitage test suite, which runs the same races against many
databases, found that InnoDB's repeatable read doesn't stop lost
updates, which Postgres's repeatable read does. Its table files
InnoDB's repeatable read under a level it calls monotonic atomic view,
where Postgres's repeatable read gets snapshot isolation. InnoDB's
serializable works by locking: with autocommit off, it turns every plain
`SELECT` into `SELECT ... FOR SHARE`.

## Where it gets tricky

**The standard's definitions don't hold up.** A 1995 paper by
Berenson, Bernstein, Gray and others showed the SQL-92 phenomena are
ambiguous and incomplete. They don't mention dirty writes (two
transactions overwriting each other's uncommitted data), which every
level should forbid. They don't cover lost updates, which the paper
had to add as a new phenomenon. And snapshot
isolation avoids all three phenomena, read the narrow way, while still
not being serializable. The table's prominence led people to believe
that avoiding the three phenomena means serializable; it doesn't. The
same paper defined snapshot isolation, [[write-skew]] and read skew.
Defining the levels precisely, without assuming locks, is where
[[serializability]] and its dependency graphs come in.

**Same name, different level.** Hermitage's table shows Postgres's
"repeatable read" is snapshot isolation, MySQL's "repeatable read" lets
through races that Postgres's stops, and Oracle's "serializable" is snapshot isolation
too, not serializable. The name tells you little. Test your database,
or read its docs for what it prevents.

**Weak is the default almost everywhere.** A 2013 survey of 18
databases found only three that defaulted to serializable, and only
nine that offered it at all. Postgres (read committed) and MySQL
(repeatable read) both default to something weaker today. Most
application code runs at a level that allows lost updates or write
skew, often without anyone having chosen it.

**Isolation isn't replica consistency.** Isolation levels are about
concurrent transactions on one database. Whether a read from a replica
sees your latest write is a different question, covered by
[[consistency-models]].

## What this means when you build

- Know your default: read committed on Postgres, repeatable read on
  InnoDB. Set the level explicitly for transactions that need more.
- At read committed, do read-modify-write in one statement
  (`SET balance = balance - 100`) or lock the row first
  ([[explicit-locking]]); don't read into your app and write back.
- At repeatable read or serializable, wrap transactions in a retry loop
  on SQLSTATE `40001` that reruns the whole thing.
- Reach for serializable when a transaction checks a rule across
  several rows before writing (bookings, balances, unique slots). It's
  the level where "correct alone" means "correct together".
- Keep serializable transactions short and mark read-only ones
  `READ ONLY`.

## Further reading

- [PostgreSQL 13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL Global Development Group, version 18. The standard's table, and exactly how each level behaves in Postgres, with examples.
- [PostgreSQL 13.5 Serialization Failure Handling](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html), PostgreSQL Global Development Group, version 18. Which errors to retry and why the whole transaction must rerun.
- [MySQL 8.4, Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html), Oracle. InnoDB's four levels, snapshots versus locking reads, and gap locks.
- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Hal Berenson and others, 1995. Why the standard's definitions fall short, and where snapshot isolation fits.
- [Hermitage](https://github.com/ept/hermitage), Martin Kleppmann and contributors. Test results for what each database's levels actually prevent.
- [When is "ACID" ACID? Rarely.](http://www.bailis.org/blog/when-is-acid-acid-rarely/), Peter Bailis, 2013. Default and strongest isolation levels in 18 databases.

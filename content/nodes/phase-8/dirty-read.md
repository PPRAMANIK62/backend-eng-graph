---
id: dirty-read
title: Dirty reads
depth: short
phase: 8
note: >-
  Seeing another transaction's uncommitted writes.
needs: [isolation-levels]
leads_to: []
compare_with: [non-repeatable-read]
---

# Dirty reads

A dirty read is when your [[transaction]] sees a value that another
transaction has written but not yet committed. If that other
transaction then rolls back, you've acted on data that never existed.
It's the weakest guarantee an [[isolation-levels|isolation level]] can
give, and the easiest one to get: every level above read uncommitted
rules it out.

## A transfer seen halfway

Take two bank rows, `x` and `y`, each holding 50. Transaction T1 moves
40 from `x` to `y`: it writes `x = 10`, then later `y = 90`, then
commits. The total is 100 before and after.

Now T2 runs a report in the middle. It reads `x` right after T1's first
write and `y` before T1's second:

```
T1: read x=50   write x=10                            read y=50  write y=90  commit
T2:                         read x=10  read y=50  commit
```

T2 sees a total of 60. No such state was ever committed. T2 read `x`
while it was dirty, that is, written by a transaction that hadn't
finished.

It gets worse if T1 fails. Say T1 hits an error after writing `x = 10`
and rolls back. `x` goes back to 50, but T2 has already read 10 and may
have used it: printed it, sent it to another service, or written
something based on it. That value was never real.

## Two ways to read the rule

The SQL-92 standard describes a dirty read in words: T1 writes, T2
reads, and then T1 rolls back. Read strictly, that only forbids the
case where T1 actually aborts.

The transfer above shows why the strict reading is too weak. Nobody
aborted, and T2 still saw a total of 60. So the accepted reading is the
broad one: reading uncommitted data at all is the problem, whatever
happens to either transaction afterwards. The 1995 critique of the SQL
isolation levels made this argument with exactly this kind of
transfer. Postgres's manual uses the broad version too: a dirty read is
reading data written by a concurrent transaction that hasn't committed.

## Where you can actually get one

The standard allows dirty reads at READ UNCOMMITTED and forbids them at
every level above. Databases differ in what they do with that
permission:

- **PostgreSQL.** You can ask for READ UNCOMMITTED, but it behaves
  exactly like READ COMMITTED. Postgres is built on [[mvcc]], where
  every statement reads a snapshot of committed data, and the manual
  calls this the only sensible mapping for that design. You can't get
  a dirty read in Postgres.
- **MySQL with InnoDB.** READ UNCOMMITTED is real. A plain SELECT may
  return a row version that hasn't been committed. In the Hermitage test
  suite, one session updates a row to 101, a second session reads 101,
  the first rolls back, and the second reads 10 again. READ COMMITTED
  and the default REPEATABLE READ prevent it.

## Dirty writes, one step further

A dirty write is overwriting a value that another transaction wrote and
hasn't committed. It's worse than a dirty read. If T1 writes `x`, then
T2 overwrites it, then T1 rolls back, there's no correct value to
restore: putting back T1's "before" value wipes out T2's write, and
keeping it means T1's rollback didn't undo anything.

The original SQL-92 levels didn't forbid dirty writes at all below
SERIALIZABLE, and the 1995 critique argued every level should. In
practice databases do: writers hold row locks until they commit, so a
second writer waits. Hermitage found no level in Postgres, MySQL, Oracle
or SQL Server that allows them.

## Where it gets tricky

**Asking for READ UNCOMMITTED doesn't mean you get it.** Postgres
quietly gives you READ COMMITTED instead. That's allowed, because the
standard only sets a floor: a database may prevent more than a level
requires. So "we run at READ UNCOMMITTED" tells you little until you
know which database.

**No dirty reads doesn't mean a consistent view.** READ COMMITTED stops
you seeing uncommitted data, but two queries in one transaction can
still see different committed states. That's a
[[non-repeatable-read]], the next step up.

## What this means when you build

- On Postgres, or MySQL at its default level, you won't see dirty reads.
  Spend your attention on the anomalies that are still allowed.
- Don't turn on READ UNCOMMITTED in MySQL to "go faster" for anything
  whose output someone acts on. The MySQL manual pitches it for things
  like bulk reporting where exact numbers matter less than lock
  overhead.
- If a value you read is going to leave the database (an email, an API
  call, a charge), read it at READ COMMITTED or above, and send it after
  the transaction that wrote it has committed.

## Further reading

- [A Critique of ANSI SQL Isolation Levels](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), Berenson, Bernstein, Gray, Melton, O'Neil and O'Neil, 1995. The strict versus broad reading of dirty read, the transfer example, and why dirty writes must be banned.
- [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 documentation. The definition, Table 13.1, and why Postgres's READ UNCOMMITTED is really READ COMMITTED.
- [17.7.2.1 Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html), MySQL 8.4 Reference Manual. InnoDB's READ UNCOMMITTED, which does allow dirty reads.
- [Hermitage](https://github.com/ept/hermitage), Martin Kleppmann and contributors. Two-session scripts showing the dirty read in MySQL and its absence in Postgres, and which levels prevent dirty writes.

---
id: kleppmann-hermitage
title: "Hermitage: Testing transaction isolation levels"
author: Martin Kleppmann and contributors
url: https://github.com/ept/hermitage
kind: code
primary: false
---

## Summary

A test suite, started in 2014, of hand-run two- and three-session SQL
scripts that each try to cause one anomaly (dirty read, lost update, read
skew, write skew and others, named after Adya's definitions). The README
has a table of what each database's isolation levels actually prevent;
per-database files (postgres.md, run on Postgres 9.3.5; mysql.md, run on
MySQL 5.6.21) hold the scripts and results.

## Key claims

- What the project is. "[Hermitage](https://github.com/ept/hermitage) is an attempt to nail down precisely what different database systems actually mean with their isolation levels." (README)
- Anomaly names used. "P4: Lost Update" and "G-single: Single Anti-dependency Cycles (read skew)" and "G2-item: Item Anti-dependency Cycles (write skew on disjoint read)" and "G2: Anti-Dependency Cycles (write skew on predicate read)" (README, legend)
- Summary table: Postgres "read committed" prevents G0, G1a, G1b, G1c and OTV but not PMP, P4, G-single, G2-item or G2; "repeatable read" prevents everything up to G-single but not G2-item or G2; MySQL/InnoDB "repeatable read" (the default) does not prevent P4 or G2-item; Oracle "serializable" is snapshot isolation. (README, summary table)
- It can't prove anything, only probe. "It obviously cannot prove that a database always behaves in a certain way, it can only probe certain examples and observe what happens." (README, Caveats)
- Ordering, not speed, makes the bugs. "It's not the speed that matters, it's the ordering of events." (README, Caveats)
- Dirty writes are stopped by row locks. "Postgres "read committed" prevents Write Cycles (G0) by locking updated rows:" (postgres.md) and "MySQL "read uncommitted" prevents Write Cycles (G0) by locking updated rows:" (mysql.md)
- Postgres read committed lets a lost update through: both read row 1, both update it, the second waits, then overwrites. "commit; -- T1. This unblocks T2, so T1's update is overwritten" (postgres.md, Lost Update (P4))
- Postgres repeatable read stops it with an error. "commit; -- T1. T2 now prints out "ERROR: could not serialize access due to concurrent update"" (postgres.md, Lost Update (P4))
- Postgres read committed allows read skew: T1 reads row 1 = 10, T2 changes rows 1 and 2 and commits, T1 reads row 2 = 18. "select * from test where id = 2; -- T1. Shows 2 => 18" (postgres.md, Read Skew (G-single))
- Postgres read committed allows a phantom-like new row in a repeated predicate read. "select * from test where value % 3 = 0; -- T1. Returns the newly inserted row" (postgres.md, Predicate-Many-Preceders (PMP))
- Postgres repeatable read does not prevent write skew; serializable does. "Postgres "repeatable read" does not prevent Write Skew (G2-item):" (postgres.md) and "commit; -- T2. Prints out "ERROR: could not serialize access due to read/write dependencies among transactions"" (postgres.md, Write Skew (G2-item))
- Postgres repeatable read allows G2: both read a predicate, both insert a row matching it. "select * from test where value % 3 = 0; -- Either. Returns 3 => 30, 4 => 42" (postgres.md, Anti-Dependency Cycles (G2))
- MySQL read uncommitted shows dirty reads. "select * from test; -- T2. Shows 1 => 101" then after T1's rollback "select * from test; -- T2. Shows 1 => 10 again" (mysql.md, Aborted Reads (G1a))
- MySQL repeatable read does not prevent lost update. "MySQL "repeatable read" does not prevent Lost Update (P4):" (mysql.md, Lost Update (P4))
- MySQL serializable prevents it by a deadlock error. "ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction" (mysql.md, Lost Update (P4))
- MySQL repeatable read does not prevent write skew. "MySQL "repeatable read" does not prevent Write Skew (G2-item):" (mysql.md, Write Skew (G2-item))
- Postgres "serializable" prevents every anomaly in the table. (README, summary table)
- SQL Server's "repeatable read" prevents G2-item but only some G-single; its "snapshot" level is snapshot isolation. (README, summary table)
- Textbooks equate isolation with serializability, but systems rarely use it. "if you look at the implementations of isolation in practice, you see that serializability is rarely used, and some popular databases (such as Oracle) don't even implement it." (README, Background)
- Weaker isolation is a performance trade. "weaker isolation is faster but exposes you to more potential race conditions" (README, Background)
- The SQL standard's definition is flawed. "The SQL standard tried to define four isolation levels (read uncommitted, read committed, repeatable read and serializable), but its definition is flawed." (README, Background)
- Oracle's "serializable" is snapshot isolation, preventing G2 only in some cases. (Summary table)
- Same guarantees can come from very different implementations. "For example, although PostgreSQL's serializable and MySQL's serializable have the same isolation guarantees, they have totally different implementations and very different performance characteristics." (Caveats)
- In the summary table, MySQL/InnoDB "repeatable read" (the default, starred) has the actual level "monotonic atomic view", while Postgres "repeatable read" is "snapshot isolation"; the MySQL row prevents P4, G-single and G2-item only for read-only cases or not at all. (README, summary table)
- In the summary table every level of every database tested prevents G0 (dirty writes), and G1a (aborted reads) is allowed only at "read uncommitted" in MySQL, SQL Server and Memgraph. (README, summary table)
- Postgres repeatable read prevents the same read skew: T1's read of row 2 still shows the old value. "select * from test where id = 2; -- T1. Shows 2 => 20" (postgres.md, Read Skew (G-single), repeatable read)
- MySQL serializable stops write skew the same way as lost update: T1's update blocks and T2's fails with a deadlock. "update test set value = 21 where id = 2; -- T2, prints "ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction"" (mysql.md, Write Skew (G2-item), serializable)

## Visuals worth redrawing

- The summary table (database, "so-called" level, actual level, anomaly
  columns).

## My notes

- Versions are old (Postgres 9.3.5, MySQL 5.6.21). The Postgres
  behaviour matches the current (18) manual. For MySQL, the 8.4 manual's
  consistent-read page describes the same cause (DML isn't bound to the
  snapshot).
- Not written by the database builders, so primary: false, but the
  results are direct observations.

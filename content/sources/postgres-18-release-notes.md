---
id: postgres-18-release-notes
title: "PostgreSQL 18 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/release/18.0/
kind: docs
primary: true
---

## Summary

Release notes for PostgreSQL 18.0 (2025). Relevant here: the new
`uuidv7()` function, NOT ENFORCED constraints, NOT VALID for not-null
constraints, and temporal (range) constraints. Also the EXPLAIN
changes and the new asynchronous I/O subsystem.

## Key claims

- PostgreSQL 18 adds a uuidv7() function. "uuidv7() function for generating timestamp-ordered UUIDs." (E.6.1 Overview)
- And a uuidv4() alias. "Function alias uuidv4() has been added to explicitly generate version 4 UUIDs." (E.6.3.4 Functions)
- UUIDv7 values sort by time. "This UUID value is temporally sortable." (E.6.3.4 Functions)
- Temporal constraints over ranges. "Temporal constraints, or constraints over ranges, for PRIMARY KEY, UNIQUE, and FOREIGN KEY constraints." (E.6.1 Overview)
- CHECK and foreign keys can be NOT ENFORCED. "Allow CHECK and foreign key constraints to be specified as NOT ENFORCED" (E.6.3.2.1 Constraints)
- Not-null constraints can be NOT VALID. "Allow ALTER TABLE to set the NOT VALID attribute of NOT NULL constraints" (E.6.3.2.1 Constraints)
- EXPLAIN ANALYZE now includes buffer counts by default. "Automatically include BUFFERS output in EXPLAIN ANALYZE" (E.6.3.2.3 EXPLAIN)
- It reports index lookups per index scan node. "In EXPLAIN ANALYZE, report the number of index lookups used per index scan node" (E.6.3.2.3 EXPLAIN)
- Row counts are printed with fractions. "Modify EXPLAIN to output fractional row counts" (E.6.3.2.3 EXPLAIN)
- Disabled plan nodes are marked. "Indicate disabled nodes in EXPLAIN ANALYZE output" (E.6.3.2.3 EXPLAIN)
- A new asynchronous I/O subsystem lets backends queue several reads. "This feature allows backends to queue multiple read requests, which allows for more efficient sequential scans, bitmap heap scans, vacuums, etc." (E.6.3.1.3 General Performance)
- It's selected with io_method. "This is enabled by server variable io_method" (E.6.3.1.3 General Performance)
- B-tree skip scan. "Support for "skip scan" lookups that allow using multicolumn B-tree indexes in more cases." (E.6.1 Overview)
- Skip scan helps when early index columns have no condition or a non-equality one. "This allows multi-column btree indexes to be used in more cases such as when there are no restrictions on the first or early indexed columns (or there are non-equality ones), and there are useful restrictions on later indexed columns." (E.6.3.1.2 Indexes)
- pg_upgrade keeps planner statistics. "pg_upgrade now retains optimizer statistics." (E.6.1 Overview)
- Except extended statistics. "Extended statistics are not preserved." (E.6.3.7.2 pg_upgrade)
- A fixed number of dead tuples can now trigger autovacuum. "Allow specification of the fixed number of dead tuples that will trigger an autovacuum (Nathan Bossart, Frédéric Yhuel)" and "The server variable is autovacuum_vacuum_max_threshold." (Server Configuration)

## Visuals worth redrawing

None.

## My notes

- Released in 2025 (the page gives the release date).

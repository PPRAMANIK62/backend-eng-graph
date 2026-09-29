---
id: postgres-create-index
title: "PostgreSQL documentation, CREATE INDEX"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-createindex.html
kind: docs
primary: true
---

## Summary

The reference page for CREATE INDEX (read at version 18). Used here for
the difference between a normal build, which blocks writes, and
CONCURRENTLY, which doesn't but costs more and can fail halfway.

## Key claims

- A normal build blocks writes but not reads; CONCURRENTLY blocks neither. "PostgreSQL will build the index without taking any locks that prevent concurrent inserts, updates, or deletes on the table; whereas a standard index build locks out writes (but not reads) on the table until it's done." (CONCURRENTLY)
- CONCURRENTLY scans twice and waits for older transactions. "When this option is used, PostgreSQL must perform two scans of the table, and in addition it must wait for all existing transactions that could potentially modify or use the index to terminate." (Building Indexes Concurrently)
- It's slower overall. "Thus this method requires more total work than a standard index build and takes significantly longer to complete." (Building Indexes Concurrently)
- It still loads the server while it runs. "Of course, the extra CPU and I/O load imposed by the index creation might slow other operations." (Building Indexes Concurrently)
- A failure leaves an invalid index that still costs writes. "the CREATE INDEX command will fail but leave behind an “invalid” index. This index will be ignored for querying purposes because it might be incomplete; however it will still consume update overhead." (Building Indexes Concurrently)
- Recovery: drop it and try again. "The recommended recovery method in such cases is to drop the index and try again to perform CREATE INDEX CONCURRENTLY." (Building Indexes Concurrently)
- It can't run inside a transaction block. "Another difference is that a regular CREATE INDEX command can be performed within a transaction block, but CREATE INDEX CONCURRENTLY cannot." (Building Indexes Concurrently)
- (added for phase 7, B+trees) B-tree fillfactor: leaves are packed to this percentage on build and when growing at the right; full pages split later. "For B-trees, leaf pages are filled to this percentage during initial index builds, and also when extending the index at the right (adding new largest key values)." (Index Storage Parameters, fillfactor)
- The B-tree default is 90. "B-trees use a default fillfactor of 90, but any integer value from 10 to 100 can be selected." (Index Storage Parameters, fillfactor)
- Lower values can smooth out page splits for write-heavy indexes. "Values in the range of 50 - 90 can usefully “smooth out” the rate of page splits during the early life of the B-tree index" (Index Storage Parameters, fillfactor)
- B-tree is the default index method. "The default method is btree." (Parameters, USING)

## Visuals worth redrawing

None.

## My notes

- Because of the transaction-block rule, migration tools that wrap each
  migration in a transaction (Rails) need that turned off for this
  statement.

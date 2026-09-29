---
id: mysql-innodb-isolation-levels
title: "MySQL 8.4 Reference Manual, 17.7.2.1 Transaction Isolation Levels"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html
kind: docs
primary: true
---

## Summary

How InnoDB (MySQL 8.4) implements the four standard isolation levels.
Repeatable Read is the default; plain SELECTs read a snapshot, while
locking reads and writes read the latest data and take gap or next-key
locks.

## Key claims

- InnoDB offers all four SQL:1992 levels and defaults to Repeatable Read. "The default isolation level for InnoDB is REPEATABLE READ." (first paragraphs)
- The isolation level trades performance against consistency. "the isolation level is the setting that fine-tunes the balance between performance and reliability, consistency, and reproducibility of results when multiple transactions are making changes and performing queries at the same time." (first paragraph)
- At Repeatable Read, plain reads use the snapshot from the first read. "Consistent reads within the same transaction read the snapshot established by the first read." (REPEATABLE READ)
- Locking reads, UPDATE and DELETE with a range condition lock the scanned range with gap or next-key locks. "InnoDB locks the index range scanned, using gap locks or next-key locks to block insertions by other sessions into the gaps covered by the range." (REPEATABLE READ)
- Mixing locking and non-locking statements at Repeatable Read gives two views that don't match. "In general, these two different table states are inconsistent with each other and difficult to parse." (REPEATABLE READ)
- The manual itself says you usually want Serializable in that case. "It is not recommended to mix locking statements (UPDATE, INSERT, DELETE, or SELECT ... FOR ...) with non-locking SELECT statements in a single REPEATABLE READ transaction, because typically in such cases you want SERIALIZABLE." (REPEATABLE READ)
- Read Committed takes a fresh snapshot for every read. "Each consistent read, even within the same transaction, sets and reads its own fresh snapshot." (READ COMMITTED)
- Read Committed has no gap locks, so phantoms can happen. "Because gap locking is disabled, phantom row problems may occur, as other sessions can insert new rows into the gaps." (READ COMMITTED)
- Read Uncommitted allows dirty reads. "This is also called a dirty read." (READ UNCOMMITTED)
- What a Read Uncommitted read may return. "SELECT statements are performed in a nonlocking fashion, but a possible earlier version of a row might be used. Thus, using this isolation level, such reads are not consistent." (READ UNCOMMITTED)
- The weaker levels are pitched at things like bulk reporting. "Or you can relax the consistency rules with READ COMMITTED or even READ UNCOMMITTED, in situations such as bulk reporting where precise consistency and repeatable results are less important than minimizing the amount of overhead for locking." (17.7.2.1)
- Serializable turns plain SELECTs into locking reads when autocommit is off. "This level is like REPEATABLE READ, but InnoDB implicitly converts all plain SELECT statements to SELECT ... FOR SHARE if autocommit is disabled." (SERIALIZABLE)
- Locking statements read the latest data, not the snapshot. "while the locking statements use the most recent state of the database to use locking." (REPEATABLE READ)

## Visuals worth redrawing

None.

## My notes

- curl with a default user agent got an error page; opened with browser
  headers.
- Hermitage classifies InnoDB's "repeatable read" as weaker than
  snapshot isolation (lost updates can happen); this page doesn't say so.

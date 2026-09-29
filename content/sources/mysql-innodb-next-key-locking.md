---
id: mysql-innodb-next-key-locking
title: "MySQL 8.4 Reference Manual, 17.7.4 Phantom Rows"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-next-key-locking.html
kind: docs
primary: true
---

## Summary

The MySQL 8.4 manual's page on phantom rows and how InnoDB's next-key
locks (a lock on an index record plus the gap before it) stop them for
locking reads.

## Key claims

- Phantom, defined. "The so-called phantom problem occurs within a transaction when the same query produces different sets of rows at different times." (17.7.4)
- Example: SELECT ... WHERE id > 100 FOR UPDATE on rows 90 and 102; without gap locks, another session inserts 101. "If you were to execute the same SELECT within the same transaction, you would see a new row with an id of 101 (a “phantom”) in the result set returned by the query." (17.7.4)
- InnoDB's fix is next-key locking. "To prevent phantoms, InnoDB uses an algorithm called next-key locking that combines index-row locking with gap locking." (17.7.4)
- A next-key lock is a record lock plus the gap before it. "That is, a next-key lock is an index-record lock plus a gap lock on the gap preceding the index record." (17.7.4)
- It lets you lock the absence of a row. "Thus, the next-key locking enables you to “lock” the nonexistence of something in your table." (17.7.4)
- Turning gap locking off brings phantoms back. "This may cause phantom problems because other sessions can insert new rows into the gaps when gap locking is disabled." (17.7.4)
- Row locks in InnoDB are locks on the index records a scan passes. "InnoDB performs row-level locking in such a way that when it searches or scans a table index, it sets shared or exclusive locks on the index records it encounters." (17.7.4)
- The scan can also lock the gap after the last record, as in the id > 100 example. "When InnoDB scans an index, it can also lock the gap after the last record in the index." (17.7.4)

## Visuals worth redrawing

- The id 90 / 102 index with the gap between them, and the insert of
  101 landing in it.

## My notes

None.

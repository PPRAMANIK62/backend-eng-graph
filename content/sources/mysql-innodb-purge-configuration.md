---
id: mysql-innodb-purge-configuration
title: "MySQL 8.4 Reference Manual, 17.8.9 Purge Configuration"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-purge-configuration.html
kind: docs
primary: true
---

## Summary

How InnoDB's purge threads remove delete-marked rows and old undo logs,
the history list, purge lag, and what a long-running transaction does to
it (MySQL 8.4). Read via the Internet Archive copy of the same URL,
because dev.mysql.com refused curl.

## Key claims

- A deleted row is physically removed only when its undo record is discarded, which is purge. "This removal operation, which only occurs after the row is no longer required for multi-version concurrency control (MVCC) or rollback, is called a purge." (17.8.9)
- Purge works through the history list of committed transactions' undo pages. "It parses and processes undo log pages from the history list, which is a list of undo log pages for committed transactions that is maintained by the InnoDB transaction system." (17.8.9)
- Purge runs in background threads. "Purge operations are performed in the background by one or more purge threads." (17.8.9)
- The purge lag is the length of that list, shown as History list length. "The purge lag is presented as the History list length value in the TRANSACTIONS section of SHOW ENGINE INNODB STATUS output." (17.8.9)
- There's no maximum purge lag by default. "The default value is 0, which means there is no maximum purge lag and no delay." (17.8.9, innodb_max_purge_lag)
- Long-running transactions, even read-only ones, make the history list grow. "The History list length is typically a low value, usually less than a few thousand, but a write-heavy workload or long running transactions can cause it to increase, even for transactions that are read only." (17.8.9)
- Because a REPEATABLE READ snapshot must keep returning the same result. "Consequently, the InnoDB multi-version concurrency control (MVCC) system must keep a copy of the data in the undo log until all transactions that depend on that data have completed." (17.8.9)
- Two examples: mysqldump --single-transaction under concurrent writes, and a SELECT with autocommit off and no COMMIT. "Running a SELECT query after disabling autocommit, and forgetting to issue an explicit COMMIT or ROLLBACK." (17.8.9)

## Visuals worth redrawing

None.

## My notes

- The InnoDB twin of Postgres's "long-running transaction holds back
  vacuum": here it's purge and the history list.

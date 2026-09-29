---
id: mysql-innodb-deadlocks
title: "MySQL 8.4 Reference Manual, 17.7.5 Deadlocks in InnoDB"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks.html
kind: docs
primary: true
---

## Summary

The MySQL 8.4 manual's overview of deadlocks in InnoDB: how they arise
(opposite lock orders, range and gap locks), how to make them rarer,
and that applications must retry.

## Key claims

- Deadlock, defined. "A deadlock is a situation in which multiple transactions are unable to proceed because each transaction holds a lock that is needed by another one." (17.7.5)
- Opposite orders cause them. "A deadlock can occur when transactions lock rows in multiple tables (through statements such as UPDATE or SELECT ... FOR UPDATE), but in the opposite order." (17.7.5)
- So can range and gap locks. "A deadlock can also occur when such statements lock ranges of index records and gaps, with each transaction acquiring some locks but not others due to a timing issue." (17.7.5)
- Advice: small transactions, same order, index the columns used in locking statements. "create indexes on the columns used in SELECT ... FOR UPDATE and UPDATE ... WHERE statements." (17.7.5)
- Isolation level doesn't change deadlock odds. "The possibility of deadlocks is not affected by the isolation level, because the isolation level changes the behavior of read operations, while deadlocks occur because of write operations." (17.7.5)
- Retries are always needed. "Thus, even if your application logic is correct, you must still handle the case where a transaction must be retried." (17.7.5)
- Where to see the last one. "To view the last deadlock in an InnoDB user transaction, use SHOW ENGINE INNODB STATUS." (17.7.5)

## Visuals worth redrawing

None.

## My notes

- The isolation-level claim sits oddly with gap locks, which only
  happen at REPEATABLE READ and above for locking reads.

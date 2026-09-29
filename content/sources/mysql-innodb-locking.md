---
id: mysql-innodb-locking
title: "MySQL 8.4 Reference Manual, 17.7.1 InnoDB Locking"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html
kind: docs
primary: true
---

## Summary

The MySQL 8.4 manual's list of InnoDB lock types: shared and exclusive
row locks, intention locks on tables, record locks, gap locks, next-key
locks, insert intention locks, AUTO-INC locks and spatial predicate
locks.

## Key claims

- Row locks come in S and X. "InnoDB implements standard row-level locking where there are two types of locks, shared (S) locks and exclusive (X) locks." (Shared and Exclusive Locks)
- Multiple granularity. "InnoDB supports multiple granularity locking which permits coexistence of row locks and table locks." (Intention Locks)
- Intention locks are table locks announcing future row locks. "Intention locks are table-level locks that indicate which type of lock (shared or exclusive) a transaction requires later for a row in a table." (Intention Locks)
- FOR SHARE takes IS, FOR UPDATE takes IX. "For example, SELECT ... FOR SHARE sets an IS lock, and SELECT ... FOR UPDATE sets an IX lock." (Intention Locks)
- The protocol. "Before a transaction can acquire a shared lock on a row in a table, it must first acquire an IS lock or stronger on the table." (Intention Locks)
- Compatibility matrix for X, IX, S, IS: IX is compatible with IX and IS; S with S and IS; X with nothing. (Intention Locks, matrix)
- Intention locks only block whole-table requests. "Intention locks do not block anything except full table requests (for example, LOCK TABLES ... WRITE)." (Intention Locks)
- Their purpose. "The main purpose of intention locks is to show that someone is locking a row, or going to lock a row in the table." (Intention Locks)
- A deadlock-causing request gets an error. "If a lock request conflicts with an existing lock and cannot be granted because it would cause deadlock, an error occurs." (Intention Locks)
- Record locks lock index records, even without a user index. "Record locks always lock index records, even if a table is defined with no indexes." (Record Locks)
- Gap lock, defined. "A gap lock is a lock on a gap between index records, or a lock on the gap before the first or after the last index record." (Gap Locks)
- Example: BETWEEN 10 and 20 FOR UPDATE blocks inserting 15 whether or not 15 exists. "prevents other transactions from inserting a value of 15 into column t.c1, whether or not there was already any such value in the column, because the gaps between all existing values in the range are locked." (Gap Locks)
- A unique-index lookup for one row needs no gap lock. "Gap locking is not needed for statements that lock rows using a unique index to search for a unique row." (Gap Locks)
- Gap locks only stop inserts and don't conflict with each other. "Gap locks in InnoDB are “purely inhibitive”, which means that their only purpose is to prevent other transactions from inserting to the gap." (Gap Locks)
- READ COMMITTED turns gap locking off for searches. "In this case, gap locking is disabled for searches and index scans and is used only for foreign-key constraint checking and duplicate-key checking." (Gap Locks)
- Next-key lock, defined. "A next-key lock is a combination of a record lock on the index record and a gap lock on the gap before the index record." (Next-Key Locks)
- For an index holding 10, 11, 13 and 20, next-key locks cover (negative infinity, 10], (10, 11], (11, 13], (13, 20] and (20, positive infinity). (Next-Key Locks)
- Used by default at REPEATABLE READ. "In this case, InnoDB uses next-key locks for searches and index scans, which prevents phantom rows" (Next-Key Locks)
- REPEATABLE READ is the default. "By default, InnoDB operates in REPEATABLE READ transaction isolation level." (Next-Key Locks)
- Two transactions can hold a gap lock on the same gap. "Gap locks can co-exist. A gap lock taken by one transaction does not prevent another transaction from taking a gap lock on the same gap." (Gap Locks)
- Insert intention locks let inserts into different spots of one gap proceed. "Separate transactions that attempt to insert values of 5 and 6, respectively, each lock the gap between 4 and 7 with insert intention locks prior to obtaining the exclusive lock on the inserted row, but do not block each other because the rows are nonconflicting." (Insert Intention Locks)

## Visuals worth redrawing

- The next-key intervals for the index 10, 11, 13, 20.

## My notes

- dev.mysql.com returned an error page to a browser user agent; fetched
  with curl's default user agent (same as other MySQL notes).

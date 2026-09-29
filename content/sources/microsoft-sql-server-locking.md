---
id: microsoft-sql-server-locking
title: Transaction locking and row versioning guide (SQL Server)
author: Microsoft
url: https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide
kind: docs
primary: true
---

## Summary

Microsoft's guide to locking in the SQL Server Database Engine (read
in the sql-server-ver17 view of the docs). Pessimistic and optimistic
concurrency control, lock granularity and hierarchies, lock modes
including intent and key-range locks, and lock escalation with its
thresholds.

## Key claims

- Pessimistic control, defined. "A system of locks prevents transactions from modifying data in a way that affects other transactions." (Types of concurrency)
- Pessimistic fits high contention. "This is called pessimistic control because it's typically used in systems where there's high contention for data, where the cost of protecting data with locks is less than the cost of rolling back transactions if concurrency conflicts occur." (Types of concurrency)
- Optimistic control, defined. "In optimistic concurrency control, transactions don't lock data when they read it. However, when a transaction updates data, the system checks to see if another transaction changed the data after it was read." (Types of concurrency)
- Optimistic fits low contention. "This is called optimistic because it's typically used in systems where there's low contention for data, and where the cost of occasionally rolling back a transaction is lower than the cost of locking data when read." (Types of concurrency)
- SERIALIZABLE keeps read and write locks to the end, plus range locks. "The Database Engine keeps read and write locks acquired on selected data until the end of the transaction. Range-locks are acquired when a SELECT operation uses a range WHERE clause to avoid phantom reads." (Database Engine isolation levels, SERIALIZABLE)
- Shared locks are released after the read below REPEATABLE READ. "Shared (S) locks on a resource are released as soon as the read operation completes, unless the transaction isolation level is set to REPEATABLE READ or higher, or a locking hint is used to retain the shared (S) locks for the duration of the transaction." (Shared locks)
- The granularity trade-off. "Locking at a smaller granularity, such as rows, increases concurrency but has a higher overhead because more locks must be held if many rows are locked." (Lock granularity and hierarchies)
- A read may take locks at several levels. "For example, to fully protect a read of an index, an instance of the Database Engine might have to acquire shared locks on rows and intent shared locks on the pages and table." (Lock granularity and hierarchies)
- Lockable resources run from RID and KEY (rows) through PAGE (8 KB), EXTENT, HoBT, TABLE, FILE, APPLICATION, METADATA, ALLOCATION_UNIT and DATABASE. (Lock granularity and hierarchies, table)
- Why intent locks help: only the table level needs checking. "This removes the requirement to examine every row or page lock on the table to determine if a transaction can lock the entire table." (Intent locks)
- Update (U) locks exist to stop the read-then-update deadlock: two transactions hold S on a row and both try to convert to X. "Prevents a common form of deadlock that occurs when multiple sessions are reading, locking, and potentially updating resources later." (Lock modes table, Update)
- Key-range locks prevent phantoms at SERIALIZABLE. "A key range lock satisfies this requirement by preventing other transactions from inserting new rows whose keys would fall in the range of keys read by the SERIALIZABLE transaction." (Key-range locking)
- Example: a range read BETWEEN 'AAA' AND 'CZZ' blocks inserts like 'ADG', 'BBD', 'CAL'. (Key-range locking)
- Escalation, defined. "Lock escalation is the process of converting many fine-grained locks into fewer coarse-grain locks, reducing system overhead while increasing the probability of concurrency contention." (Lock escalation)
- Escalation turns the table's intent lock into a full lock and drops the row and page locks. "To escalate locks, the Database Engine attempts to change the intent lock on the table to the corresponding full lock, for example, changing an intent exclusive (IX) lock to an exclusive (X) lock, or an intent shared (IS) lock to a shared (S) lock." (Lock escalation without optimized locking)
- Rows go straight to table, never to page. "The Database Engine doesn't escalate row or key-range locks to page locks, but escalates them directly to table locks." (same)
- Threshold: 5,000 locks by one statement on one table reference. "A single Transact-SQL statement acquires at least 5,000 locks on a single nonpartitioned table or index." (Lock escalation thresholds)
- If blocked, it retries every 1,250 new locks. "If locks can't be escalated because of lock conflicts, the Database Engine periodically triggers lock escalation at every 1,250 new locks acquired." (Lock escalation thresholds)
- Also triggered by memory: by default when lock objects use 24 percent of the engine's memory; a lock is about 100 bytes. "The data structure used to represent a lock is approximately 100 bytes long." (Escalation threshold for an instance)
- To avoid escalation, split big batches. "Break up large batch operations into several smaller operations." (Reduce locking and lock escalation); the example deletes old rows a few hundred at a time (DELETE TOP (500) in a loop).
- Table-lock hints cut lock count but block more. "Using this option, however, increases the problems of users blocking other users attempting to access the same data and shouldn't be used in systems with more than a few concurrent users." (Reduce locking and lock escalation)
- Optimized locking (newer versions) holds only a transaction ID lock to the end at READ COMMITTED, so escalation is rarer. "No row and page locks are held for the duration of the transaction, except for a single Transaction ID (TID) lock." (Lock escalation with optimized locking)

## Visuals worth redrawing

None worth copying; the lock compatibility tables are large.

## My notes

- Microsoft Learn pages have no author names; "Microsoft" as author.
- The URL had ?view=sql-server-ver17 when read.

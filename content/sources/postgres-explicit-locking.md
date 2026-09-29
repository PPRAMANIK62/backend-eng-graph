---
id: postgres-explicit-locking
title: "PostgreSQL documentation, 13.3 Explicit Locking"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/explicit-locking.html
kind: docs
primary: true
---

## Summary

The manual's list of Postgres lock modes (read at version 18). Eight
table-level modes that differ only in what they conflict with, which
commands take each, the conflict table, row-level locks, and how
deadlocks are handled.

## Key claims

- Commands take locks automatically. "most PostgreSQL commands automatically acquire locks of appropriate modes to ensure that referenced tables are not dropped or modified in incompatible ways while the command executes." (13.3)
- All the modes are table-level, despite the names. "Remember that all of these lock modes are table-level locks, even if the name contains the word “row”; the names of the lock modes are historical." (13.3.1)
- Modes differ only in what they conflict with. "The only real difference between one lock mode and another is the set of lock modes with which each conflicts" (13.3.1)
- SELECT takes ACCESS SHARE. "The SELECT command acquires a lock of this mode on referenced tables." (13.3.1, ACCESS SHARE)
- Writes take ROW EXCLUSIVE. "The commands UPDATE, DELETE, INSERT, and MERGE acquire this lock mode on the target table" (13.3.1, ROW EXCLUSIVE)
- ROW EXCLUSIVE doesn't conflict with itself, so writers don't block each other at the table level. "Conflicts with the SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, and ACCESS EXCLUSIVE lock modes." (13.3.1, ROW EXCLUSIVE)
- SHARE UPDATE EXCLUSIVE is taken by VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY and some ALTER TABLE forms. "Acquired by VACUUM (without FULL), ANALYZE, CREATE INDEX CONCURRENTLY, CREATE STATISTICS, COMMENT ON, REINDEX CONCURRENTLY, and certain ALTER INDEX and ALTER TABLE variants" (13.3.1, SHARE UPDATE EXCLUSIVE)
- Plain CREATE INDEX takes SHARE, which blocks writes. "Acquired by CREATE INDEX (without CONCURRENTLY)." (13.3.1, SHARE) and "This mode protects a table against concurrent data changes." (same)
- CREATE TRIGGER takes SHARE ROW EXCLUSIVE. "Acquired by CREATE TRIGGER and some forms of ALTER TABLE." (13.3.1, SHARE ROW EXCLUSIVE)
- ACCESS EXCLUSIVE conflicts with everything; many ALTER TABLE forms take it. "Many forms of ALTER INDEX and ALTER TABLE also acquire a lock at this level." (13.3.1, ACCESS EXCLUSIVE)
- ACCESS EXCLUSIVE means nobody else touches the table. "This mode guarantees that the holder is the only transaction accessing the table in any way." (13.3.1, ACCESS EXCLUSIVE)
- Only ACCESS EXCLUSIVE blocks a plain SELECT. "Only an ACCESS EXCLUSIVE lock blocks a SELECT (without FOR UPDATE/SHARE) statement." (13.3.1, Tip)
- Locks last until the transaction ends. "Once acquired, a lock is normally held until the end of the transaction." (13.3.1)
- Without a deadlock, a lock wait never ends by itself. "So long as no deadlock situation is detected, a transaction seeking either a table-level or row-level lock will wait indefinitely for conflicting locks to be released." (13.3.4)
- So long open transactions are bad. "This means it is a bad idea for applications to hold transactions open for long periods of time (e.g., while waiting for user input)." (13.3.4)
- There are eight table-level lock modes: ACCESS SHARE, ROW SHARE, ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE. (13.3.1, Table-Level Lock Modes and Table 13.2)
- A transaction never conflicts with itself. "(However, a transaction never conflicts with itself. For example, it might acquire ACCESS EXCLUSIVE lock and later acquire ACCESS SHARE lock on the same table.)" (13.3.1)
- Locks taken after a savepoint go away if you roll back to it. "But if a lock is acquired after establishing a savepoint, the lock is released immediately if the savepoint is rolled back to." (13.3.1)
- Row-level locks block only writers and lockers, not readers. "Row-level locks do not affect data querying; they block only writers and lockers to the same row." (13.3.2)
- FOR UPDATE blocks other writers and lockers of those rows until the transaction ends. "This prevents them from being locked, modified or deleted by other transactions until the current transaction ends." (13.3.2, FOR UPDATE)
- At Repeatable Read or Serializable, locking a row that changed since the transaction started is an error. "Within a REPEATABLE READ or SERIALIZABLE transaction, however, an error will be thrown if a row to be locked has changed since the transaction started." (13.3.2, FOR UPDATE)
- DELETE takes FOR UPDATE; an UPDATE of non-key columns takes FOR NO KEY UPDATE. "This lock mode is also acquired by any UPDATE that does not acquire a FOR UPDATE lock." (13.3.2, FOR NO KEY UPDATE)
- FOR KEY SHARE (taken by foreign key checks) blocks deletes and key changes but not other updates. "A key-shared lock blocks other transactions from performing DELETE or any UPDATE that changes the key values, but not other UPDATE, and neither does it prevent SELECT FOR NO KEY UPDATE, SELECT FOR SHARE, or SELECT FOR KEY SHARE." (13.3.2, FOR KEY SHARE)
- FOR UPDATE is also taken by DELETE and by an UPDATE of key columns. "The FOR UPDATE lock mode is also acquired by any DELETE on a row, and also by an UPDATE that modifies the values of certain columns." Those are columns "that have a unique index on them that can be used in a foreign key" (13.3.2, FOR UPDATE)
- FOR SHARE blocks writers and exclusive lockers, not other sharers. "A shared lock blocks other transactions from performing UPDATE, DELETE, SELECT FOR UPDATE or SELECT FOR NO KEY UPDATE on these rows, but it does not prevent them from performing SELECT FOR SHARE or SELECT FOR KEY SHARE." (13.3.2, FOR SHARE)
- FOR NO KEY UPDATE is FOR UPDATE minus blocking FOR KEY SHARE. "this lock will not block SELECT FOR KEY SHARE commands that attempt to acquire a lock on the same rows." (13.3.2, FOR NO KEY UPDATE)
- Row locks aren't kept in memory, so there's no limit on how many. "PostgreSQL doesn't remember any information about modified rows in memory, so there is no limit on the number of rows locked at one time." (13.3.2)
- But locking a row writes to disk. "However, locking a row might cause a disk write, e.g., SELECT FOR UPDATE modifies selected rows to mark them locked, and so will result in disk writes." (13.3.2)
- Page-level locks are short buffer locks, not something apps see. "These locks are released immediately after a row is fetched or updated." (13.3.3)
- Postgres detects deadlocks and aborts one transaction; which one is unpredictable. "(Exactly which transaction will be aborted is difficult to predict and should not be relied upon.)" (13.3.4)
- Row locks alone can deadlock: two transfers between accounts 11111 and 22222 in opposite orders. "Note that deadlocks can also occur as the result of row-level locks (and thus, they can occur even if explicit locking is not used)." (13.3.4)
- Best defence is a consistent lock order. "The best defense against deadlocks is generally to avoid them by being certain that all applications using a database acquire locks on multiple objects in a consistent order." (13.3.4)
- Take the strongest mode first. "One should also ensure that the first lock acquired on an object in a transaction is the most restrictive mode that will be needed for that object." (13.3.4)
- Otherwise retry. "If it is not feasible to verify this in advance, then deadlocks can be handled on-the-fly by retrying transactions that abort due to deadlocks." (13.3.4)
- Advisory locks: meaning defined by the app, not enforced. "These are called advisory locks, because the system does not enforce their use — it is up to the application to use them correctly." (13.3.5)
- Better than a flag column. "While a flag stored in a table could be used for the same purpose, advisory locks are faster, avoid table bloat, and are automatically cleaned up by the server at the end of the session." (13.3.5)
- Session-level advisory locks ignore transactions. "Unlike standard lock requests, session-level advisory lock requests do not honor transaction semantics: a lock acquired during a transaction that is later rolled back will still be held following the rollback, and likewise an unlock is effective even if the calling transaction fails later." (13.3.5)
- Transaction-level ones release at transaction end. "Transaction-level lock requests, on the other hand, behave more like regular lock requests: they are automatically released at the end of the transaction, and there is no explicit unlock operation." (13.3.5)
- A session that holds one can take it again even with others waiting. "If a session already holds a given advisory lock, additional requests by it will always succeed, even if other sessions are awaiting the lock" (13.3.5)
- Exhausting that memory stops all locking. "Care must be taken not to exhaust this memory or the server will be unable to grant any locks at all." (13.3.5)
- They share the lock table's memory, which caps how many you can hold. "This imposes an upper limit on the number of advisory locks grantable by the server, typically in the tens to hundreds of thousands depending on how the server is configured." (13.3.5)
- Held advisory locks are listed in pg_locks. "Like all locks in PostgreSQL, a complete list of advisory locks currently held by any session can be found in the pg_locks system view." (13.3.5)
- Common use: pessimistic locking in the style of flat-file systems. "For example, a common use of advisory locks is to emulate pessimistic locking strategies typical of so-called “flat file” data management systems." (13.3.5)
- With LIMIT, you can lock rows you didn't mean to. "In the above queries, the second form is dangerous because the LIMIT is not guaranteed to be applied before the locking function is executed." (13.3.5)

## Visuals worth redrawing

- Table 13.2, the conflict matrix of the eight modes.

## My notes

- The page does not describe the lock wait queue (that a waiting ACCESS
  EXCLUSIVE request makes later ACCESS SHARE requests wait too). That's
  in gocardless-zero-downtime-postgres-migrations.

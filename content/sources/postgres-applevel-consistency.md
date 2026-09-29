---
id: postgres-applevel-consistency
title: "PostgreSQL documentation, 13.4 Data Consistency Checks at the Application Level"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/applevel-consistency.html
kind: docs
primary: true
---

## Summary

The Postgres manual (read at version 18) on enforcing business rules in
your own code: why it's hard at Read Committed and Repeatable Read, how
Serializable makes it work with no extra effort, and how to use explicit
locks (SELECT FOR UPDATE, FOR SHARE, LOCK TABLE) when you can't use
Serializable.

## Key claims

- Read Committed makes rule checks hard. "It is very difficult to enforce business rules regarding data integrity using Read Committed transactions because the view of the data is shifting with each statement, and even a single statement may not restrict itself to the statement's snapshot if a write conflict occurs." (13.4)
- Repeatable Read has a stable view but read/write conflicts break checks. "While a Repeatable Read transaction has a stable view of the data throughout its execution, there is a subtle issue with using MVCC snapshots for data consistency checks, involving something known as read/write conflicts." (13.4)
- A reader that can't see a concurrent write appears to run first. "The reader then appears to have executed first regardless of which started first or which committed first." (13.4)
- Those orderings can form a cycle. "If the transaction which appears to have executed last actually commits first, it is very easy for a cycle to appear in a graph of the order of execution of the transactions." (13.4)
- At Serializable, nothing else is needed. "If the Serializable transaction isolation level is used for all writes and for all reads which need a consistent view of the data, no other effort is required to ensure consistency." (13.4.1)
- Retry automatically. "When using this technique, it will avoid creating an unnecessary burden for application programmers if the application software goes through a framework which automatically retries transactions which are rolled back with a serialization failure." (13.4.1)
- Serializable protection doesn't extend to hot standby or logical replicas. "This level of integrity protection using Serializable transactions does not yet extend to hot standby mode (Section 26.4) or logical replicas." (13.4.1, Warning)
- Without Serializable, lock explicitly. "When non-serializable writes are possible, to ensure the current validity of a row and protect it against concurrent updates one must use SELECT FOR UPDATE, SELECT FOR SHARE, or an appropriate LOCK TABLE statement." (13.4.2)
- FOR UPDATE locks only the returned rows. "(SELECT FOR UPDATE and SELECT FOR SHARE lock just the returned rows against concurrent updates, while LOCK TABLE locks the whole table.)" (13.4.2)
- The lock holds only until you commit; to really stop a later change you must update the row. "SELECT FOR UPDATE does not ensure that a concurrent transaction will not update or delete a selected row. To do that in PostgreSQL you must actually update the row, even if no values need to be changed." (13.4.2)
- At Repeatable Read, take locks before the snapshot is frozen. "A repeatable read transaction's snapshot is actually frozen at the start of its first query or data-modification command (SELECT, INSERT, UPDATE, DELETE, or MERGE), so it is possible to obtain locks explicitly before the snapshot is frozen." (13.4.2)
- A blocked updater goes ahead once the FOR UPDATE holder finishes, unless the holder actually updated the row. "SELECT FOR UPDATE temporarily blocks other transactions from acquiring the same lock or executing an UPDATE or DELETE which would affect the locked row, but once the transaction holding this lock commits or rolls back, a blocked transaction will proceed with the conflicting operation unless an actual UPDATE of the row was performed while the lock was held." (13.4.2)
- Relying on explicit locks: use Read Committed, or lock first at Repeatable Read. "Note also that if one is relying on explicit locking to prevent concurrent changes, one should either use Read Committed mode, or in Repeatable Read mode be careful to obtain locks before performing queries." (13.4.2)

- What FOR UPDATE blocks, and for how long. "SELECT FOR UPDATE temporarily blocks other transactions from acquiring the same lock or executing an UPDATE or DELETE which would affect the locked row, but once the transaction holding this lock commits or rolls back, a blocked transaction will proceed with the conflicting operation unless an actual UPDATE of the row was performed while the lock was held." (13.4.2)

## Visuals worth redrawing

None.

## My notes

- The "must actually update the row" point is about a lock outliving
  the transaction that took it; inside the transaction, FOR UPDATE does
  block other updaters until commit.

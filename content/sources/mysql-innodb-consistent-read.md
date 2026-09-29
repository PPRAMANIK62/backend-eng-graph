---
id: mysql-innodb-consistent-read
title: "MySQL 8.4 Reference Manual, 17.7.2.3 Consistent Nonlocking Reads"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html
kind: docs
primary: true
---

## Summary

How InnoDB's plain SELECT reads a snapshot, and the catch: UPDATE and
DELETE don't read from that snapshot, they act on the latest committed
rows.

## Key claims

- A consistent read shows a snapshot at a point in time. "A consistent read means that InnoDB uses multi-versioning to present to a query a snapshot of the database at a point in time." (17.7.2.3)
- At REPEATABLE READ the snapshot is fixed by the first read. "If the transaction isolation level is REPEATABLE READ (the default level), all consistent reads within the same transaction read the snapshot established by the first such read in that transaction." (17.7.2.3)
- The snapshot covers SELECT, not necessarily writes. "The snapshot of the database state applies to SELECT statements within a transaction, not necessarily to DML statements." (17.7.2.3)
- So an UPDATE can hit rows your SELECT couldn't see. "If you insert or modify some rows and then commit that transaction, a DELETE or UPDATE statement issued from another concurrent REPEATABLE READ transaction could affect those just-committed rows, even though the session could not query them." (17.7.2.3)
- For the latest state, use READ COMMITTED or a locking read. "If you want to see the “freshest” state of the database, use either the READ COMMITTED isolation level or a locking read:" (17.7.2.3)
- A consistent read takes no locks. "A consistent read does not set any locks on the tables it accesses, and therefore other sessions are free to modify those tables at the same time a consistent read is being performed on the table." (17.7.2.3)
- A transaction's own writes plus an old snapshot can show a state that never existed. "If other sessions simultaneously update the same table, the anomaly means that you might see the table in a state that never existed in the database." (17.7.2.3)

## Visuals worth redrawing

None.

## My notes

- This is the mechanism behind Hermitage's finding that MySQL's
  REPEATABLE READ doesn't prevent lost updates: the second UPDATE writes
  over the first instead of failing.

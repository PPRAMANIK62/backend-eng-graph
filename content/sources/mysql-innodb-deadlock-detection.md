---
id: mysql-innodb-deadlock-detection
title: "MySQL 8.4 Reference Manual, 17.7.5.2 Deadlock Detection"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlock-detection.html
kind: docs
primary: true
---

## Summary

How InnoDB (MySQL 8.4) finds deadlocks, picks a victim, where the
search gives up, and when you might turn detection off.

## Key claims

- On by default; InnoDB rolls back a transaction to break it. "When deadlock detection is enabled (the default), InnoDB automatically detects transaction deadlocks and rolls back a transaction or transactions to break the deadlock." (17.7.5.2)
- It picks the small one. "InnoDB tries to pick small transactions to roll back, where the size of a transaction is determined by the number of rows inserted, updated, or deleted." (17.7.5.2)
- Locks outside InnoDB's view (LOCK TABLES with autocommit on, other engines) can't be seen; use the timeout. "Resolve these situations by setting the value of the innodb_lock_wait_timeout system variable." (17.7.5.2)
- The search has a limit of 200 transactions. "A wait-for list that exceeds 200 transactions is treated as a deadlock and the transaction attempting to check the wait-for list is rolled back." (17.7.5.2)
- And a limit of 1,000,000 locks. "The same error may also occur if the locking thread must look at more than 1,000,000 locks owned by transactions on the wait-for list." (17.7.5.2)
- Detection can slow a busy server. "On high concurrency systems, deadlock detection can cause a slowdown when numerous threads wait for the same lock." (Disabling Deadlock Detection)
- Then a timeout may be cheaper. "At times, it may be more efficient to disable deadlock detection and rely on the innodb_lock_wait_timeout setting for transaction rollback when a deadlock occurs." (Disabling Deadlock Detection)
- The switch. "Deadlock detection can be disabled using the innodb_deadlock_detect variable." (Disabling Deadlock Detection)

## Visuals worth redrawing

None.

## My notes

- The parent page, 17.7.5 Deadlocks in InnoDB, was also opened: it says
  deadlocks aren't affected by the isolation level because they come
  from writes, and that you must still handle retries. Not given its
  own note.

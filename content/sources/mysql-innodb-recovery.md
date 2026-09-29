---
id: mysql-innodb-recovery
title: "InnoDB Recovery, MySQL 8.4 Reference Manual section 17.18.2"
author: Oracle (MySQL documentation team)
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-recovery.html
kind: docs
primary: true
---

## Summary

What InnoDB (MySQL 8.4) does when it restarts after a crash: find
tablespaces, apply the redo log before accepting connections, then roll
back incomplete transactions in a background thread while new work
runs. Also point-in-time recovery from the binary log.

## Key claims

- After a crash you just restart; InnoDB rolls forward and rolls back uncommitted work automatically. "InnoDB automatically checks the logs and performs a roll-forward of the database to the present. InnoDB automatically rolls back uncommitted transactions that were present at the time of the crash." (InnoDB Crash Recovery)
- Redo is applied before any connection is accepted. "Redo log application is performed during initialization, before accepting any connections." (InnoDB Crash Recovery)
- Rolling back an incomplete transaction can take three or four times as long as it ran. "The time it takes to roll back an incomplete transaction can be three or four times the amount of time a transaction is active before it is interrupted, depending on server load." (InnoDB Crash Recovery)
- Removing redo logs to speed up recovery is not recommended. "Removing redo logs to speed up recovery is not recommended, even if some data loss is acceptable." (InnoDB Crash Recovery)
- Rollback runs in a background thread alongside new transactions. "The rollback is performed by a background thread, executed in parallel with transactions from new connections." (InnoDB Crash Recovery)
- Until it finishes, new connections may hit lock conflicts with recovered transactions. "Until the rollback operation is completed, new connections may encounter locking conflicts with recovered transactions." (InnoDB Crash Recovery)
- Point-in-time recovery replays the binary log on top of a restored backup. "you can apply changes from the binary log that occurred after the backup was made." (Point-in-Time Recovery)

## Visuals worth redrawing

None.

## My notes

- Redo log capacity and checkpoint LSN are on the Redo Log page
  (17.6.5), opened but not given a note.

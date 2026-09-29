---
id: postgres-runtime-config-locks
title: "PostgreSQL documentation, 19.12 Lock Management"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-locks.html
kind: docs
primary: true
---

## Summary

The settings for the lock manager (read at version 18): deadlock_timeout,
max_locks_per_transaction and the predicate lock limits.

## Key claims

- deadlock_timeout is how long to wait before checking. "This is the amount of time to wait on a lock before checking to see if there is a deadlock condition." (deadlock_timeout)
- The check is expensive, so it's delayed. "The check for deadlock is relatively expensive, so the server doesn't run it every time it waits for a lock." (deadlock_timeout)
- Default one second. "The default is one second (1s), which is probably about the smallest value you would want in practice." (deadlock_timeout)
- Raise it on a busy server. "On a heavily loaded server you might want to raise it." (deadlock_timeout)
- Ideally longer than a typical transaction. "Ideally the setting should exceed your typical transaction time, so as to improve the odds that a lock will be released before the waiter decides to check for deadlock." (deadlock_timeout)
- It also sets when log_lock_waits logs. "When log_lock_waits is set, this parameter also determines the amount of time to wait before a log message is issued about the lock wait." (deadlock_timeout)
- The lock table limits objects, not rows. "This is not the number of rows that can be locked; that value is unlimited." (max_locks_per_transaction)
- Default 64 per process. "The default, 64, has historically proven sufficient, but you might need to raise this value if you have queries that touch many different tables in a single transaction, e.g., query of a parent table with many children." (max_locks_per_transaction)
- Predicate locks are promoted to a whole relation past a limit. "This controls how many pages or tuples of a single relation can be predicate-locked before the lock is promoted to covering the whole relation." (max_pred_locks_per_relation)
- The lock table is sized per server process. "The shared lock table has space for max_locks_per_transaction objects (e.g., tables) per server process or prepared transaction" (max_locks_per_transaction)
- Row predicate locks are promoted to the page first. "This controls how many rows on a single page can be predicate-locked before the lock is promoted to covering the whole page." (max_pred_locks_per_page)

## Visuals worth redrawing

None.

## My notes

- max_pred_locks_per_page (default 2) controls promotion from tuples to
  a page; not quoted here.

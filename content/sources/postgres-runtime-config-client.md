---
id: postgres-runtime-config-client
title: "PostgreSQL documentation, 19.11 Client Connection Defaults"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-client.html
kind: docs
primary: true
---

## Summary

The settings a session can change for itself (read at version 18).
Used here for `lock_timeout` and `statement_timeout`.

## Key claims

- lock_timeout aborts a statement that waits too long for a lock. "Abort any statement that waits longer than the specified amount of time while attempting to acquire a lock on a table, index, row, or other database object." (lock_timeout)
- The limit applies to each lock attempt, not the whole statement. "The time limit applies separately to each lock acquisition attempt." (lock_timeout)
- It covers implicit locks too, like the ones ALTER TABLE takes. "The limit applies both to explicit locking requests (such as LOCK TABLE, or SELECT FOR UPDATE without NOWAIT) and to implicitly-acquired locks." (lock_timeout)
- Both timeouts are off by default. "A value of zero (the default) disables the timeout." (lock_timeout and statement_timeout)
- statement_timeout limits total run time. "Abort any statement that takes more than the specified amount of time." (statement_timeout)
- idle_in_transaction_session_timeout ends sessions sitting idle inside a transaction. "Terminate any session that has been idle (that is, waiting for a client query) within an open transaction for longer than the specified amount of time." (idle_in_transaction_session_timeout)
- An open transaction blocks vacuum even without locks. "Even when no significant locks are held, an open transaction prevents vacuuming away recently-dead tuples that may be visible only to this transaction; so remaining idle for a long time can contribute to table bloat." (idle_in_transaction_session_timeout)
- transaction_timeout caps the whole transaction. "Terminate any session that spans longer than the specified amount of time in a transaction." (transaction_timeout)
- Not recommended server-wide. "Setting transaction_timeout in postgresql.conf is not recommended because it would affect all sessions." (transaction_timeout)
- Both are off by default. "A value of zero (the default) disables the timeout." (idle_in_transaction_session_timeout, transaction_timeout)
- An idle session outside a transaction costs little. "Unlike the case with an open transaction, an idle session without a transaction imposes no large costs on the server, so there is less need to enable this timeout than idle_in_transaction_session_timeout." (idle_session_timeout)
- The timeout exists partly so idle sessions don't sit on locks. "This option can be used to ensure that idle sessions do not hold locks for an unreasonable amount of time." (idle_in_transaction_session_timeout)

## Visuals worth redrawing

None.

## My notes

- Units default to milliseconds when none is given.

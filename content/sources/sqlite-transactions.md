---
id: sqlite-transactions
title: "SQLite, Transaction"
author: SQLite developers
url: https://www.sqlite.org/lang_transaction.html
kind: docs
primary: true
---

## Summary

SQLite's page on BEGIN, COMMIT, ROLLBACK and savepoints. Every access is
in a transaction; many readers but one writer at a time; DEFERRED,
IMMEDIATE and EXCLUSIVE transactions; what happens to a transaction
after certain errors.

## Key claims

- Nothing is read or written outside a transaction. "No reads or writes occur except within a transaction." (2)
- A statement outside BEGIN starts its own transaction, committed when it finishes. "Automatically started transactions are committed when the last SQL statement finishes." (2)
- BEGIN...COMMIT doesn't nest; savepoints do. "Transactions created using BEGIN...COMMIT do not nest." (2)
- Many readers, one writer. "SQLite supports multiple simultaneous read transactions coming from separate database connections, possibly in separate threads or processes, but only one simultaneous write transaction." (2.1)
- A read transaction that tries to write may fail to upgrade. "If some other database connection has already modified the database or is already in the process of modifying the database, then upgrading to a write transaction is not possible and the write statement will fail with SQLITE_BUSY." (2.1)
- The default BEGIN is DEFERRED: the transaction doesn't really start until the first access. "DEFERRED means that the transaction does not actually start until the database is first accessed." (2.2)
- BEGIN IMMEDIATE takes the write lock up front. "IMMEDIATE causes the database connection to start a new write immediately, without waiting for a write statement." (2.2)
- After some errors (disk full, I/O error, out of memory, interrupt) SQLite may undo only the statement or the whole transaction. "SQLite attempts to undo just the one statement it was working on and leave changes from prior statements within the same transaction intact and continue with the transaction." (3)
- BEGIN inside a transaction is an error. "An attempt to invoke the BEGIN command within a transaction will fail with an error, regardless of whether the transaction was started by SAVEPOINT or a prior BEGIN." (2)
- The errors that may undo only the statement are SQLITE_FULL, SQLITE_IOERR, SQLITE_NOMEM and SQLITE_INTERRUPT (listed as "database or disk full", "disk I/O error", "out of memory" and so on); sometimes the whole transaction goes instead. "it might be necessary for SQLite to rollback and cancel the entire transaction." (3)

## Visuals worth redrawing

None.

## My notes

- Compare with Postgres, where any error puts the whole block in an
  aborted state (postgres-tutorial-transactions).

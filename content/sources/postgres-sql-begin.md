---
id: postgres-sql-begin
title: "PostgreSQL documentation, BEGIN"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-begin.html
kind: docs
primary: true
---

## Summary

The reference page for BEGIN (read at version 18). Defines autocommit
mode, says why grouping statements is faster, and how BEGIN relates to
START TRANSACTION and savepoints.

## Key claims

- Without BEGIN, Postgres runs in autocommit mode: one transaction per statement, committed if it succeeds. "each statement is executed in its own transaction and a commit is implicitly performed at the end of the statement (if execution was successful, otherwise a rollback is done)." (Description)
- A transaction block is faster than many single-statement transactions, because each start and commit costs CPU and disk work. "Statements are executed more quickly in a transaction block, because transaction start/commit requires significant CPU and disk activity." (Description)
- Other sessions can't see the half-done state. "other sessions will be unable to see the intermediate states wherein not all the related updates have been done." (Description)
- BEGIN can set the isolation level, read/write mode and deferrable mode. "If the isolation level, read/write mode, or deferrable mode is specified, the new transaction has those characteristics, as if SET TRANSACTION was executed." (Description)
- BEGIN inside a transaction block only warns; nesting is done with savepoints. "To nest transactions within a transaction block, use savepoints (see SAVEPOINT)." (Notes)
- BEGIN is a Postgres extension; the standard spelling is START TRANSACTION. "It is equivalent to the SQL-standard command START TRANSACTION" (Compatibility)
- BEGIN inside an open block is only a warning. "Issuing BEGIN when already inside a transaction block will provoke a warning message." (Notes)

## Visuals worth redrawing

None.

## My notes

- "Significant CPU and disk activity" is not quantified here. The disk
  part is the commit's WAL flush (see write-ahead-log, group-commit).

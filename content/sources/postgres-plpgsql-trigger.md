---
id: postgres-plpgsql-trigger
title: "PostgreSQL documentation, 41.10 Trigger Functions (PL/pgSQL)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/plpgsql-trigger.html
kind: docs
primary: true
---

## Summary

How to write a trigger function in PL/pgSQL (read at version 18): the
special variables it gets (NEW, OLD, TG_OP and others), what to return,
and worked examples including an audit trigger that logs every change
to a second table.

## Key claims

- NEW holds the new row for inserts and updates. "new database row for INSERT/UPDATE operations in row-level triggers." (41.10.1, NEW)
- OLD holds the old row for updates and deletes. "old database row for UPDATE/DELETE operations in row-level triggers." (41.10.1, OLD)
- TG_OP says which operation fired it. "operation for which the trigger was fired: INSERT, UPDATE, DELETE, or TRUNCATE." (41.10.1, TG_OP)
- Example 41.4 records every change in an audit table. "This example trigger ensures that any insert, update or delete of a row in the emp table is recorded (i.e., audited) in the emp_audit table." (Example 41.4)
- A statement-level trigger with transition tables can be much faster for big statements. "This can be significantly faster than the row-trigger approach when the invoking statement has modified many rows." (Example 41.7)
- The return value of an AFTER row trigger is ignored. "The return value of a row-level trigger fired AFTER or a statement-level trigger fired BEFORE or AFTER is always ignored; it might as well be null." (41.10.1)

## Visuals worth redrawing

None.

## My notes

- The audit trigger is exactly the shape a change-capture trigger takes
  in pg-osc: operation type plus the row, written to a side table.

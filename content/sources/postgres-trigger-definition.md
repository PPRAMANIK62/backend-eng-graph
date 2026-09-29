---
id: postgres-trigger-definition
title: "PostgreSQL documentation, 37.1 Overview of Trigger Behavior"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/trigger-definition.html
kind: docs
primary: true
---

## Summary

How triggers work in Postgres (read at version 18): when they fire
(before, after, instead of), how often (per row or per statement), that
they run inside the same transaction as the write, and what a BEFORE
trigger can do with the row.

## Key claims

- A trigger runs a function automatically on a kind of operation. "A trigger is a specification that the database should automatically execute a particular function whenever a certain type of operation is performed." (37.1)
- Before or after insert, update, delete; per row or per statement. "On tables and foreign tables, triggers can be defined to execute either before or after any INSERT, UPDATE, or DELETE operation, either once per modified row, or once per SQL statement." (37.1)
- The trigger function takes no arguments and returns type trigger. "The trigger function must be declared as a function taking no arguments and returning type trigger." (37.1)
- Row-level AFTER triggers fire at the end of the statement. "Row-level BEFORE triggers fire immediately before a particular row is operated on, while row-level AFTER triggers fire at the end of the statement" (37.1)
- A trigger runs in the same transaction; an error rolls back both. "In all cases, a trigger is executed as part of the same transaction as the statement that triggered it, so if either the statement or the trigger causes an error, the effects of both will be rolled back." (37.1)
- A statement trigger fires even when no rows change. "In particular, a statement that affects zero rows will still result in the execution of any applicable per-statement triggers." (37.1)
- A BEFORE row trigger can replace the row being written. "For row-level INSERT and UPDATE triggers only, the returned row becomes the row that will be inserted or will replace the row being updated." (37.1)
- A BEFORE row trigger can skip the row by returning NULL. "It can return NULL to skip the operation for the current row." (37.1)
- Several triggers fire in name order. "If more than one trigger is defined for the same event on the same relation, the triggers will be fired in alphabetical order by trigger name." (37.1)
- AFTER triggers are for propagating changes to other tables; BEFORE is cheaper. "Row-level AFTER triggers are most sensibly used to propagate the updates to other tables, or make consistency checks against other tables." (37.1)
- Why BEFORE is cheaper. "If you have no specific reason to make a trigger BEFORE or AFTER, the BEFORE case is more efficient, since the information about the operation doesn't have to be saved until end of statement." (37.1)
- Triggers can fire other triggers, with no depth limit. "There is no direct limitation on the number of cascade levels." (37.1)
- Statement-level triggers can see all changed rows through transition tables. "But an AFTER STATEMENT trigger can request that transition tables be created to make the sets of affected rows available to the trigger." (37.1)
- An AFTER trigger sees the final value of the row. "an AFTER trigger can be certain it is seeing the final value of the row, while a BEFORE trigger cannot" (37.1)
- Avoiding infinite recursion is up to you. "It is the trigger programmer's responsibility to avoid infinite recursion in such scenarios." (37.1)

## Visuals worth redrawing

None.

## My notes

- CREATE TRIGGER itself takes a SHARE ROW EXCLUSIVE lock
  (postgres-explicit-locking).

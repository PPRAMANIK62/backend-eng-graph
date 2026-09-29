---
id: postgres-create-table
title: "PostgreSQL documentation, CREATE TABLE"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-createtable.html
kind: docs
primary: true
---

## Summary

The reference page for CREATE TABLE (read at version 18.6). Used here
for two constraint options: DEFERRABLE (check at commit instead of after
each statement) and NOT ENFORCED (declared but not checked).

## Key claims

- Non-deferrable constraints are checked after every command; deferrable ones can wait for commit. "A constraint that is not deferrable will be checked immediately after every command. Checking of constraints that are deferrable can be postponed until the end of the transaction (using the SET CONSTRAINTS command)." (DEFERRABLE)
- Only some constraint types can be deferred. "Currently, only UNIQUE, PRIMARY KEY, EXCLUDE, and REFERENCES (foreign key) constraints accept this clause. NOT NULL and CHECK constraints are not deferrable." (DEFERRABLE)
- Deferrable constraints can't be ON CONFLICT arbiters. "Note that deferrable constraints cannot be used as conflict arbiters in an INSERT statement that includes an ON CONFLICT clause." (DEFERRABLE)
- NOT ENFORCED means the database won't check it. "If the constraint is NOT ENFORCED, the database system will not check the constraint. It is then up to the application code to ensure that the constraints are satisfied." (ENFORCED / NOT ENFORCED)
- Useful as documentation. "NOT ENFORCED constraints can be useful as documentation if the actual checking of the constraint at run time is too expensive." (ENFORCED / NOT ENFORCED)
- Only foreign keys and CHECK. "This is currently only supported for foreign key and CHECK constraints." (ENFORCED / NOT ENFORCED)
- WITHOUT OVERLAPS makes a unique constraint check ranges for overlap, enforced like an exclusion constraint. "So for example UNIQUE (id, valid_at WITHOUT OVERLAPS) behaves like EXCLUDE USING GIST (id WITH =, valid_at WITH &&)." (UNIQUE ... table constraint)
- The planner may still rely on a NOT ENFORCED constraint. "The database system might still assume that the data actually satisfies the constraint for optimization decisions where this does not affect the correctness of the result." (ENFORCED / NOT ENFORCED)

## Visuals worth redrawing

None.

## My notes

- NOT ENFORCED arrived in PostgreSQL 18 (postgres-18-release-notes).

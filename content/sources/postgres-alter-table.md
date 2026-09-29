---
id: postgres-alter-table
title: "PostgreSQL documentation, ALTER TABLE"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-altertable.html
kind: docs
primary: true
---

## Summary

The reference page for ALTER TABLE (read at version 18.6). For
constraints: adding one scans the table under a lock, and NOT VALID plus
VALIDATE CONSTRAINT splits that into a quick add and a later check that
doesn't block writes.

## Key claims

- NOT VALID works for foreign keys, checks and not-null. "the option NOT VALID, which is currently only allowed for foreign-key, CHECK, and not-null constraints." (ADD table_constraint)
- Normally adding a constraint scans the whole table. "Normally, this form will cause a scan of the table to verify that all existing rows in the table satisfy the new constraint." (ADD table_constraint)
- A NOT VALID constraint still applies to new writes. "The constraint will still be applied against subsequent inserts or updates" (ADD table_constraint)
- VALIDATE CONSTRAINT checks old rows later. "This form validates a foreign key, check, or not-null constraint that was previously created as NOT VALID, by scanning the table to ensure there are no rows for which the constraint is not satisfied." (VALIDATE CONSTRAINT)
- The scan blocks other updates while it runs. "Scanning a large table to verify new foreign-key, check, or not-null constraints can take a long time, and other updates to the table are locked out until the ALTER TABLE ADD CONSTRAINT command is committed." (Notes)
- Validation takes a weaker lock. "Hence, validation acquires only a SHARE UPDATE EXCLUSIVE lock on the table being altered." (Notes)
- NOT VALID also lets you stop new bad rows while old ones are cleaned up. "Once the constraint is in place, no new violations can be inserted, and the existing problems can be corrected at leisure until VALIDATE CONSTRAINT finally succeeds." (Notes)
- Adding a CHECK or NOT NULL scans but doesn't rewrite. "Adding a CHECK or NOT NULL constraint requires scanning the table to verify that existing rows meet the constraint, but does not require a table rewrite." (Notes)
- ALTER TABLE takes ACCESS EXCLUSIVE unless a subform says otherwise, and the strictest subcommand wins. "An ACCESS EXCLUSIVE lock is acquired unless explicitly noted. When multiple subcommands are given, the lock acquired will be the strictest one required by any subcommand." (Description)
- ADD FOREIGN KEY takes SHARE ROW EXCLUSIVE, on both tables. "Note that ADD FOREIGN KEY also acquires a SHARE ROW EXCLUSIVE lock on the referenced table, in addition to the lock on the table on which the constraint is declared." (ADD table_constraint)
- A non-volatile default is stored in the catalog; no rewrite. "The value will be only applied when the table is rewritten, making the ALTER TABLE very fast even on large tables." (Notes)
- Volatile defaults and some column kinds force a rewrite. "Adding a column with a volatile DEFAULT (e.g., clock_timestamp()), a stored generated column, an identity column, or a column with a domain data type that has constraints will cause the entire table and its indexes to be rewritten." (Notes)
- Changing a column type usually rewrites table and indexes. "Changing the type of an existing column will normally cause the entire table and its indexes to be rewritten." (Notes)
- Except when the old type is binary coercible and USING doesn't change the data; text to varchar needs no index rebuild. "a column can be changed from text to varchar (or vice versa) without rebuilding the indexes because these data types sort identically." (Notes)
- Rewrites can take long and need double the disk. "Table and/or index rebuilds may take a significant amount of time for a large table, and will temporarily require as much as double the disk space." (Notes)
- SET NOT NULL scans the table unless a valid CHECK already proves it. "if a valid CHECK constraint exists (and is not dropped in the same command) which proves no NULL can exist, then the table scan is skipped." (SET/DROP NOT NULL)
- DROP COLUMN only hides the column. "The DROP COLUMN form does not physically remove the column, but simply makes it invisible to SQL operations." (Notes)
- Rewrites are not MVCC-safe. "The rewriting forms of ALTER TABLE are not MVCC-safe." (Notes)
- Before PostgreSQL 11, any DEFAULT forced a rewrite. "Adding a column with a DEFAULT clause or changing the type of an existing column will require the entire table and its indexes to be rewritten." (Notes, PostgreSQL 10 version of this page, https://www.postgresql.org/docs/10/sql-altertable.html)
- PostgreSQL 11 introduced the stored non-volatile default. "When a column is added with ADD COLUMN and a non-volatile DEFAULT is specified, the default is evaluated at the time of the statement and the result stored in the table's metadata." (Notes, PostgreSQL 11 version, https://www.postgresql.org/docs/11/sql-altertable.html)
- In PostgreSQL 17, NOT VALID was only for foreign keys and CHECK. "which is currently only allowed for foreign key and CHECK constraints." (ADD table_constraint, PostgreSQL 17 version, https://www.postgresql.org/docs/17/sql-altertable.html)
- Validation doesn't lock out concurrent updates. "The validation step does not need to lock out concurrent updates, since it knows that other transactions will be enforcing the constraint for rows that they insert or update; only pre-existing rows need to be checked." (Notes)
- After a rewrite, older snapshots see the table as empty. "After a table rewrite, the table will appear empty to concurrent transactions, if they are using a snapshot taken before the rewrite occurred." (Notes)

## Visuals worth redrawing

None.

## My notes

- The lock levels and which forms rewrite the table belong to `ddl-locks`;
  `constraints` only needs NOT VALID / VALIDATE.

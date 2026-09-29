---
id: ankane-strong-migrations
title: Strong Migrations (README)
author: Andrew Kane
url: https://github.com/ankane/strong_migrations
kind: code
primary: true
---

## Summary

A Rails gem (v2.8.0 when read) that refuses to run migrations it knows
are dangerous on Postgres, MySQL and MariaDB, and prints the safe
recipe instead. The README is a catalogue of unsafe schema changes and
their multi-step replacements.

## Key claims

- What counts as dangerous. "Blocks reads or writes for more than a few seconds (after a lock is acquired)" / "Has a good chance of causing application errors" (How It Works)
- Dropping a column the ORM still caches causes errors until restart. "Active Record caches database columns at runtime, so if you drop a column, it can cause exceptions until your app reboots." (Removing a column)
- The safe drop: tell the ORM to ignore the column, deploy, then drop it. "Tell Active Record to ignore the column from its cache" (Removing a column, Good, step 1)
- Renaming an in-use column breaks the app. "Renaming a column that’s in use will cause errors in your application." (Renaming a column)
- The safe rename is six steps: new column, write both, backfill, move reads, stop writing old, drop old. "Backfill data from the old column to the new column" (Renaming a column, step 3)
- Backfilling in the migration's transaction keeps the table locked. "backfilling in the same transaction that alters a table keeps the table locked for the"... "duration of the backfill" (Backfilling data; the second part is link text)
- Safe backfills: batch, throttle, no wrapping transaction. "There are three keys to backfilling safely: batching, throttling, and running it outside a transaction." (Backfilling data)
- SET NOT NULL blocks while every row is checked. "In Postgres, setting `NOT NULL` on an existing column blocks reads and writes while every row is checked." (Setting NOT NULL on an existing column)
- The fix: a CHECK constraint, validated separately, then SET NOT NULL. "Once the check constraint is validated, you can safely set `NOT NULL` on the column and drop the check constraint." (Setting NOT NULL on an existing column)
- Short lock timeout, long statement timeout for migrations. "It’s extremely important to set a short lock timeout for migrations. This way, if a migration can’t acquire a lock in a timely manner, other statements won’t be stuck behind it." (Migration Timeouts)
- Its example values are 10 seconds and 1 hour. "StrongMigrations.lock_timeout = 10.seconds" (Migration Timeouts)
- Optional retries on lock timeout, experimental. "There’s the option to automatically retry statements for migrations when the lock timeout is reached." (Lock Timeout Retries)

## Visuals worth redrawing

None.

## My notes

- The unsafe-operations list is Rails-flavoured but the Postgres
  reasons match the ALTER TABLE and CREATE INDEX docs.

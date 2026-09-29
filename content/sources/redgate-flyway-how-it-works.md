---
id: redgate-flyway-how-it-works
title: How Flyway works (Getting started with Flyway)
author: Redgate
url: https://documentation.red-gate.com/fd/how-flyway-works-184127223.html
kind: docs
primary: true
---

## Summary

Flyway's own short explanation of versioned migrations: a history table
in the database, migration files found on disk, applied in version
order, and only the pending ones run.

## Key claims

- On an empty database Flyway creates its history table. "Flyway will try to locate the schema history table in the database. Since it is empty, Flyway won't find it and will create it instead." (How Flyway works)
- The table tracks changes. "This table is used to track the changes to the database." (How Flyway works)
- Migrations are applied in version order. "The migrations are applied in order based on their version number" (How Flyway works)
- Files are compared against the table; older versions are skipped by default. "If their version number is lower than the table's current version, they are ignored by default." (How Flyway works)
- Pending migrations are the ones on disk that haven't run. "The remaining migrations are the pending migrations: available, but not applied." (How Flyway works)
- Both schema and data changes are migrations. "Every time you need to update the database, whether structure (DDL) or data (DML), simply create a new migration." (How Flyway works)
- The history table is called flyway_schema_history by default. "You now have a database with a single empty table called flyway_schema_history by default" (How Flyway works)

## Visuals worth redrawing

- The page's diagrams of the history table filling up as versions are
  applied.

## My notes

- The companion page "Why database migrations" lists the goals: recreate
  a database from scratch, know what state it's in, move between
  versions deterministically. Research only.

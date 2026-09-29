---
id: shayonj-pg-osc
title: "pg-osc: online schema change for Postgres (README)"
author: Shayon Mukherjee
url: https://github.com/shayonj/pg-osc
kind: code
primary: true
---

## Summary

The README of pg-online-schema-change (v0.9.10 when read), a
shadow-table tool for Postgres modelled on pt-online-schema-change and
pg_repack. A trigger writes every change to an audit table; after the
copy, the audit rows are replayed, then the tables are swapped under a
brief exclusive lock.

## Key claims

- The approach. "it creates a shadow table that looks structurally the same as the primary table, performs the schema change on the shadow table, copies contents from the primary table to the shadow table and swaps the table names in the end while preserving all changes to the primary table using triggers (via audit table)." (intro)
- Needs a primary key to identify rows during replay. "This is because - currently there is no other way to uniquely identify rows during replay." (Few things to keep in mind)
- Takes ACCESS EXCLUSIVE twice: to add the trigger, and to swap. "`pg-osc` will acquire `ACCESS EXCLUSIVE` lock on the parent table twice during the operation." (Few things to keep in mind)
- Needs disk for a second copy. "Due to the nature of duplicating a table, there needs to be enough space on the disk to support the operation." (Few things to keep in mind)
- Foreign keys re-added NOT VALID, then validated. "Foreign keys are dropped & re-added to referencing tables with a `NOT VALID`. A follow on `VALIDATE CONSTRAINT` is run." (Few things to keep in mind)
- The steps: audit table, trigger, shadow table, copy, build indexes, replay. "Replay all changes accumulated in the audit table against the shadow table." (How does it work, step 6)
- Swap once about 20 rows are left to replay. "Once the delta (remaining rows) is ~20 rows, acquire an `ACCESS EXCLUSIVE` lock against the parent table within a transaction" (How does it work, step 7)
- Runs ANALYZE on the new table after the swap. "Runs `ANALYZE` on the new table." (How does it work, step 8)
- Can kill competing backends to get its lock. "Kill other competing queries/backends when trying to acquire lock for the shadow table creation and swap." (Usage, --kill-backends)
- In the swap transaction it renames the tables and re-creates referencing foreign keys NOT VALID. "update references in other tables (FKs) by dropping and re-creating the FKs with a `NOT VALID`." (How does it work, step 7)

## Visuals worth redrawing

- docs/how-it-works.png: primary, audit and shadow tables with the
  numbered steps.

## My notes

- The README says ACCESS EXCLUSIVE for adding the trigger; the Postgres
  docs say CREATE TRIGGER needs only SHARE ROW EXCLUSIVE. pg-osc
  probably locks explicitly; the README doesn't say why.
- Replay batch default 1000 rows (--pull-batch-count), swap threshold
  default 20 (--delta-count).

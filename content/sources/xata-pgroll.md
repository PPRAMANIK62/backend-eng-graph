---
id: xata-pgroll
title: "pgroll: zero-downtime, reversible schema migrations for Postgres (README and docs)"
author: Xata
url: https://github.com/xataio/pgroll
kind: code
primary: true
---

## Summary

The pgroll repository (v0.16.3 when read): README, docs/concepts.md,
docs/why-use-pgroll.md, docs/cli/start.mdx and docs/cli/README.md.
pgroll runs expand/contract for you on Postgres, and serves the old and
new schema at the same time through views, one Postgres schema per
version.

## Key claims

- Old and new schema versions work at once. "safe and reversible schema migrations for PostgreSQL by serving multiple schema versions simultaneously." (README)
- Postgres 14 or later. "Works with Postgres 14.0 or later." (README, Features)
- Versions are views. "`pgroll` works by creating virtual schemas by using views on top of the physical tables." (README, How pgroll works)
- Breaking column changes: new column, backfill, triggers both ways. "When a breaking change is required on a column, it will create a new column in the physical schema, and backfill it from the old column. Also, configure triggers to make sure all writes to the old/new column get propagated to its counterpart during the whole active migration period." (README, How pgroll works)
- Two phases: start (additive only) and complete (removals). "During the migration start phase, `pgroll` will perform only additive changes to the database schema." (concepts.md)
- Complete breaks the old version. "During the complete phase `pgroll` will perform all non-additive changes to the database schema." (concepts.md)
- One Postgres schema of views per migration. "This is achieved by creating a new Postgres schema for each migration that is applied to the database." (concepts.md)
- A rename is just a view with the new name until complete. "a rename column migration will create a new schema containing a view on the underlying table with the new column name." (concepts.md)
- Migrations are declarative so the tool controls locking. "ensuring that any locks required on the affected objects are held for the shortest possible time." (why-use-pgroll.md)
- Backfills run in batches, 1000 rows by default. "`--backfill-batch-size`: Number of rows backfilled in each batch (default: 1000)" (cli/start.mdx)
- DDL runs with a lock_timeout of 500 ms by default. "The Postgres `lock_timeout` value to use for all `pgroll` DDL operations, specified in milliseconds (default `500`)." (cli/README.md)

## Visuals worth redrawing

- docs/img/migration-schemas: two versioned schemas of views over one
  physical table.

## My notes

- pgroll is not a shadow-table tool: it changes the real table in place
  (additively) and hides the difference behind views.

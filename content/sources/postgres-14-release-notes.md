---
id: postgres-14-release-notes
title: "PostgreSQL 14 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/release/14.0/
kind: docs
primary: true
---

## Summary

Release notes for PostgreSQL 14.0 (2021). Used for one change: extended
statistics can be collected on expressions, not only on plain columns.

## Key claims

- Statistics on expressions, for better plans. "Extended statistics can now be collected on expressions, allowing better planning results for complex queries." (E.25.1 Overview)
- Before, only columns. "This allows statistics on a group of expressions and columns, rather than only columns like previously." (E.25.3.1.4 Optimizer)

## Visuals worth redrawing

None.

## My notes

- Whether statistics on `doc->>'field'` fix the jsonb estimate problem
  in heap-avoid-jsonb-2016 is not shown here; it's a lead, not a claim.

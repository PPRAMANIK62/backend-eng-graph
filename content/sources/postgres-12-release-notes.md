---
id: postgres-12-release-notes
title: "PostgreSQL 12 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/release/12.0/
kind: docs
primary: true
---

## Summary

Release notes for PostgreSQL 12.0 (2019). Used for one change: CTEs
became inlinable, where before they were always computed separately.

## Key claims

- CTE inlining is a headline feature of 12. "Automatic (but overridable) inlining of common table expressions (CTEs)" (E.23.1 Overview)
- The conditions for inlining. "Specifically, CTEs are automatically inlined if they have no side-effects, are not recursive, and are referenced only once in the query." (E.23.3.1.3 Optimizer)
- The keywords to control it. "Inlining can be prevented by specifying MATERIALIZED, or forced for multiply-referenced CTEs by specifying NOT MATERIALIZED." (E.23.3.1.3 Optimizer)
- Before 12, CTEs were never inlined. "Previously, CTEs were never inlined and were always evaluated before the rest of the query." (E.23.3.1.3 Optimizer)

## Visuals worth redrawing

None.

## My notes

- This is why older advice calls a CTE an "optimization fence"; that
  advice predates 12.

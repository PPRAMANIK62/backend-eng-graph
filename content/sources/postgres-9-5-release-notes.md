---
id: postgres-9-5-release-notes
title: "PostgreSQL 9.5 release notes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/release/9.5.0/
kind: docs
primary: true
---

## Summary

Release notes for PostgreSQL 9.5.0 (2016). Relevant here: SKIP LOCKED
was added to SELECT in this release.

## Key claims

- SKIP LOCKED arrived in 9.5. "Add SELECT option SKIP LOCKED to skip locked rows (Thomas Munro)" (E.26.3.3 Queries)
- The release is 9.5.0, released in 2016 (release date line at the top of the page).
- Row-level security arrived in 9.5, with CREATE/ALTER/DROP POLICY. "This feature allows row-by-row control over which users can add, modify, or even see rows in a table." (E.26.3.5 Object Manipulation, "Add row-level security control")

## Visuals worth redrawing

None.

## My notes

- NOWAIT is older; this page doesn't say when it arrived.

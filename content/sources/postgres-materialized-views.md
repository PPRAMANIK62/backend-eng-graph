---
id: postgres-materialized-views
title: Materialized Views (PostgreSQL 18 documentation)
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/rules-materializedviews.html
kind: docs
primary: true
---

## Summary

Section 39.3 of the PostgreSQL 18 manual: a materialized view stores a
query's result like a table and is refreshed on demand. Examples: a
nightly sales summary, and a local indexed copy of foreign data.

## Key claims

- A materialized view persists a query's result in table form. "Materialized views in PostgreSQL use the rule system like views do, but persist the results in a table-like form." (39.3)
- It can't be updated directly; the stored query regenerates it. "are that the materialized view cannot subsequently be directly updated and that the query used to create the materialized view is stored in exactly the same way that a view's query is stored" (39.3)
- Faster to read, but not always current. "While access to the data stored in a materialized view is often much faster than accessing the underlying tables directly or through a view, the data is not always current; yet sometimes current data is not needed." (39.3)
- Example: a sales summary for a dashboard, refreshed by a nightly job. "A job could be scheduled to update the statistics each night using this SQL statement:" (39.3)
- You can index a materialized view. "Notice we are also exploiting the ability to put an index on the materialized view" (39.3)

## Visuals worth redrawing

None.

## My notes

- The page's timings (file_fdw vs materialized view) are the docs'
  example on their machine, not something to quote as a benchmark.

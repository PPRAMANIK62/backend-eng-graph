---
id: heap-avoid-jsonb-2016
title: When To Avoid JSONB In A PostgreSQL Schema
author: Dan Robinson (Heap)
url: https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema
kind: blog
primary: false
---

## Summary

A 2016 post from Heap, a company that stores customer-defined event
properties in jsonb. Two hidden costs of putting a whole table in a
jsonb column: the planner has no statistics on fields inside it, and
every row stores every key name. The numbers come from the author's
laptop on the Postgres of that time.

## Key claims

- jsonb arrived in Postgres 9.4. "PostgreSQL introduced the JSONB type in 9.4 with considerable celebration." (intro)
- The tempting pattern: a properties column for everything. "just add a properties column to the end of your table for all the other attributes you might want to store down the road" (intro)
- Postgres keeps no statistics on values inside jsonb. "PostgreSQL doesn’t know how to keep statistics on the values of fields within JSONB columns." (Hidden Cost #1)
- So it falls back to a fixed guess of 0.1%. "so it relies on a hardcoded estimate of 0.1%." (Hidden Cost #1)
- In his test the bad estimate picked a nested loop; the jsonb query took 584 s vs about 300 ms for the column version. "The performance is dramatically worse — a whopping 584 seconds on my laptop, about 2000x slower" (Hidden Cost #1)
- The column version, for comparison. "The execution is fast — about 300 ms on my machine." (Hidden Cost #1)
- Heap had to turn off nested loops globally in production. "the only way to get around them was to disable nested loops entirely as a join option, with a global setting of enable_nestloop = off." (Hidden Cost #1)
- Mainly a risk for analytical queries, not key/document lookups. "This probably won’t bite you in a key-value / document-store workload, but it’s easy to run into this if you’re using JSONB along with analytical queries." (Hidden Cost #1)
- Key names are stored in every row, with no deduplication. "PostgreSQL doesn’t do anything clever to deduplicate commonly occurring keys." (Hidden Cost #2)
- His test table: 79 MB as columns vs 164 MB as jsonb. "the initial non-JSONB version of our table takes up 79 mb of disk space, whereas the JSONB variant takes 164 mb" (Hidden Cost #2)
- At Heap, pulling 45 common fields into columns saved about 30% of disk. "we found a disk space savings of about 30% by pulling 45 commonly used fields out of JSONB and into first-class columns." (Hidden Cost #2)
- jsonb is a good fit for many optional values; common fields should be columns. "For datasets with many optional values, it is often impractical or impossible to include each one as a table column. In cases like these, JSONB can be a great fit" (conclusion)

## Visuals worth redrawing

None.

## My notes

- Old (Postgres 9.x era). PostgreSQL 14 (2021) added statistics on
  expressions (postgres-14-release-notes), which is a possible fix for
  cost #1 that didn't exist then. Not tested here.

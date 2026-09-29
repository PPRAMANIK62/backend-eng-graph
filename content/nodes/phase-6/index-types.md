---
id: index-types
title: Index types
depth: short
phase: 6
note: >-
  B-tree, hash, GIN, GiST, BRIN: what each is for in Postgres.
needs: [indexes]
leads_to: [full-text-search, jsonb]
compare_with: []
---

# Index types

Postgres ships six kinds of index: B-tree, hash, GiST, SP-GiST, GIN and
BRIN. Each is a different data structure built for a different kind of
question. Most of the time the default B-tree is right, and knowing the
other five tells you when it isn't.

## Picking by the question you ask

`CREATE INDEX` makes a B-tree unless you say otherwise with `USING`:

```sql
CREATE INDEX ON events USING brin (created_at);
```

What decides the type is the operator in your `WHERE` clause. An index
only helps conditions whose operator it supports.

| Type | Good for | Example condition |
|---|---|---|
| B-tree | equality and ranges on anything sortable; sorted output | `id = 7`, `price BETWEEN 10 AND 20`, `name LIKE 'Ad%'` |
| Hash | equality only | `token = '...'` |
| GiST | geometry, nearest-neighbour search | `location <-> point '(1,2)'` in `ORDER BY`, overlap `&&` |
| SP-GiST | space-partitioned shapes: quadtrees, k-d trees, tries | points, prefixes |
| GIN | values with many parts: arrays, JSONB, full-text documents | `tags @> '{sale}'` |
| BRIN | huge tables where values follow the physical row order | `created_at > ...` on an append-only log |

**B-tree** is the general-purpose one, described in [[indexes]]. It
handles `=`, `<`, `<=`, `>`, `>=`, and anything built from them
(`BETWEEN`, `IN`), plus `IS NULL`. It serves `LIKE` only when the pattern
is anchored at the start: `'Ad%'` yes, `'%da'` no. And it can hand back
rows already sorted.

**Hash** stores only a 32-bit hash code of each value, so it can answer
`=` and nothing else. No ranges, no sorting.

**GiST and SP-GiST** aren't single data structures but frameworks for
building search trees over things that don't sort in a line, such as shapes and points. GiST can also find nearest neighbours, as in "the ten
places closest to this point" with `ORDER BY location <-> point`.
SP-GiST is for unbalanced structures like quadtrees and tries.

**GIN** is an inverted index: it keeps one entry per *component* of a
value, such as each element of an array or each word in a document, and
lists the rows that contain it. That makes "which rows contain this
element?" fast. Postgres ships GIN support for arrays, [[jsonb]] and the
`tsvector` type used in [[full-text-search]].

**BRIN** (block range index) doesn't index rows at all. For each run of
adjacent table pages it stores a summary, such as the minimum and
maximum value. A query skips every run whose range can't match, then
rechecks the rows in the runs that might. It's tiny, but it only works
when the column's values follow the physical order of the rows, like an
insert timestamp in a table that only grows. On a column with values in
random order, every range overlaps every query and nothing gets skipped.

## Where it gets tricky

**GIN is expensive to write.** One row with many components means many
index inserts. GIN softens this by queueing new entries in an unsorted
pending list and merging them later, but then searches have to scan the
pending list too, and the merge can land on one unlucky write. For big
bulk loads, dropping the GIN index and rebuilding it afterwards is often
faster.

**BRIN is lossy by design.** It returns candidate pages, not rows, and
Postgres rechecks every row in them. Smaller ranges (`pages_per_range`)
make it more precise and bigger.

**Old advice about hash indexes is out of date.** Before PostgreSQL 10
(2017), hash indexes weren't written to the [[write-ahead-log]], so they
weren't crash-safe or [[replication|replicated]], and Postgres issued a warning about
using them. Version 10 fixed that. They're a real option now for
equality lookups, though a B-tree handles equality too, plus ranges and
sorting.

**Answering from the index alone depends on the type.** Whether a query
can skip the table entirely is a separate question, covered in
[[covering-indexes]].

## What this means when you build

- Start with a B-tree. Switch only when the operator you need isn't
  one it supports.
- Arrays, JSONB containment and full-text search: GIN, and budget for
  slower writes.
- Geometry, ranges, "nearest to": GiST.
- A huge, append-only table filtered by time: try BRIN before a B-tree
  that might be many times its size.
- `LIKE '%term%'` doesn't use a B-tree; that's a job for
  [[full-text-search]] or another index type.

## Further reading

- [PostgreSQL documentation, 11.2 Index Types](https://www.postgresql.org/docs/current/indexes-types.html), PostgreSQL Global Development Group, version 18. Each type and the operators it supports.
- [PostgreSQL documentation, 65.5 BRIN Indexes](https://www.postgresql.org/docs/current/brin.html), PostgreSQL Global Development Group, version 18. How block range summaries work and when they help.
- [PostgreSQL documentation, 65.4 GIN Indexes](https://www.postgresql.org/docs/current/gin.html), PostgreSQL Global Development Group, version 18. Why GIN writes are slow, and the pending list.
- [PostgreSQL 10 release notes](https://www.postgresql.org/docs/release/10.0/), PostgreSQL Global Development Group, 2017. Hash indexes become WAL-logged and crash-safe.

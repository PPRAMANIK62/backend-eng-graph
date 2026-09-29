---
id: partial-indexes
title: Partial indexes
depth: short
phase: 6
note: >-
  Indexing only the rows a query cares about.
needs: [indexes]
leads_to: []
compare_with: [table-partitioning]
---

# Partial indexes

A partial index covers only the rows that match a condition you give
it, written as a `WHERE` clause on `CREATE INDEX`. If your queries only
ever look for a small slice of a table, you can index just that slice.
The index stays small, and writes to rows outside the slice don't touch
it.

## Indexing only the rows you look for

Take a job queue in a table:

```sql
SELECT id, payload FROM jobs
WHERE processed = false AND queue = 'email'
ORDER BY id LIMIT 10;
```

Almost every row in `jobs` has been processed. The workers only ever ask
for the few that haven't. A normal [[indexes|index]] on `(queue,
processed)` works, but most of its entries point at processed jobs
nobody will look for again. A partial index skips them:

```sql
CREATE INDEX jobs_todo ON jobs (queue, id) WHERE processed = false;
```

The index shrinks in two directions. It has fewer entries, one per
unprocessed job. And it needs no `processed` column, because every entry
in it has the same value. For a queue, the index can stay about the same
size forever while the table keeps growing, since jobs leave the index
as they're processed.

The same idea covers other shapes:

- **Skip a very common value.** A query for a value that's in more than
  a few percent of rows won't use an index anyway, so there's no point
  indexing those rows.
- **Index only the interesting rows**, like unbilled orders in a table
  that's mostly billed ones.
- **Enforce uniqueness on a subset.** A unique partial index enforces
  uniqueness only among the rows that match its condition:

```sql
-- at most one active subscription per user; any number of cancelled ones
CREATE UNIQUE INDEX one_active_sub ON subscriptions (user_id)
WHERE status = 'active';
```

That's a rule a plain unique constraint can't express (see
[[constraints]]).

## When the planner can use it

The planner can use a partial index only if it can prove that the
query's `WHERE` clause implies the index's condition. It isn't clever
about it. It handles simple cases, such as `x < 1` implying `x < 2`.
Otherwise, the index's condition has to appear in the query, written
the same way. `WHERE processed = false` matches the index above. A
query for a single job by `id`, with no condition on `processed`, can't
use it, because that job might be processed.

## Where it gets tricky

**Bind parameters don't match.** The check happens when the query is
planned, not when it runs. A prepared statement or an [[orm|ORM]] query that
sends `WHERE processed = $1` can't use the index, because for some
value of `$1` the condition wouldn't hold. Write the condition as a
literal in the query text.

**Many partial indexes aren't partitioning.** It's tempting to make one
partial index per category (`WHERE category = 1`, `= 2`, ...). The
planner doesn't know they don't overlap, so it tests each one against
every query. One ordinary index on `(category, data)` is almost always
better, and if the table really is too big for one index, that's what
[[table-partitioning]] is for.

**The gain is often small.** Most of the time a partial index beats a
regular one by very little. It pays off when the indexed slice is small and
the rest of the table is never searched through that index, as in a
queue.

**Other databases differ.** SQL Server calls these filtered indexes.
Db2 doesn't support them, and Oracle gets a similar effect its own way.

## What this means when you build

- Use partial indexes for "hot subset" queries: unprocessed jobs,
  pending payments, rows not soft-deleted.
- Put the same condition, as a literal, in the queries that should use
  the index.
- Use a unique partial index for "only one active X per Y" rules.
- Don't split one index into many partial ones by category.

## Further reading

- [PostgreSQL documentation, 11.8 Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html), PostgreSQL Global Development Group, version 18. The uses, the matching rule, parameters, and the partitioning warning.
- [Partial Indexes](https://use-the-index-luke.com/sql/where-clause/partial-and-filtered-indexes), Markus Winand. The queue example, and how the index shrinks in rows and columns.

---
id: table-partitioning
title: Table partitioning
depth: short
phase: 6
note: >-
  Splitting one big Postgres table into child tables by range, list or
  hash, all on one server.
needs: [indexes]
leads_to: []
compare_with: [partial-indexes, partitioning]
---

# Table partitioning

Table partitioning splits what is logically one big table into smaller
physical tables, on the same Postgres server. Queries still name the one
table, and Postgres routes rows to the right piece and skips the pieces
a query can't touch. It's a tool for tables too big to handle as one
piece: the rule of thumb is a table larger than the server's memory.

Don't confuse it with [[partitioning]] in the distributed sense, where
the pieces live on different machines. Same word, same idea of a key
that decides where a row goes, but here everything stays on one server.

## One table, many pieces

Take a `measurement` table that gets a row per sensor reading, forever.
You declare it partitioned by range on the reading's year and create one
partition per year:

```sql
CREATE TABLE measurement (
    city_id int, year int, peaktemp int
) PARTITION BY RANGE (year);

CREATE TABLE measurement_2025 PARTITION OF measurement
    FOR VALUES FROM (2025) TO (2026);
```

The parent table has no storage of its own. Each partition is an
ordinary table holding the rows inside its bounds, and an insert into
`measurement` lands in whichever partition its `year` falls into.
(Real tables usually partition on a timestamp column, by month or day;
the idea is the same.)

Postgres has three built-in ways to split:

- **Range**: each partition covers a range of the key, like a year or a
  month. The usual choice for time-ordered data.
- **List**: each partition holds listed values, like one per region.
- **Hash**: each partition holds the rows whose hash of the key, divided
  by a modulus, leaves a given remainder. It spreads rows evenly when
  there's no natural range.

## What you get

**Pruning.** For `WHERE year >= 2025`, the planner looks at
each partition's bounds, proves the older ones can't hold a matching row,
and leaves them out of the plan. You can see it in [[explain]]: the plan
lists only the partitions it will scan.

**Smaller [[indexes]].** An index declared on the parent is created on every
partition, including ones added later. Each is small, and when most of
the busy rows sit in one or two partitions, their indexes are more
likely to stay in memory. In effect, the partitions stand in for the top
levels of one giant index.

**Cheap deletes.** Removing a month of old data is `DROP TABLE` or
`ALTER TABLE ... DETACH PARTITION` on that month's partition. That's far
faster than a bulk `DELETE`, and it leaves no dead rows behind for
[[vacuum]] to clean up. Retention is often the main reason to partition
at all.

## Where it gets tricky

**The key is hard to change later.** Pick it from the columns that show
up most in your queries' `WHERE` clauses, since only those let the
planner prune. A query that doesn't filter on the key scans every
partition. Moving a large table to a new scheme means rewriting it.

**Unique keys must include the partition key.** Each partition enforces
uniqueness only within itself, so a primary key or unique constraint on
the parent must contain all the partition key columns. A table
partitioned by `year` can't have a primary key on `id` alone.

**More partitions isn't better.** Too few and the indexes stay big. Too
many and planning gets slower and uses more memory, in both planning and
execution. The planner handles up to a few thousand partitions well, as
long as typical queries prune all but a few.

**Some commands work differently.** You can't create an index
`CONCURRENTLY` on the parent. And it's not a replacement for a
[[partial-indexes|partial index]] when all you want is to index a small
slice of one table.

## What this means when you build

- Partition when a table outgrows memory or when you need to drop old
  data in bulk. Before that, an index is simpler.
- For time series, range-partition by the timestamp, one partition per
  day, week or month, and drop old partitions instead of deleting rows.
- Check with `EXPLAIN` that your hot queries prune.
- Make sure every unique constraint you need can include the partition
  key before you commit to one.

## Further reading

- [PostgreSQL documentation, 5.12 Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html), PostgreSQL Global Development Group, version 18. Range, list and hash partitioning, pruning, the limitations, and how many partitions is too many.

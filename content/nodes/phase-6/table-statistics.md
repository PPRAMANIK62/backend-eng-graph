---
id: table-statistics
title: Table statistics
depth: short
phase: 6
note: >-
  What the planner knows about your data, and how stale statistics
  produce bad plans.
needs: [query-planner, explain]
leads_to: []
compare_with: [jsonb]
---

# Table statistics

The [[query-planner]] chooses between plans by estimating how many rows
each step will produce. It can't count them without running the query,
so it works from a summary of your data that Postgres collects ahead of
time: the table statistics. When that summary is out of date or too
coarse, the estimates go wrong, and so do the plans.

## What Postgres keeps

**Table size.** For each table and index, Postgres stores a row count
and a page count (`reltuples` and `relpages` in `pg_class`). They're
not updated on every write. [[vacuum|`VACUUM`]], `ANALYZE` and a few commands such
as `CREATE INDEX` refresh them, and at planning time Postgres scales the
row count to the table's current size on disk.

**Per-column statistics.** `ANALYZE` reads a random sample of rows and
stores, for each column, things like:

- the fraction of values that are NULL,
- the number of distinct values,
- the most common values (MCVs) and how often each appears,
- a histogram of the remaining values, as bucket boundaries with an
  equal number of rows in each bucket.

You can read them in the `pg_stats` view. The size of the MCV list and
the number of histogram buckets are set by the statistics target:
100 by default, and adjustable column by column.

## From statistics to a row estimate

The fraction of rows a condition keeps is its *selectivity*. The estimate is selectivity times the table's row count. Three worked
examples on a 10,000-row table from the Postgres regression database:

- **A range, `unique1 < 1000`.** The column's histogram has ten buckets.
  1000 falls just inside the second bucket (993 to 1997). So the planner
  counts one full bucket plus a sliver of the second, assuming values
  are spread evenly inside a bucket: selectivity about 0.1007, estimate
  1,007 rows.
- **Equality with a common value, `stringu1 = 'CRAAAA'`.** The value is
  in the MCV list with frequency 0.003, so the estimate is 30 rows.
- **Equality with a rare value, `stringu1 = 'xxx'`.** It isn't in the
  MCV list, so the planner takes the rows not covered by MCVs and
  spreads them evenly over the other distinct values: about 15 rows.

![A histogram of the unique1 column drawn as ten buckets of equal row count, with boundaries 0, 993, 1997, 3050, 4040, 5036, 5957, 7057, 8029, 9016 and 9995. A cut at 1000 covers all of the first bucket and a thin slice of the second, giving a selectivity of about 0.1007 and an estimate of 1,007 of 10,000 rows.](img/table-statistics-histogram.svg)

*How a range estimate uses the histogram. Numbers from the PostgreSQL manual, "Row Estimation Examples" (version 18).*

## How statistics go stale

Autovacuum runs `ANALYZE` on a table once enough rows have changed
since the last one: 50 rows plus 10% of the table, by default. On a
10-million-row table that's about a million changed rows.

The trigger counts changes, not their meaning. It has no idea whether
the distribution moved. The column most likely to go stale is one whose
maximum keeps growing, like a `created_at` timestamp: the newest rows,
the ones a "last hour" query asks for, aren't in the statistics yet.

Some tables are never analyzed automatically. Autovacuum doesn't run
`ANALYZE` on a [[table-partitioning|partitioned]] table's parent (only on its partitions), and
it can't see temporary tables. For both, you run `ANALYZE` yourself.

## Where it gets tricky

**Columns aren't independent.** Per-column statistics can't see that
`city` and `zip` move together. The planner multiplies the two
selectivities as if they were independent and underestimates the
result. Extended statistics fix this for column groups you name with
`CREATE STATISTICS`: functional dependencies, distinct counts for
combinations, and MCV lists over several columns. In one
ZIP-code data set, the most common (city, state) pair appears about 0.35%
of the time, while per-column statistics predict 0.0027%, two orders of
magnitude too low. Postgres doesn't create these automatically; there
are too many possible column combinations.

**Statistics are a sample.** They're always approximate, and each
`ANALYZE` draws a new sample, so estimates shift a little between
runs. A higher statistics target means a bigger
sample and a finer histogram, at the cost of a slower `ANALYZE`.

**Upgrades used to wipe them.** Before PostgreSQL 18, a database
upgraded with `pg_upgrade` started with no planner statistics until it
was analyzed again. Since 18, `pg_upgrade` keeps them, except extended
statistics.

## What this means when you build

- After a bulk load or a big delete, run `ANALYZE` on the table right
  away rather than waiting for autovacuum.
- For large, fast-growing tables, lower the analyze scale factor for
  that table so statistics keep up.
- When [[explain]] shows estimated rows far from actual rows, suspect
  statistics first: stale, too coarse (raise the target for that
  column), or blind to a correlation (add extended statistics).
- Analyze partitioned parents and temp tables yourself.

## Further reading

- [PostgreSQL documentation, 14.2 Statistics Used by the Planner](https://www.postgresql.org/docs/current/planner-stats.html), PostgreSQL Global Development Group, version 18. What's stored, where to look, and extended statistics with worked examples.
- [PostgreSQL documentation, 69.1 Row Estimation Examples](https://www.postgresql.org/docs/current/row-estimation-examples.html), PostgreSQL Global Development Group, version 18. Step-by-step arithmetic from histograms and MCV lists to row estimates.
- [PostgreSQL documentation, 24.1 Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html), PostgreSQL Global Development Group, version 18. When autovacuum runs ANALYZE, and which tables it skips.
- [PostgreSQL documentation, 19.10 Vacuuming](https://www.postgresql.org/docs/current/runtime-config-vacuum.html), PostgreSQL Global Development Group, version 18. The default analyze threshold and scale factor.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/), PostgreSQL Global Development Group, 2025. pg_upgrade now keeps planner statistics.

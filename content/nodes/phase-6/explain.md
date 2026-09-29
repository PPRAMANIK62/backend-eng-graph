---
id: explain
title: EXPLAIN
depth: deep
phase: 6
note: >-
  Reading EXPLAIN ANALYZE: scan and join nodes, estimated vs actual
  rows, where the time went.
needs: [query-planner]
leads_to: [table-statistics]
compare_with: [n-plus-one]
---

# Reading a query plan with EXPLAIN

`EXPLAIN` shows you the plan Postgres picked for a query: which tables
it reads, whether it uses an index, and how it joins. `EXPLAIN ANALYZE`
runs the query too and puts what really happened next to what the
planner expected. When a query is slow, this is where you find out
why, and most of the skill is reading a handful of numbers on each
line.

## A plan is a tree of nodes

Take a join between two tables from the Postgres test database,
`tenk1` and `tenk2` (10,000 rows each):

```sql
EXPLAIN ANALYZE SELECT *
FROM tenk1 t1, tenk2 t2
WHERE t1.unique1 < 10 AND t1.unique2 = t2.unique2;
```

Postgres 18 prints this (from the manual, trimmed):

```
Nested Loop  (cost=4.65..118.50 rows=10 width=488) (actual time=0.017..0.051 rows=10.00 loops=1)
  Buffers: shared hit=36 read=6
  ->  Bitmap Heap Scan on tenk1 t1  (cost=4.36..39.38 rows=10 width=244) (actual time=0.009..0.017 rows=10.00 loops=1)
        Recheck Cond: (unique1 < 10)
        ->  Bitmap Index Scan on tenk1_unique1  (cost=0.00..4.36 rows=10 width=0) (actual time=0.004..0.004 rows=10.00 loops=1)
              Index Cond: (unique1 < 10)
  ->  Index Scan using tenk2_unique2 on tenk2 t2  (cost=0.29..7.90 rows=1 width=244) (actual time=0.003..0.003 rows=1.00 loops=10)
        Index Cond: (unique2 = t1.unique2)
Planning Time: 0.485 ms
Execution Time: 0.073 ms
```

Each line that starts a node (the first line, and every line with `->`)
is one step. The indented lines under a node are details about it.
Indentation shows the tree: a node's children are the nodes indented
one level below it.

The bottom nodes are **scans**. They read rows from a table or an
index. The nodes above them combine, filter, sort or join those rows.
A parent pulls rows from its children as it needs them, so data flows
upward and the top node hands the final rows to you.

![A plan tree drawn as boxes. At the top, Nested Loop, actual rows 10, loops 1. Its outer child is a Bitmap Heap Scan on tenk1 returning 10 rows, fed by a Bitmap Index Scan on tenk1_unique1 below it. Its inner child is an Index Scan on tenk2_unique2 with rows 1 and loops 10, marked as run once per outer row, 0.003 ms per loop, about 0.030 ms in total. Arrows point upward to show rows flowing from the scans to the join.](img/explain-plan-tree.svg)

*The same plan as a tree. Adapted from the PostgreSQL documentation, "14.1. Using EXPLAIN", version 18.*

Read this one from the bottom:

1. **Bitmap Index Scan** walks the `tenk1_unique1` [[indexes|index]] and
   collects the locations of rows with `unique1 < 10`.
2. **Bitmap Heap Scan** sorts those locations into the order they sit
   on disk and fetches the rows from the table, so it doesn't jump
   around more than it must.
3. **Nested Loop** takes each of those 10 rows and, for each one, runs
   its second child.
4. **Index Scan** on `tenk2_unique2` looks up the one matching row in
   `tenk2`, using the `unique2` value from the current outer row.

That's the whole plan: find 10 rows by index, then do 10 index lookups
in the other table. The [[query-planner]] chose it because it thought
it was the cheapest of the plans it considered.

## The four estimate numbers

Every node carries the planner's guesses in the first set of
parentheses: `cost=4.65..118.50 rows=10 width=488`.

- **Start-up cost** (4.65) is the work before the node can return its
  first row. A sort has to read all its input first, so its start-up
  cost is high. A sequential scan can return rows at once, so it's 0.
- **Total cost** (118.50) is the work to return every row. The top
  node's total is the number the planner tries to make as small as it
  can.
- **Rows** (10) is how many rows the node will *emit*, after any
  filter, not how many it reads.
- **Width** (488) is the average row size in bytes.

Costs are not milliseconds. They're in made-up units that
conventionally mean "one sequential page read". The planner's settings
give each kind of work a price: by default `seq_page_cost` is 1.0 and
`cpu_tuple_cost` (handling one row) is 0.01. So a plain scan of
`tenk1`, which is 345 pages and 10,000 rows, costs
345 × 1.0 + 10,000 × 0.01 = 445. A parent's cost includes all of its
children's costs.

Costs leave out things no plan can change, like turning results into
text and sending them to the client. They're only useful for comparing
plans of the same query.

## The scan nodes you'll see most

- **Seq Scan** reads the whole table. A `Filter:` line under it means
  every row is read and checked, and only the matches are passed up.
  Adding a condition makes the estimated rows go down but the cost goes
  up a little, because the scan still visits every row.
- **Index Scan** walks an index and fetches each matching row from the
  table in index order. Good for a few rows, or when the index order
  saves an `ORDER BY` sort.
- **Bitmap Index Scan + Bitmap Heap Scan**, the two-step version from
  the example. Fetching rows one by one costs more than reading in
  order, so sorting the row locations into physical order first helps
  when more than a few rows match, and it still skips the pages a
  sequential scan would read.
- **Index Only Scan** reads the index and skips the table where it
  can; [[covering-indexes]] explains when that works.

When a condition can't be used by the index, it shows up as a `Filter:`
on the rows the index returned. `Index Cond:` is the part the index
handled. Seeing the condition you care about as a `Filter:` rather than
an `Index Cond:` is often the whole story of a slow query.

The join nodes are **Nested Loop**, **Hash Join** (build a hash table
from one input, probe it with the other) and **Merge Join** (walk two
inputs sorted on the join key). [[joins]] explains when each one wins.

## What ANALYZE adds

With `ANALYZE`, Postgres runs the query and adds a second set of
parentheses: `actual time=0.003..0.003 rows=1.00 loops=10`.

- **actual time** is start-up and total time in milliseconds, real
  time this time.
- **rows** is how many rows the node really emitted.
- **loops** is how many times the node ran.

The trap is loops. When a node runs more than once, the time and rows
shown are *averages per run*. The Index Scan on `tenk2` above ran 10
times at 0.003 ms each, so it spent about 0.030 ms in total, not 0.003.
Multiply by `loops` before deciding where the time went. A tiny number
on a node with a huge `loops` count is often the slowest thing in the
plan.

A few more lines show up under nodes:

- **Rows Removed by Filter** counts the rows a node read and threw away.
  A large number here next to a small `rows` means the scan did a lot
  of wasted reading.
- **Rows Removed by Index Recheck** means the index returned candidates
  that turned out not to match, as lossy indexes like GiST do (see
  [[index-types]]).
- **Sort Method** says whether a sort fit in memory or spilled to disk.
  A **Hash** node with more than one **Batch** also went to disk.
- **Buffers** counts 8 kB pages: `hit` were found in Postgres's own
  cache, `read` had to be fetched, `dirtied` were changed by this
  query, `written` were dirty pages this query had to push out itself.
  Since Postgres 18, `EXPLAIN ANALYZE` includes this without asking.
- **Index Searches** (new in Postgres 18) counts how many times an
  index was descended, across all loops.

At the bottom, **Planning Time** is how long the planner took, and
**Execution Time** is how long running the plan took, including
triggers but not parsing or planning.

## Estimates against actuals

The single most useful thing in the output is whether each node's
estimated `rows` is close to its actual `rows`. The planner picks join
methods and join order from those estimates. If it thinks a node
returns 10 rows and it returns 100,000, a nested loop that looked cheap
runs its inner side 100,000 times.

When several nodes are far off, start with the lowest one: the nodes
above it build their own guesses on its wrong one. The fix is usually about what the planner
knows: its [[table-statistics]] are stale or too coarse for that
column. Postgres refreshes them through autovacuum (see [[vacuum]]),
but after a big load or delete you may need to run `ANALYZE` yourself.

In the example above, every estimate matched. That's unusual.

## Where it gets tricky

**ANALYZE really runs the statement.** `EXPLAIN ANALYZE DELETE ...`
deletes the rows. Wrap anything that writes in `BEGIN;` and `ROLLBACK;`.
Plain `EXPLAIN` never runs anything.

**Actual rows lower than estimated isn't always a mistake.** Under a
`LIMIT`, a node stops once the limit is met, so it shows fewer actual
rows and less time than its estimate, which assumes it runs to the end.
A merge join can stop reading one input early for the same reason, and
it can also count re-read inner rows twice, so its inner child may
report more rows than the table holds. `BitmapAnd` and `BitmapOr`
nodes always report zero actual rows.

**The measurement changes the thing measured.** Timing every node means
reading the clock over and over, and on machines with a slow clock call
that can make `EXPLAIN ANALYZE` much slower than the real query. If
you only need row counts, `EXPLAIN (ANALYZE, TIMING OFF)` skips the
per-node timing.

**The client side is missing.** `EXPLAIN ANALYZE` throws the result
rows away, so the time to send them over the network isn't in it. The
time to convert them to text isn't either, unless you add `SERIALIZE`.
A query that returns huge rows can be fast here and slow in your app.

**Small tables lie.** The planner's costs aren't linear, so a plan on a
test table with a few hundred rows says little about the same query on
production data. On a table that fits in one page you'll nearly always
get a sequential scan, index or not.

**`enable_*` settings are for experiments.** `SET enable_seqscan = off`
lets you see the plan Postgres would pick otherwise and compare costs.
Many of these flags don't forbid a node type outright, they only
discourage it (Postgres 18 marks such nodes `Disabled: true`). It's meant for testing,
not for fixing production queries.

**Output changes between versions.** Postgres 18 added buffer counts by
default, fractional row counts (`rows=10.00`) and the `Index Searches` line. Older blog posts
show `Total runtime` where current versions print `Execution Time`.

## What this means when you build

- Use `EXPLAIN (ANALYZE, BUFFERS)` on a copy of production-sized data.
  Plain `EXPLAIN` when the query writes or takes too long to run.
- Read from the bottom up. For each node, compare estimated and actual
  rows, and multiply time by `loops`.
- Look for a `Filter:` where you expected an `Index Cond:`, big
  `Rows Removed` counts, sorts or hashes that spilled to disk, and
  nested loops with very high `loops`.
- When estimates are far off, look at statistics first, before
  rewriting the query or adding an index.
- In production, load the `auto_explain` module and set
  `auto_explain.log_min_duration` so slow queries log their own plans.
  It's off by default. Its `log_analyze` option times every statement,
  logged or not, which can hurt performance badly; turn off
  `log_timing` if you need it.
- Paste big plans into a visualiser (explain.depesz.com and others) to
  get per-node exclusive times.

## Further reading

- [14.1. Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL docs, version 18. The manual's walkthrough, from a one-line scan to joins, ANALYZE output and every caveat.
- [EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html), PostgreSQL docs, version 18. Every option, and what the buffer counts mean.
- [F.3. auto_explain](https://www.postgresql.org/docs/current/auto-explain.html), PostgreSQL docs, version 18. Logging the plans of slow queries in production, and what each option costs.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/), PostgreSQL Global Development Group, 2025. What changed in EXPLAIN output in 18.
- [Explaining the unexplainable](https://www.depesz.com/2013/04/16/explaining-the-unexplainable/), Hubert Lubaczewski, 2013. A friendly first read on what the numbers mean and why loops matter; its output format is from an older version.

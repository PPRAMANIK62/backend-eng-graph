---
id: query-planner
title: The query planner
depth: deep
phase: 6
note: >-
  How the database picks a plan from many, using statistics and a cost
  model.
needs: [indexes, joins]
leads_to: [table-statistics, explain]
compare_with: []
---

# The query planner

SQL says which rows you want, not how to get them. The query planner is
the part of the database that decides the how: which index to use, in
what order to join the tables, and with which join method. It builds
many candidate plans, estimates what each would cost, and runs the
cheapest. When a query that used to be fast turns slow with no change
to your code, a different plan is one of the first things to check.

## One query, many plans

Take two tables and a question:

```sql
SELECT o.id, o.total
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.country = 'NZ'
  AND o.created_at > now() - interval '7 days';
```

Every correct plan returns the same rows. They differ in how much work
they do. The planner works through the choices in order.

**How to read each table.** A sequential scan is always possible, so it's
always a candidate. If an index matches a condition (an index on
`customers.country`, say, or on `orders.created_at`), an index scan is a
candidate too. So is an index whose order matches an `ORDER BY` or would
help a merge join later. See [[indexes]] for what makes a condition
match.

**How to join them.** Postgres has three join methods, covered in
[[joins]]:

- *Nested loop*: for each row of one side, look up matches in the other.
  Good when the outer side is small and the inner side has an index on
  the join column.
- *Hash join*: load one side into a hash table, then stream the other
  side past it.
- *Merge join*: sort both sides on the join key (or read them from an
  index in that order) and walk them together.

**In what order.** With two tables there are only two orders. With *n*
tables there are *n* factorial (*n*!), so ten tables already have over
three million. The trick, from IBM's System R optimizer in 1979, is that
the best way to join a new table onto a group of already-joined tables
doesn't depend on the order the group was joined in. So the planner
finds the best plan for every pair, then builds the best plans for every
set of three from those, and so on up. That's dynamic programming.
Postgres still runs a near-exhaustive search of this kind for most
queries.

It doesn't do it forever. Once a query has 12 or more `FROM` items (the
default `geqo_threshold`), Postgres switches to a genetic search that
finds a reasonable plan, not necessarily the best one, because an
exhaustive search would take longer than running a mediocre plan. It
also tries joins that have a join condition before ones that don't.

![Diagram of a cost-based planner. A SQL query goes into plan enumeration, which produces candidate plans: scan choices for each table, join orders, and join methods. Each candidate goes to the cost model, which needs two inputs: row estimates from cardinality estimation (which reads table statistics) and cost constants such as seq_page_cost and random_page_cost. The cheapest candidate becomes the plan handed to the executor.](img/query-planner-pipeline.svg)

*The parts of a cost-based planner. Adapted from Viktor Leis et al., "How Good Are Query Optimizers, Really?", figure 1 (PVLDB, 2015).*

## Putting a number on each plan

To compare plans, the planner gives each one a cost. The cost is in
made-up units, not milliseconds. By convention one unit is the cost of
reading one page as part of a sequential read, and everything else is
set relative to that. These are the Postgres defaults (version 18):

| Setting | Default | What it's the cost of |
|---|---|---|
| `seq_page_cost` | 1.0 | reading a page as part of a sequential read |
| `random_page_cost` | 4.0 | reading a page out of sequence |
| `cpu_tuple_cost` | 0.01 | processing one row |
| `cpu_index_tuple_cost` | 0.005 | processing one index entry |
| `cpu_operator_cost` | 0.0025 | running one operator or function, such as a comparison |

Here's a worked example: a table of 10,000 rows on 345 pages. A sequential scan reads every page and processes every row, so
its cost is 345 × 1.0 + 10,000 × 0.01 = 445. Add a `WHERE` clause and
the cost goes *up* a little, by one `cpu_operator_cost` per row, because
the scan still reads every row and now also checks each one. An index
scan, by contrast, pays `random_page_cost` for heap pages it jumps to,
and the planner picks whichever total comes out lower.

The idea is old. System R's cost was page fetches plus a weight times
the number of rows passed up from storage, a mix of I/O and CPU with a
dial between them. Postgres's model is more detailed, but it's the same
shape.

Two details trip people up. The cost of a plan node includes everything
below it, so the top line of a plan is the total. And cost ignores the
time to send results to the client, since every plan sends the same
rows. You'll read these numbers in [[explain]] output.

## The number that matters most: how many rows

Every cost above is multiplied by a row count: rows scanned, rows
matched, rows fed into the next join. The planner doesn't know those
counts. It estimates them from [[table-statistics]], which `ANALYZE`
collects. Without statistics it falls back on default guesses, which are
almost certain to be wrong.

For one condition, the estimate is often decent. The trouble starts when
conditions combine. By default the planner assumes conditions on
different columns are independent and multiplies their selectivities.
System R did the same in 1979, and fell back to guessing one tenth for
an equality condition it knew nothing about. If `country = 'NZ'` and
`city = 'Auckland'` each keep a few percent of rows, independence says
together they keep a tiny fraction; in reality almost every Auckland row
is also an NZ row. The estimate comes out far too low, and every join
above it inherits the error.

Row estimates also change which plan wins, not just its cost. On the
same small test tables, making a condition a bit less selective
flips a join from a nested loop to a hash join, and adding a `LIMIT`
makes the planner prefer a plan that returns the first rows quickly over
one that's cheaper in total.

## Where it gets tricky

**Bad estimates matter more than a perfect cost model.** A study by
Viktor Leis and colleagues (PVLDB, 2015) ran 113 join-heavy queries on a
real, highly correlated data set (IMDB) against PostgreSQL 9.4 and
several commercial systems. Every system misestimated row counts by a
factor of 1,000 or more on a regular basis, the errors grew with each
join, and the systems mostly *under*estimated. Those errors, not the
cost model, were usually why a plan was bad. Swapping in a tuned cost
model made little difference next to fixing the estimates.

**Nested loops are where underestimates hurt.** A nested loop is cheap
when the outer side really is small. If the planner expects a handful of
rows from a step and far more arrive, the inner side runs once for each
of them. The same study found PostgreSQL picks the join method purely on
estimated cost, so it will take a nested loop over a hash join on a
tiny cost difference, which is a risky bet when underestimates are
common.

**The absolute numbers were never the point.** The System R paper
already noted its predicted costs were often wrong in absolute terms,
but the ranking of plans was usually right, and that's what picks the
plan. When the ranking flips because an estimate is off, you get a bad
plan.

**Tuning cost constants is a blunt tool.** `random_page_cost` defaults
to 4.0 not because random reads are four times slower than sequential
ones (from storage they're normally much slower than that), but because
most random reads, such as index lookups, are assumed to hit cache. If your data
fits in memory, setting both page costs equal makes sense. But there's
no well-defined way to find ideal values, and changing them based on a
few experiments is risky, since they affect every query.

**You can't force a plan directly.** Settings like `enable_seqscan =
off` don't forbid a plan type. They discourage it, so the planner
avoids it when there's another option and still uses it when there
isn't. They're for diagnosing
("would the index plan actually be faster?"), not for production.

**Prepared statements add a twist.** A prepared statement can run with a
*custom* plan made for its actual parameter values, or a *generic* plan
reused for all values. The generic plan saves planning time, but if the
best plan depends heavily on the parameter (a rare value vs a common
one), it can be the wrong plan for many calls. `plan_cache_mode`
controls the choice.

## What this means when you build

- Test query plans on data of realistic size and shape. On a tiny table
  that fits in one page, no index beats a sequential scan, so a plan
  from your laptop tells you little about production.
- When a plan looks wrong, compare the estimated and actual row counts
  in `EXPLAIN ANALYZE` first. A big gap points at statistics, not at
  the planner's logic.
- Be careful with filters on correlated columns and with long join
  chains. Those are where estimates drift furthest.
- Leave the cost constants alone unless you know your storage and
  caching differ from the defaults' assumptions, and change them for
  the whole workload, not to fix one query.
- Use `enable_*` settings to test a theory, then fix the cause (an
  index, statistics, the query) instead of leaving them set.

## Further reading

- [PostgreSQL documentation, 51.5 Planner/Optimizer](https://www.postgresql.org/docs/current/planner-optimizer.html), PostgreSQL Global Development Group, version 18. How Postgres generates scan and join candidates and searches join orders.
- [PostgreSQL documentation, 19.7 Query Planning](https://www.postgresql.org/docs/current/runtime-config-query.html), PostgreSQL Global Development Group, version 18. The cost constants and their defaults, the genetic optimizer threshold, and generic vs custom plans.
- [PostgreSQL documentation, 14.1 Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group, version 18. A worked cost calculation, and examples of plans changing with selectivity and LIMIT.
- [PostgreSQL documentation, 11.12 Examining Index Usage](https://www.postgresql.org/docs/current/indexes-examine.html), PostgreSQL Global Development Group, version 18. Why tiny test data misleads, and how to use plan switches to diagnose.
- [Access Path Selection in a Relational Database Management System](https://courses.cs.duke.edu/compsci516/cps216/spring03/papers/selinger-etal-1979.pdf), Selinger et al., IBM, 1979. The System R optimizer: cost formula, selectivity guesses, and join order search by dynamic programming.
- [How Good Are Query Optimizers, Really?](https://www.vldb.org/pvldb/vol9/p204-leis.pdf), Leis et al., PVLDB, 2015. Measured how wrong row estimates get on real data, and that they matter more than the cost model.

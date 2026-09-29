---
id: window-functions
title: Window functions
depth: short
phase: 6
note: >-
  Running totals, rankings and "previous row" without collapsing rows.
needs: [sql]
leads_to: []
compare_with: [windowing]
---

# Window functions

A window function computes something across a set of rows related to
the current row, like an aggregate does, but without collapsing them:
every input row stays in the output and gets an extra column. That's
how [[sql|SQL]] answers "rank within each group", "running total" and
"compared with the previous row" in one query instead of in
application code.

## Aggregate vs window

Take an `employees` table with `depname` and `salary`. `SELECT depname,
avg(salary) FROM employees GROUP BY depname` returns one row per
department; the individual employees are gone. Add `OVER` and the same
aggregate becomes a window function:

```sql
SELECT depname, empno, salary,
       avg(salary) OVER (PARTITION BY depname)
FROM employees;
```

Now every employee is still there, next to their department's average.
The `OVER` clause is what makes it a window function, and it says
which rows each calculation looks at. Any ordinary aggregate (`sum`,
`count`, `avg`, `max`...) works this way, and there are functions
that only make sense as window functions.

## Partitions, order and frames

Inside `OVER` there are three dials.

**`PARTITION BY`** splits the rows into groups that share a value. Each
row's calculation only sees its own group. Leave it out and all rows
form one partition.

**`ORDER BY`** sorts rows within each partition. Ranking functions
number rows in this order, and it doesn't have to match the order of
the final output.

**The frame** is the slice of the partition an aggregate actually
reads for the current row. By default, with an `ORDER BY`, the frame
runs from the first row of the partition up to the current row plus
any rows tied with it (its *peers*). Without an `ORDER BY`, the frame
is the whole partition.

![Left: ten employees in three departments, numbered by row_number over PARTITION BY depname ORDER BY salary DESC; numbering restarts at 1 in each department. Right: the same ten salaries sorted, with sum over ORDER BY salary giving a running total; the row with salary 4800 has a frame from the first row down to the second 4800, so both 4800 rows show 25700.](img/window-functions-partitions-frames.svg)

*Partitions restart the count; frames make a running total. Data and results from the PostgreSQL documentation, section 3.5 (version 18).*

That default frame is why `sum(salary) OVER (ORDER BY salary)` gives a
running total, and why two rows with the same salary show the same
total: they're peers, so each one's frame includes the other.

## The functions you'll use most

- **Ranking.** `row_number()` counts 1, 2, 3 within the partition, and
  breaks ties in no particular order. `rank()` gives tied rows the same
  number and then skips (two rows at rank 2, then 4). `dense_rank()`
  doesn't skip (2, 2, then 3).
- **Neighbours.** `lag(salary)` returns the value from the row before
  in the window order, and `lead(salary)` the row after. Both take an
  offset (default 1) and a default for when there's no such row
  (NULL unless you give one). `salary - lag(salary) OVER (ORDER BY
  hired_at)` is "change since the previous hire".
- **Running and moving aggregates.** `sum(...) OVER (ORDER BY ...)` for
  a running total. A frame clause (`ROWS`, `RANGE` or `GROUPS`) changes
  which rows count, for example to average only the rows near the
  current one.
- **Buckets.** `ntile(4)` splits each partition into four groups of
  near-equal size.

When several functions share a window, name it once:
`... OVER w ... WINDOW w AS (PARTITION BY depname ORDER BY salary DESC)`.

## Where it gets tricky

**You can't filter on a window function in WHERE.** Window functions
run after `WHERE`, `GROUP BY` and `HAVING`, so they're allowed only in
the select list and `ORDER BY`. For "top two earners per department",
compute `row_number()` in a subquery (or a [[ctes|CTE]]), then filter
on it outside:

```sql
SELECT * FROM (
  SELECT depname, empno, salary,
         row_number() OVER (PARTITION BY depname
                            ORDER BY salary DESC, empno) AS pos
  FROM employees
) ranked
WHERE pos < 3;
```

The same order is why an aggregate can sit inside a window function's
arguments, but not the other way round.

**`last_value` looks broken.** `first_value`, `last_value` and
`nth_value` read the frame, and the default frame ends at the current
row's last peer. So `last_value(x) OVER (ORDER BY y)` returns the
value from the current row (or its last tie), not the partition's last
row. Widen the frame with `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.

**Surprise running totals.** The same default frame means that adding
`ORDER BY` to an aggregate's `OVER` changes it from a partition total
into a running total. If you want the total, leave out `ORDER BY` or
widen the frame.

**Ties.** `row_number()` numbers tied rows in an unspecified order, so
don't build anything on which tie comes first. Add a unique column
(like the primary key) to the `ORDER BY` when the result must be stable, as the `empno` does
above.

**IGNORE NULLS depends on the version.** The SQL standard's
`IGNORE NULLS` for `lag`, `lead`, `first_value`, `last_value` and
`nth_value` isn't implemented in PostgreSQL 18; they always behave as
`RESPECT NULLS`. PostgreSQL 19, in beta at the time of writing, adds it
for those five functions.

## What this means when you build

- Reach for a window function when you'd otherwise loop over query
  results in the application to compare rows or keep a counter.
- Put the filter on a window result in an outer query.
- Make window ordering deterministic with a tiebreaker column.
- Be explicit about the frame whenever you use `ORDER BY` with an
  aggregate or `last_value`.

## Further reading

- [PostgreSQL documentation, 3.5 Window Functions](https://www.postgresql.org/docs/current/tutorial-window.html), PostgreSQL Global Development Group, version 18. The tutorial: OVER, PARTITION BY, default frames, and the sub-select trick, with example output.
- [PostgreSQL documentation, 9.22 Window Functions](https://www.postgresql.org/docs/current/functions-window.html), PostgreSQL Global Development Group, version 18. Every built-in window function, peers, and the last_value frame trap.
- [PostgreSQL 19 release notes](https://www.postgresql.org/docs/19/release-19.html), PostgreSQL Global Development Group, beta. IGNORE NULLS arriving for window functions.

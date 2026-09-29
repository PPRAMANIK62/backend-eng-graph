---
id: sql
title: SQL
depth: deep
phase: 6
note: >-
  Say which rows you want, not how to find them. Bags, NULLs, and the
  order a query's clauses are logically applied in.
needs: [relational-model]
leads_to: [joins, ctes, window-functions, indexes, n-plus-one, triggers, transaction, row-level-security, sql-injection]
compare_with: []
---

# SQL

SQL is the language you use to talk to a relational database. You
describe the rows you want, and the database decides how to find them.
That split is what makes SQL powerful, and it's also behind its
surprises: clauses that run in a different order from how you wrote
them, rows that come back in no particular order, and a NULL that
isn't equal to anything, itself included.

## Say what, not how

SQL grew out of IBM's System R project in the 1970s, where it was first
called SEQUEL (Structured English Query Language). It puts the
[[relational-model]] into words: tables in, a table out.

Take a shop database with `customers` and `orders`. You want the ten
customers who spent the most on paid orders, counting only customers
who spent more than 100:

```sql
SELECT c.name, sum(o.total) AS spent
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'paid'
GROUP BY c.name
HAVING sum(o.total) > 100
ORDER BY spent DESC
LIMIT 10;
```

Nothing here says which index to use, which table to read first, or
whether to sort or hash. That's the [[query-planner]]'s job. The same
query can run many different ways, all with the same result, and the
planner picks the one it expects to be fastest. You change how fast it
runs by adding [[indexes]] or rewriting the question, not by writing
loops.

A statement falls into one of a few groups:

- **Queries and changes** (DML): `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- **Schema** (DDL): `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE`.
- **Access control** (DCL): who may read or change what.

## The order clauses really run in

You write `SELECT` first, but logically it runs almost last. Postgres
documents the order a `SELECT` is processed in:

![Two columns. On the left, the clauses in the order you write them: SELECT, FROM and JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT. On the right, the order they are logically applied: FROM and JOIN, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT. Lines connect each clause to its position, and SELECT's line crosses the others to show it moves from first to fifth.](img/sql-clause-order.svg)

*Written order versus logical order. Adapted from the "general processing of SELECT" in the PostgreSQL 18 SELECT reference.*

1. **FROM and JOIN** build one big working table. Listing two tables
   with a comma gives every pairing of their rows; the join condition
   narrows that down (see [[joins]]).
2. **WHERE** throws away rows whose condition isn't true.
3. **GROUP BY** collapses the remaining rows into groups, and aggregates
   like `sum` are computed per group.
4. **HAVING** throws away whole groups.
5. **SELECT** computes the output columns.
6. **DISTINCT** removes duplicate output rows.
7. **ORDER BY** sorts.
8. **LIMIT / OFFSET** keeps a slice.

(Before all of these, any `WITH` queries are computed; see [[ctes]].
Set operators like `UNION` come between DISTINCT and ORDER BY.)

This order explains rules that otherwise look arbitrary:

- **You can't use an output alias in WHERE.** `WHERE spent > 100` fails,
  because `spent` doesn't exist yet when WHERE runs. ORDER BY can use it,
  because it runs after SELECT. That's why the query above repeats
  `sum(o.total)` in HAVING.
- **WHERE filters rows, HAVING filters groups.** A condition on an
  aggregate has to go in HAVING.
- **Every output column must be grouped or aggregated.** After GROUP BY,
  there's one row per group; a column that isn't in the GROUP BY list
  has no single value to show.

"Logically" is the key word. The order says what the result must be,
not what the engine does step by step. The planner is free to run a
query any way that produces the same rows. Postgres, for example,
usually computes output expressions after sorting and limiting, so an
expensive function in the SELECT list runs only for rows you actually
get back.

## Tables are bags, and order isn't promised

Relational algebra works on sets: no duplicates, no order. SQL works on
bags: still no order, but duplicates are allowed. A `SELECT` returns
duplicate rows unless you ask for `DISTINCT`. Oddly, `UNION` goes the
other way and removes duplicates unless you write `UNION ALL`.

Without `ORDER BY`, rows come back in whatever order the database finds
fastest. That order can change when the plan changes, and adding a
`LIMIT` can change the plan. So `LIMIT 10 OFFSET 10` without an
`ORDER BY` on a unique key can return different rows each time you run
it. That's by design, not a bug, and it matters for [[pagination]].

## NULL, and logic with three values

NULL marks a value that's missing or unknown. Comparing anything with
NULL gives neither true nor false but NULL, meaning "unknown". So
`7 = NULL` is NULL, `7 <> NULL` is NULL, and even `NULL = NULL` is
NULL: two unknowns aren't known to be equal.

WHERE keeps a row only when its condition is true. False and unknown
both drop it. That leads to a set of classic bugs:

- **`WHERE email = NULL` returns nothing, ever.** Use `IS NULL`.
- **`WHERE status <> 'banned'` skips rows where `status` is NULL.**
  Unknown isn't true.
- **`NOT IN` with a NULL returns no rows.** `WHERE id NOT IN (SELECT
  user_id FROM bans)` asks "is id different from every value?". If
  `bans.user_id` has one NULL, the answer for every non-matching id is
  "unknown", and every row is dropped. Filter NULLs out of the subquery
  (`WHERE user_id IS NOT NULL`).

When you really want "equal, counting two NULLs as equal", Postgres has
`IS NOT DISTINCT FROM`, and `IS DISTINCT FROM` for the opposite.

NULL is also inconsistent about whether two NULLs are "the same":

- `DISTINCT` and `UNION` treat NULLs as duplicates of each other, so you
  get one NULL row.
- A `UNIQUE` column lets you insert many NULLs, as if they were all
  different.

In Postgres, NULLs also sort as if larger than every other value, so
they come last in ascending order and first in descending, unless you
write `NULLS FIRST` or `NULLS LAST`.

## One standard, many dialects

SQL is a standard with a new edition every few years: SQL:1999
added [[triggers]] and regular expressions, SQL:2003
[[window-functions]], SQL:2016 JSON, SQL:2023 property graph queries. SQL-92 is roughly the
floor for calling something SQL. Every database implements part of the
standard and adds its own extensions.

`LIMIT` is a good example. It's Postgres and MySQL syntax, not
standard; the standard form, `OFFSET ... FETCH FIRST n ROWS ONLY`,
arrived in SQL:2008. A query you write for one database often needs
changes for another.

## Where it gets tricky

**The standard is unclear on NULLs, and engines disagree.** The
SQLite project found the standard's NULL rules ambiguous, so in 2002
volunteers ran a test script on other databases, and SQLite copied
what most of them did. The early results varied a lot and later
converged, but not completely: Informix and Microsoft SQL Server
treated NULLs as equal in a UNIQUE column when others didn't. The
script's author concluded that SQL's NULL rules can't be worked out by
logic, only found by experiment. Check your engine rather than
reasoning from first principles.

**Logical order isn't execution order.** People sometimes read the
clause order as a performance guide ("WHERE runs before the join, so
filter there"). The planner reorders freely as long as the answer is
the same; use `EXPLAIN` ([[explain]]) to see what actually runs.

**Rows repeat after a join.** Joining a customer to their orders gives
one row per order, with the customer's columns copied into each. Summing
a customer column after such a join counts it once per order.

**SQL is written by ORMs more than by people.** Many applications build
their SQL through an [[orm]], which can hide an [[n-plus-one]]
pattern. Being able to read the SQL it generates is part of the job.

**Strings pasted into SQL are code.** Building a query by concatenating
user input lets that input change the query. That's
[[sql-injection]].

## What this means when you build

- Describe the result; tune with indexes and by reading plans, not by
  reshaping the query into steps.
- Always `ORDER BY` a unique key when you use `LIMIT` or page through
  results.
- Use `IS NULL` and `IS NOT DISTINCT FROM`, never `= NULL`. Be wary of
  `NOT IN` over a column that can be NULL.
- Test NULL-heavy queries on the database you actually run.
- Never build SQL by pasting user input into the string.

## Further reading

- [SELECT](https://www.postgresql.org/docs/current/sql-select.html), PostgreSQL 18 documentation. The processing order of a SELECT, WHERE keeping only true rows, ORDER BY and NULL sorting, LIMIT without ORDER BY, and differences from the standard.
- [Comparison Functions and Operators](https://www.postgresql.org/docs/current/functions-comparison.html), PostgreSQL 18 documentation. Why `= NULL` never matches, and `IS DISTINCT FROM`.
- [Subquery Expressions](https://www.postgresql.org/docs/current/functions-subquery.html), PostgreSQL 18 documentation. The exact NULL rules behind the `NOT IN` trap.
- [Planner/Optimizer](https://www.postgresql.org/docs/current/planner-optimizer.html), PostgreSQL 18 documentation. How one query can run many ways with the same result, and how the planner chooses.
- [NULL Handling in SQLite Versus Other Database Engines](https://www.sqlite.org/nulls.html), D. Richard Hipp. How a dozen engines disagreed on NULLs, and why SQLite copied the majority.
- [Lecture #02: Modern SQL](https://15445.courses.cs.cmu.edu/fall2024/notes/02-modernsql.pdf), Andy Pavlo, CMU 15-445, 2024. SQL's history and standard editions, bags vs sets, aggregates and GROUP BY.

---
id: joins
title: Joins
depth: deep
phase: 6
note: >-
  Combining tables, and the three ways a database runs a join: nested
  loop, hash, merge.
needs: [sql]
leads_to: [query-planner]
compare_with: [n-plus-one]
---

# Joins

A join combines rows from two tables into one row wherever a condition
matches, usually a foreign key equal to a primary key. It's how a
normalized database puts facts back together, and it's one of the
operations a database most needs to do fast. Knowing what each kind of join
returns keeps your results right; knowing the three ways a database
runs one explains most slow queries.

## What a join returns

Start with two small tables:

- `customers`: Ana (id 1), Ben (id 2), Cy (id 3).
- `orders`: order 10 for customer 1, order 11 for customer 1, order 12
  for customer 3, and order 13 for customer 5 (a customer that was
  deleted).

Every join starts, logically, from the **cross product**: every row of
one table paired with every row of the other. 3 customers and 4 orders
give 12 pairs. The join condition, `orders.customer_id =
customers.id`, keeps only the pairs that match. The kinds of join differ
in what they do with rows that match nothing:

- **INNER JOIN** keeps matching pairs only. Ana appears twice (orders 10
  and 11), Cy once. Ben has no orders and disappears. Order 13 has no
  customer and disappears.
- **LEFT JOIN** keeps every customer. Ben shows up once, with NULLs in
  the order columns.
- **RIGHT JOIN** keeps every order. Order 13 shows up with NULLs in the
  customer columns.
- **FULL JOIN** keeps both: Ben and order 13 each get a row, padded
  with NULLs.
- **CROSS JOIN** skips the condition and returns all 12 pairs.

Two consequences catch people out. First, a join repeats data: Ana's
name is in two output rows because she has two orders. Second, an inner
join silently drops rows, so "count customers" after an inner join to
orders gives 2, not 3.

In SQL you can write a join in two ways, and for inner joins they mean
the same thing:

```sql
SELECT * FROM customers c, orders o WHERE o.customer_id = c.id;
SELECT * FROM customers c JOIN orders o ON o.customer_id = c.id;
```

`USING (col)` is shorthand when both columns have the same name.
`NATURAL JOIN` joins on every column name the two tables share, which is
fragile: add a column called `updated_at` to both tables and the join
quietly changes meaning.

## ON and WHERE aren't the same for outer joins

With an inner join, a condition can go in ON or WHERE and the result is
the same. With an outer join it can't. ON is applied while joining;
WHERE is applied to the joined result.

```sql
-- every customer, with their paid orders if any
SELECT * FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status = 'paid';

-- only customers with a paid order: Ben's NULL row fails the WHERE
SELECT * FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'paid';
```

The second query is a LEFT JOIN that behaves like an inner join,
because `NULL = 'paid'` isn't true and WHERE drops the row (see
[[sql]] for why).

## Three ways to run a join

The result is defined by the cross product, but no database computes
it that way on real tables: it's far too big. Instead it picks one of
three algorithms. Postgres has exactly these three, and the
[[query-planner]] estimates the cost of each and picks the cheapest.

![Three panels. Nested loop: for each row of the outer table, an arrow goes into the inner table, either scanning it all or doing one index lookup. Hash join: the smaller input is read once into a hash table keyed on the join column (build), then the larger input is streamed past it, each row looking up its bucket (probe). Merge join: both inputs sorted on the key, two cursors step down them together like a zipper, emitting matches.](img/joins-three-algorithms.svg)

*The three join algorithms. Adapted from Andy Pavlo, "Join Algorithms" (CMU 15-445, 2024), and the PostgreSQL 18 planner documentation.*

### Nested loop

For each row of the outer table, look through the inner table for
matches. Written out as code, it's two nested `for` loops.

On its own this is slow: the inner table is scanned once per outer row.
With an [[indexes|index]] on the inner table's join column it becomes
fast for small inputs, because each outer row needs one index lookup instead of a
scan. That's the **index nested loop**.

Because it compares pairs one by one, it doesn't need an equality
condition. A hash join does: `a.start < b.end` has no single key to
hash.

### Hash join

1. **Build.** Read the smaller input once and put every row into a hash
   table keyed on the join column.
2. **Probe.** Stream the other input past it. For each row, hash its key,
   jump to that bucket, and compare the actual values (different keys
   can land in one bucket).

Each input is read once, and no index on the join column is needed.
For two large inputs joined on equality it's usually the fastest of
the three. It only works for equality on the full join key, and it needs memory for the hash table.
When the hash table doesn't fit, the database splits both inputs into
partitions on disk by hash and joins them partition by partition, at
the cost of writing and reading everything again.

### Merge join

Sort both inputs on the join key, then walk down them together with two
cursors, like closing a zipper, emitting matching pairs. Each input is
scanned once after sorting.

The sort is the expensive part, so a merge join shines when the inputs
already come out sorted, for example by reading them through an index
on the join key, or when the query wants its output sorted on that key
anyway.

### Which one wins

| | Good when | Needs |
|---|---|---|
| Nested loop | the outer side is small and the inner side has an index | an index, or a tiny inner table |
| Hash | two large inputs, equality join | memory for the smaller side |
| Merge | inputs already sorted on the key | sorted inputs, or a sort |

Course notes from CMU's database class work one example under stated
assumptions (1,000 pages joined to 500, 0.1 ms per disk read): a naive
nested loop takes about 1.4 hours, a block nested loop 50 seconds,
sort-merge 0.75 seconds and a hash join 0.45 seconds. The exact numbers
come from the assumptions, but the gap between a naive loop and the
others is the point.

## Join order

A query with more than two tables is run as a tree of two-table joins.
Joining A to B to C can go (A⋈B)⋈C, (B⋈C)⋈A or (A⋈C)⋈B, and all give the
same rows at wildly different costs. If A and C share no condition,
(A⋈C) is a full cross product.

The number of possible orders grows exponentially with the number of
tables. Postgres searches nearly all of them for small queries, but past
about ten tables that's impractical. Above a threshold
(`geqo_threshold`) it switches to a genetic search that finds a
reasonable plan, not necessarily the best one.

Outer joins limit the choice, because moving them changes the result.
A FULL JOIN fixes the order completely. Writing `INNER JOIN` explicitly
doesn't fix anything: to Postgres it's the same as a comma list, and the
planner still picks the order.

## Where it gets tricky

**Joins aren't slow by default.** A common belief is that joins don't
scale. A join with the right index, or a hash join over two scans, is
often much cheaper than fetching the same rows in many separate queries.
When a join is slow, look at the plan first: the planner picks the
algorithm and order from its row estimates, and wrong estimates
([[table-statistics]]) or a missing index can push it to a bad choice.

**The N+1 pattern is a nested loop in your application.** Loading a list
of customers, then running one query per customer for their orders, is
the nested loop algorithm with a network round trip added to every
inner lookup. It's the same index lookups as a real join, plus N round
trips. Round trips cost far more than the extra bytes a join sends back
([[n-plus-one]]).

**MySQL got hash joins late.** MySQL added hash joins in 8.0.18
and removed its block nested loop join in 8.0.20; before that, a join
without a usable index fell back to nested loops. Hash joins in MySQL
spill to disk when they outgrow `join_buffer_size`.

**"Build" and "probe" sides get different names.** Postgres's docs call
the hashed side the right (inner) relation; CMU's notes build from the
outer one. Either way, you want the smaller input on the hashed side.

**Duplicates multiply.** If both sides have several rows per key (a
many-to-many join by accident), the result has every combination. A
query that joins customers to orders and to addresses returns orders ×
addresses rows per customer, and sums over it are wrong.

## What this means when you build

- Know what each join type does to unmatched rows. Put outer join
  conditions in ON, not WHERE, unless you mean to filter them out.
- Index foreign key columns you look up by, so small joins can use an
  index nested loop.
- Let the database do joins instead of looping in your code.
- When a join is slow, read the plan ([[explain]]): which algorithm,
  which order, and whether the row estimates are close to the actual
  rows.
- Avoid `NATURAL JOIN` in application code.

## Further reading

- [Planner/Optimizer](https://www.postgresql.org/docs/current/planner-optimizer.html), PostgreSQL 18 documentation. The three join strategies Postgres has and how it searches join orders.
- [Controlling the Planner with Explicit JOIN Clauses](https://www.postgresql.org/docs/current/explicit-joins.html), PostgreSQL 18 documentation. Why join order matters, how fast the choices grow, and how outer joins restrict them.
- [Table Expressions](https://www.postgresql.org/docs/current/queries-table-expressions.html), PostgreSQL 18 documentation. Every join type on small example tables, and ON vs WHERE in outer joins.
- [Lecture #12: Join Algorithms](https://15445.courses.cs.cmu.edu/fall2024/notes/12-joins.pdf), Andy Pavlo, CMU 15-445, 2024. Nested loop, sort-merge and hash joins with a disk cost model and a worked comparison.
- [Hash Join Optimization](https://dev.mysql.com/doc/refman/8.0/en/hash-joins.html), MySQL 8.0 Reference Manual. When MySQL gained hash joins and dropped block nested loop, and how it spills to disk.
- [Nested Loops](https://use-the-index-luke.com/sql/join/nested-loops-join-n1-problem), Markus Winand, Use The Index, Luke. The nested loop join explained through the ORM N+1 problem, and why round trips dominate.

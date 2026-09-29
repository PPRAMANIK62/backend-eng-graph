---
id: covering-indexes
title: Covering indexes
depth: short
phase: 6
note: >-
  Answering a query from the index alone, with no trip to the table.
needs: [indexes, composite-indexes]
leads_to: []
compare_with: []
---

# Covering indexes

A covering index holds every column a query needs, so the database can
answer from the index alone and never read the table. Postgres calls
this an *index-only scan*. For queries that read many rows it can remove
most of the work, but in Postgres it only pays off on tables whose rows
don't change much.

## Skipping the trip to the table

An ordinary index lookup finds matching entries in the index, then
fetches each row from the table's heap (see [[indexes]]). In Postgres
every index is separate from the heap, and matching rows are usually
scattered across it, so those fetches are mostly random reads. For a
query that matches thousands of rows, they're most of the cost.

Take this query:

```sql
SELECT total FROM orders WHERE customer_id = 42;
```

With an index on `customer_id` alone, Postgres finds customer 42's
entries, then visits the heap for each one to read `total`. If the index
also holds `total`, it has everything and can skip the heap. There are
two ways to build that:

```sql
-- total as a second key column (works in any version)
CREATE INDEX orders_cust_total ON orders (customer_id, total);

-- total as a payload column, PostgreSQL 11 and later
CREATE INDEX orders_cust_incl ON orders (customer_id) INCLUDE (total);
```

Both allow an index-only scan. The `INCLUDE` version stores `total` only
in the leaf pages, not in the upper levels of the tree, and doesn't sort
by it. So it can't help an `ORDER BY total`, but it keeps the upper
levels small and says plainly why the column is there. If you use the
older key-column way, put the extra column last: a payload column in
front would break the index for its real job (see
[[composite-indexes]]).

Two more rules decide whether an index-only scan is possible at all.
The index type must store the full value: B-tree always does, GIN never
does (its entries hold pieces of values). And the query must use only
columns in the index, in the `SELECT` list and the `WHERE` clause.
Adding `AND created_at > ...` to the query above, with `created_at` not
in the index, sends every row back to the heap.

## The visibility map catch

Postgres has one more hurdle, from [[mvcc]]. An index entry doesn't say
whether its row version is visible to your [[transaction]]; only the heap
does. So after finding an entry, an index-only scan checks the table's
*visibility map*, which has a bit per heap page meaning "every row here
is visible to everyone". If the bit is set, the value comes straight
from the index. If not, Postgres visits the heap anyway, and you've
gained nothing over a plain index scan.

The visibility map is tiny, four orders of magnitude smaller than the
heap, so checking it is cheap. [[vacuum]] is what marks pages
all-visible, and a page stays marked only until it's modified again. On
a table that's mostly static, most pages are marked and index-only scans
work. On a table where rows change constantly, they often aren't.

## Where it gets tricky

**The name.** "Covering index" sounds like a property of the index, but
what matters is whether a particular query can run as an index-only
scan. Markus Winand avoids the term for that reason. The same index
covers one query and not the next.

**Unique indexes with INCLUDE.** In `CREATE UNIQUE INDEX ... (x) INCLUDE
(y)`, uniqueness applies to `x` only. That's handy: you can make a
[[primary-keys|primary-key]] index also cover a query without changing what's unique.

**Payload isn't free.** Extra columns duplicate table data and make the
index bigger, which can slow searches.
An entry too large for the index fails the insert. And wide payload is
wasted on a busy table where the heap gets visited anyway.

**Expressions confuse the planner.** An index on `f(x)` can't be used for
an index-only scan of `SELECT f(x)` in current Postgres, because the
planner wants `x` itself in the index. Adding `INCLUDE (x)` works around
it.

## What this means when you build

- Reach for a covering index when a hot query reads many rows but few
  columns, such as sums and counts per customer.
- Prefer `INCLUDE` for columns you only read, and keep them narrow.
- Check with [[explain]] that the plan really says `Index Only Scan`.
- Make sure vacuum keeps up on tables you rely on for index-only scans.
- Avoid `SELECT *` in queries you want covered.

## Further reading

- [PostgreSQL documentation, 11.9 Index-Only Scans and Covering Indexes](https://www.postgresql.org/docs/current/indexes-index-only-scans.html), PostgreSQL Global Development Group, version 18. The rules, the visibility map, INCLUDE, and the corner cases.
- [PostgreSQL documentation, 24.1 Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html), PostgreSQL Global Development Group, version 18. Section 24.1.4: how vacuum maintains the visibility map that index-only scans depend on.
- [A Close Look at the Index Include Clause](https://use-the-index-luke.com/blog/2019-04/include-columns-in-btree-indexes), Markus Winand, 2019. Why INCLUDE columns live only in the leaves, what that changes, and why he avoids the term "covering index".

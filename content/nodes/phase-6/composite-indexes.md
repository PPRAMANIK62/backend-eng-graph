---
id: composite-indexes
title: Composite indexes
depth: short
phase: 6
note: >-
  Indexes on several columns, and why column order decides which queries
  use them.
needs: [indexes]
leads_to: [covering-indexes]
compare_with: []
---

# Composite indexes

A composite index (Postgres calls it a multicolumn index) is one [[indexes|index]] over several columns. It's sorted by the first
column, then by the second within each value of the first, and so on,
like a phone book sorted by surname and then first name. That order
decides which queries it helps. Get the column order right and one index
serves several queries; get it wrong and it barely helps the one you
built it for.

## Sorted by the first column, then the next

Take an `orders` table and this query:

```sql
SELECT id, total FROM orders
WHERE customer_id = 42
  AND created_at >= now() - interval '30 days';
```

An index on `(customer_id, created_at)` stores all of customer 42's
entries next to each other, and within them in date order. The database
walks the tree to "customer 42, first date in range", reads forward
until the last date in range, and stops. Every entry it reads is a
match.

Now flip it to `(created_at, customer_id)`. The index is sorted by date
first. The entries for the date range are next to each other, but
customer 42's entries are scattered through that range among every
other customer's orders. The database has to read the whole date range
and check `customer_id` on each entry. It still skips the table for
non-matching entries, since the check happens inside the index, but it
reads far more of the index.

![Two strips of index entries in sorted order for the query customer_id = 42 and created_at in the last 30 days. Top, index on (customer_id, created_at): customer 42's recent entries sit together and the scan reads 3 entries, all matches. Bottom, index on (created_at, customer_id): recent entries for many customers are interleaved, and the scan reads 8 entries to find the same 3 matches.](img/composite-indexes-column-order.svg)

*Same query, same columns, different order. Adapted from Markus Winand, "Greater, Less and BETWEEN", figures 2.2 and 2.3 (Use The Index, Luke).*

## The rule for B-tree indexes

For a B-tree in Postgres, the part of the index that gets scanned is
bounded by:

- equality conditions on the leading columns, in order, plus
- one range condition (`<`, `>`, `BETWEEN`) on the first column that
  doesn't have an equality condition.

Conditions on columns after that are still checked inside the index,
which saves visits to the table, but they don't shrink the range that
gets read. That gives the usual rule of thumb: **equality columns first,
then the range column.**

It also explains the leftmost-prefix rule. An index on `(a, b, c)` helps
queries on `a`, on `a` and `b`, and on all three. A query on `b` alone
has no leading equality to start from.

## Where it gets tricky

**"Most selective column first" is a myth.** People often put the column
with the most distinct values first. What matters is which conditions
are equalities and which are ranges. In the example above both orders
use the same two columns; only the order changes how much is read.

**Skip scan (PostgreSQL 18) bends the leftmost-prefix rule.** Since
version 18, a B-tree scan can handle a missing leading condition by
trying each value of the leading column in turn, as if you'd written
`customer_id = 1`, then `= 2`, and so on. That only pays off when the
leading column has few distinct values, so most of the index can be
skipped. With many distinct values the planner will usually still
choose a sequential scan. It can also skip inside a scan: with `a = 5 AND b >= 42 AND c < 77`
on `(a, b, c)`, it can jump past runs of entries where `c` can't match
instead of reading them.

**Other index types treat order differently.** In Postgres, B-tree,
GiST, GIN and BRIN support several columns. For GIN and BRIN the column
order makes no difference to search speed. For GiST, like B-tree, the
first column matters most. See [[index-types]].

**More columns isn't better.** Postgres allows up to 32 columns, but an
index with more than three is rarely useful unless the table's queries
are very uniform. Most of the time a single-column index is enough, and
it's smaller and cheaper to keep up.

## What this means when you build

- Put columns tested with `=` first, then the one tested with a range.
- Before adding a second index, check whether reordering or extending an
  existing composite index serves both queries.
- A composite index on `(a, b)` already serves queries on `a` alone, so
  check it before adding a separate index on `a`.
- If you need to fetch extra columns without touching the table, add
  them at the end or with `INCLUDE`; that's [[covering-indexes]].
- On PostgreSQL 18, don't count on skip scan for a high-cardinality
  leading column.

## Further reading

- [PostgreSQL documentation, 11.3 Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html), PostgreSQL Global Development Group, version 18. The exact scan rule for B-tree, how skip scan works, and how other index types treat several columns.
- [Greater, Less and BETWEEN](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/greater-less-between-tuning-sql-access-filter-predicates), Markus Winand. Drawings of the scanned range for both column orders, and the "equality first, then ranges" rule.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/), PostgreSQL Global Development Group, 2025. B-tree skip scan arrives in version 18.

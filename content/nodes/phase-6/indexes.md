---
id: indexes
title: Indexes
depth: deep
phase: 6
note: >-
  An extra structure that finds rows without reading the whole table,
  and what it costs every write.
needs: [sql]
leads_to: [index-types, composite-indexes, covering-indexes, partial-indexes, query-planner, partitioned-secondary-indexes, b-plus-tree, heap-files, table-partitioning, hot-updates]
compare_with: [pagination]
---

# Indexes

An index is a second copy of some of a table's data, kept sorted, with
a pointer back to each row. It lets the database jump to the rows a
query wants instead of reading the whole table. You pay for it on
every write, because the database has to keep that copy in step with
the table.

## A table with no index

Take a `users` table with a few million rows and this [[sql|SQL]] query:

```sql
SELECT name FROM users WHERE email = 'ada@example.com';
```

With no index on `email`, Postgres has one option: read the table from
the first row to the last and check each one. That's a sequential scan.
The rows sit in the table's heap in no useful order (see
[[heap-files]]), so a match could be anywhere, and there could be more
than one. The work grows with the size of the table, whether the query
returns one row or none.

Now add an index:

```sql
CREATE INDEX users_email_idx ON users (email);
```

Postgres builds a B-tree over the `email` values. The same query now
walks a few levels of that tree to the right spot, reads the matching
entry, and follows its pointer to the row.

## What's inside a B-tree index

The B-tree is what `CREATE INDEX` builds unless you name another type,
and the one you'll use most. (The
others are in [[index-types]]; the on-disk structure itself is
[[b-plus-tree]] in phase 7.) It's built from fixed-size [[database-pages|pages]].

- **Leaf pages** hold the index entries: an `email` value and a pointer
  to the row in the heap. Entries are sorted within each page, and the
  leaf pages are chained to their neighbours, so the database can read a
  run of values in order in either direction.
- **Internal pages** sit above the leaves. Each entry points one level
  down and carries a key that separates the pages below, so a lookup
  knows which way to go.
- **The root** is the single page at the top.

The tree is balanced: every leaf is the same distance from the root.
Each page holds hundreds of entries, so each extra level multiplies the
reach of the tree by hundreds. Real indexes over millions of rows are
typically four or five levels deep. In Postgres over 99% of a B-tree's
pages are leaves. The levels above them are a small fraction of the
index.

![A B-tree over a users table. A root page points to three leaf pages sorted by email, linked left to right. A lookup for ada@example.com goes root, then the first leaf (step 1), may continue along the leaf chain (step 2), then follows each entry's pointer into a heap page elsewhere in the table (step 3). Heap pages hold rows in no particular order.](img/indexes-btree-lookup.svg)

*The three steps of an index lookup. Only the first has a fixed cost. Adapted from Markus Winand, "The Search Tree (B-Tree) Makes the Index Fast" and "Slow Indexes, Part I" (Use The Index, Luke).*

## The three steps of a lookup

Every index lookup does up to three things:

1. **Walk the tree** from the root to the first matching leaf entry. This
   costs one page per level, a handful of pages at most.
2. **Follow the leaf chain** while the entries still match. For a unique
   email that's one entry. For `WHERE created_at > now() - interval '1
   day'` it could be thousands of entries across many leaf pages.
3. **Fetch each row from the table.** Every entry points somewhere in
   the heap, and matching rows are usually scattered across many heap
   pages. That can mean one page read per row.

Only step 1 has an upper bound. Steps 2 and 3 grow with the number of
matching rows. That's the real reason a query that "uses an index" can
still be slow, and why rebuilding the index usually doesn't help: the
tree was never the problem, the thousands of table fetches were.

Postgres softens step 3 with a *bitmap* scan: collect the row locations
from the index first, sort them into physical order, then read the heap
pages in that order. That's cheaper than jumping around, but it still
reads every page that holds a match. When a query matches a large share
of the table, a plain sequential scan wins, and the planner will pick it
even though the index exists. Deciding that is the job of the
[[query-planner]], using [[table-statistics]] to guess how many rows
will match.

## Which queries can use it

An index helps conditions of the form *indexed column, operator, value*,
where the operator is one the index type knows how to search with (for a
B-tree, comparisons such as `=`, `<` and `>`; other types are in
[[index-types]]). The left side has to be exactly what the index was
built on. An index on `email` doesn't help `WHERE lower(email) = ...`,
unless you build the index on the expression `lower(email)` itself.

Indexes aren't only for `SELECT`. An `UPDATE` or `DELETE` with a `WHERE`
clause finds its rows the same way. And an index on a column used in a
join condition can speed up [[joins]] a lot. Because the leaves are
sorted, an index scan also returns rows in index order, so an `ORDER BY`
on the indexed column may need no separate sort step.

Several variations build on the same structure: indexes over several
columns ([[composite-indexes]]), indexes that carry extra columns so the
table isn't touched at all ([[covering-indexes]]), and indexes over only
some rows ([[partial-indexes]]).

## What every index costs you

The database keeps every index in sync with the table, on every write.

**Inserts.** A new row's index entry can't go just anywhere: it belongs
on one particular leaf page, in sorted order. If that page is full, it splits in two,
and the parent gets a new entry. If the parent is full, it splits too.
A split that reaches the root adds a new level. Every index on the table
repeats this work for every row.

**Updates in Postgres.** Postgres uses [[mvcc]]: an update doesn't change
the row in place, it writes a new version of the row somewhere in the
heap. The new version has a new location, so in general every index on
the table needs a new entry pointing to it, including indexes on columns
you didn't touch. Uber's engineers described this on Postgres 9.2 as
write amplification: with a dozen indexes on a table, changing one
indexed column means writing the new row plus an entry in all twelve
indexes. Each of those writes also goes to the [[write-ahead-log]], and
from there to every [[replication|replica]]. (The general idea is in [[amplification]].)

**The HOT exception.** Postgres avoids that cost when the update
changes no indexed column and the new version fits on the same page:
a [[hot-updates|heap-only tuple (HOT) update]] adds no index entries at
all. So an index on a column you update often costs more than its own
upkeep: it turns those updates into full updates that touch every
index.

**Cleanup.** The old row versions leave dead entries in the index. B-tree
indexes delete some of them as they go (bottom-up deletion, added in
PostgreSQL 14), but a full pass by [[vacuum]] is still needed eventually.

**Building one.** A plain `CREATE INDEX` lets reads continue but blocks
every insert, update and delete on the table until the build finishes,
and on a large table the build can take a long time. `CREATE INDEX
CONCURRENTLY` lets writes continue, but it takes longer and has
caveats, covered in [[ddl-locks]].

## Where it gets tricky

**"It has an index, so it's fast" isn't true.** An index guarantees a
cheap tree walk, nothing more. A query that matches half the table will
either read half the table through the index, one page per row, or skip
the index and scan. Check the plan with [[explain]] instead of assuming.

**Unused indexes aren't free.** Every index adds work to every write and
can stop updates from being HOT, whether any query uses it or not. Drop
indexes that are seldom or never used.

**Rebuilding rarely fixes slowness.** A B-tree stays balanced by design.
If a query is slow while using an index, look at how many rows it reads
and fetches, not at the tree.

**The write-amplification story has two sides.** Read quickly, Uber's
post sounds like "Postgres touches every index on every update". That's true
when the update changes an indexed column or the new version doesn't fit
on the page, as in Uber's example. It's not true for HOT updates. Which
case you're in depends on your indexes and your update pattern, and
Postgres counts HOT updates for each table in `pg_stat_all_tables`, so
you can check.

## What this means when you build

- Index for the queries you actually run: the columns in `WHERE`, join
  conditions and `ORDER BY`. Don't index every column "just in case".
- Count the cost: each index is extra work on every insert, and on every
  update that isn't HOT.
- Be wary of indexing columns you update constantly (a `last_seen_at`,
  a counter). It can switch those updates off the HOT path.
- On a live table, build indexes with `CREATE INDEX CONCURRENTLY`.
- Look for indexes nothing uses, and drop them.
- When a query is slow despite an index, count the rows it touches. The
  fix is usually a better index (or fewer rows), not a rebuild.

## Further reading

- [PostgreSQL documentation, 11.1 Introduction (Indexes)](https://www.postgresql.org/docs/current/indexes-intro.html), PostgreSQL Global Development Group, version 18. What an index does, which conditions can use one, and what it costs on writes.
- [PostgreSQL documentation, 65.1 B-Tree Indexes](https://www.postgresql.org/docs/current/btree.html), PostgreSQL Global Development Group, version 18. How Postgres's B-tree is laid out, how pages split, and how dead entries get cleaned up.
- [PostgreSQL documentation, 66.7 Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/current/storage-hot.html), PostgreSQL Global Development Group, version 18. The exact conditions under which an update skips the indexes.
- [The Search Tree (B-Tree) Makes the Index Fast](https://use-the-index-luke.com/sql/anatomy/the-tree), Markus Winand. The clearest picture of leaves, branches and the tree walk, and why real trees are shallow.
- [PostgreSQL documentation, 14.1 Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), PostgreSQL Global Development Group, version 18. Bitmap scans, index scans and why an index scan returns rows in index order.
- [Slow Indexes, Part I](https://use-the-index-luke.com/sql/anatomy/slow-indexes), Markus Winand. Why an index lookup can still be slow: the three steps and which ones grow.
- [PostgreSQL documentation, CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html), PostgreSQL Global Development Group, version 18. B-tree as the default method, and what `CONCURRENTLY` changes about locking.
- [Why Uber Engineering Switched from Postgres to MySQL](https://www.uber.com/blog/postgres-to-mysql-migration/), Evan Klitzke, 2016. Write amplification from indexes on Postgres 9.2, and how it spreads to the WAL and replicas.

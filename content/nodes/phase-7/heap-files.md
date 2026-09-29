---
id: heap-files
title: Heap vs clustered tables
depth: short
phase: 7
note: >-
  Rows kept in no order with indexes pointing at them, vs a table stored
  inside its primary key's B+tree.
needs: [database-pages, b-plus-tree, indexes]
leads_to: [mvcc]
compare_with: [primary-keys]
---


# Heap vs clustered tables

There are two common ways to store a table's rows. In a heap file, rows
sit on whatever page had room, in no order, and every index points at
the row's physical address. In a clustered (index-organized) table, the
rows live inside the primary key's [[b-plus-tree]], sorted by key, and
other indexes point at the primary key instead. Postgres uses the first,
InnoDB the second, and [[sqlite|SQLite]] lets you pick. The choice changes what an
update costs and how many tree searches a lookup takes.

## The heap: rows anywhere, indexes point at addresses

A Postgres table is an array of [[database-pages|pages]], and all of
them are equal: any row can go on any page that has room. Nothing about
the row's key decides where.

Since the rows aren't sorted, finding one needs an [[indexes|index]].
Each index entry is a key plus the row's address, its CTID: a page
number and a slot number on that page. Every index goes straight from
key to address in one tree search.

The cost shows up on updates. In Postgres an update writes a new version
of the row ([[mvcc]]), and a new version can mean a new address. Then every index
on the table needs a new entry pointing at it, even indexes on columns
you didn't change. Postgres avoids that in one case, the [[hot-updates|heap-only tuple]]
(HOT) update: if no indexed column changed and the new version fits on
the same page, the indexes are left alone.

## The clustered table: rows inside the primary key

InnoDB turns this around. Every InnoDB table has a clustered index that
holds the rows themselves, and it's normally the primary key. The
leaves of the primary key's B+tree are the table. Rows are stored in key
order.

A lookup by primary key walks that one tree and lands on the page that
holds the whole row. No second hop.

Other indexes, called secondary indexes, don't store a physical
address. Each entry stores the row's primary key columns. Looking up by a secondary index
means two tree searches: the secondary index to get the primary key,
then the clustered index to get the row.

If you don't declare a primary key, InnoDB uses the first unique index
whose columns are all `NOT NULL`. If there's none, it makes up a hidden
6-byte row id that increases with each insert, so rows end up in
insertion order.

![Two table layouts side by side. Left, a heap: heap pages hold rows in no order; the primary key index and a secondary index on email both have leaf entries pointing to a page and slot, such as (7, 2). Right, a clustered table: the primary key B+tree's leaf pages hold the full rows sorted by id; a secondary index on email has leaf entries holding the primary key, such as id 42, which leads to a second search in the primary key tree.](img/heap-files-heap-vs-clustered.svg)

*A heap table versus a clustered table, and what their indexes point at.*

## SQLite: both, per table

SQLite shows the trade in one database. An ordinary table is a B+tree
keyed by a hidden integer, the rowid, with the rows in its leaves. If
you declare `INTEGER PRIMARY KEY`, that column becomes the rowid, so the
table is clustered on your key. Declare any other primary key, say
`word TEXT PRIMARY KEY`, and it's only a separate unique index holding
the word and the rowid. Every word is then stored twice, and a lookup
by word takes two searches.

Add `WITHOUT ROWID` and the table becomes a single B-tree keyed by
`word`. In the SQLite docs' example that takes about half the space and
runs nearly twice as fast. The catch is that WITHOUT ROWID tables also
keep row data in inner nodes, which lowers the fanout, so they suit small
rows: under about 1/20 of a page.

## Where it gets tricky

**Neither wins everywhere.** A heap makes every index a single hop but
pays on updates that move rows; a clustered table makes primary key
lookups and key-range scans cheap but makes every secondary lookup a
double search. Which is better depends on how you query and update.

**The primary key's size leaks everywhere in a clustered table.** Every
secondary index carries a copy of it. A long primary key makes all of
them bigger.

**Insert order follows the key.** In a clustered table, random keys
scatter inserts over the whole tree; see [[primary-keys]] for why that
hurts.

## What this means when you build

- On Postgres, expect an index on a frequently updated column to cost
  more than the index itself: it stops those updates from being HOT.
- On InnoDB, keep the primary key short, and remember that a secondary
  index lookup is two searches ([[covering-indexes]] covers the way
  around it).
- On SQLite, consider WITHOUT ROWID for tables with a text or composite
  primary key and small rows.

## Further reading

- [Database Page Layout](https://www.postgresql.org/docs/current/storage-page-layout.html), PostgreSQL documentation, version 18. Any row on any page, and the page-plus-slot address (CTID) that indexes point at.
- [Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/current/storage-hot.html), PostgreSQL documentation, version 18. Why a heap update can mean a new entry in every index, and the case where it doesn't.
- [Clustered and Secondary Indexes](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html), MySQL 8.4 Reference Manual. InnoDB's clustered index, the hidden row id, and why secondary indexes carry the primary key.
- [Clustered Indexes and the WITHOUT ROWID Optimization](https://www.sqlite.org/withoutrowid.html), SQLite developers. Both layouts in one database, with a worked example of the space and speed difference.

---
id: hot-updates
title: HOT updates
depth: short
phase: 8
note: >-
  Heap-only tuples: how Postgres skips index writes on an update when no
  indexed column changed.
needs: [mvcc, indexes]
leads_to: []
compare_with: []
---

# HOT updates

In Postgres, an `UPDATE` never changes a row in place. Under [[mvcc]] it
writes a new version of the row and leaves the old one for readers who
still need it. A new version lives at a new spot in the table, so every
index on the table would need a new entry pointing to it. HOT, short for
heap-only tuples, is the optimization that skips those index writes when
it safely can.

## Why updates are expensive without it

Take a `users` table with a dozen [[indexes]], and an update that
changes only `last_login`, a column no index covers. Without HOT, the
new row version needs an entry in all twelve indexes, even though none
of their keys changed, because each index entry points at a physical
row location. Every one of those writes also goes to the
[[write-ahead-log]] and on to replicas. Uber's engineers described
exactly this write amplification, on Postgres 9.2, as one reason they
moved a large system to MySQL.

## When an update can be HOT

Postgres makes the update heap-only when both of these hold:

1. **No indexed column changed.** Summarizing indexes don't count, and
   the only one in core Postgres is BRIN.
2. **The new version fits on the same page** as the old one.

Then two things get cheaper.

**No new index entries.** The indexes keep pointing at the original
row's slot on the page. The new version sits on the same page, chained
from the old one, so a lookup through the index lands on the old slot
and follows the chain to the version its snapshot can see.

**Cleanup without vacuum.** When a row is updated many times, the
versions in the middle of the chain can be removed during normal work,
even by a `SELECT` that touches the page, instead of waiting for
[[vacuum]]. The original slot becomes a redirect to the oldest version
some transaction may still see, and the freed slots are reused.

## Where it gets tricky

**One index can switch HOT off.** Adding an index on a column that gets
updated often (a counter, a status, a timestamp) turns every one of
those updates into a full update that writes every index. That index
costs far more than its own size, whether or not any query uses it.

**Free space on the page decides it.** If the page is full, the new
version goes to another page and the update isn't HOT. Lowering the
table's `fillfactor` leaves room on each page for new versions. HOT
updates still happen without it, as rows move around and pages gain
free space, just less often.

**It's specific to Postgres.** Other engines store old versions
differently ([[mvcc]] compares the designs), so HOT is a Postgres
answer to a Postgres problem.

## What this means when you build

- Before adding an index on a column that changes a lot, ask whether it
  will cost you HOT updates on a busy table.
- On tables with heavy updates to non-indexed columns, try a lower
  `fillfactor` and watch the result.
- Postgres counts HOT and non-HOT updates per table in
  `pg_stat_all_tables`. A falling HOT share after a schema change is a
  sign an index is in the way.

## Further reading

- [Heap-Only Tuples (HOT)](https://www.postgresql.org/docs/current/storage-hot.html), PostgreSQL documentation, version 18. The two conditions, what HOT saves, pruning without vacuum, fillfactor and monitoring.
- [Why Uber Engineering Switched from Postgres to MySQL](https://www.uber.com/blog/postgres-to-mysql-migration/), Evan Klitzke, Uber, 2016. Write amplification from updates that touch every index, on Postgres 9.2.

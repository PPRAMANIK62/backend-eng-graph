---
id: ddl-locks
title: DDL locks
depth: short
phase: 6
note: >-
  Which ALTER TABLE statements lock or rewrite the table, and how one
  waiting ALTER blocks every query behind it. lock_timeout.
needs: [schema-migrations]
leads_to: [zero-downtime-migrations]
compare_with: [long-running-transactions]
---

# DDL locks

Every `ALTER TABLE`, `CREATE INDEX` or `DROP` in your
[[schema-migrations|migrations]] locks the table it changes, and some
of those locks stop every other query on it. Many schema changes only
touch the catalog and finish at once. The trouble is the time spent *waiting* for the lock,
because everything behind a waiting change waits too.
That's how a migration that takes no time on your laptop takes an API
down.

## Eight lock modes, one question: what conflicts?

Postgres has eight table-level lock modes (`ROW EXCLUSIVE` is a table
lock, despite the name). What separates them is which other modes they
conflict with. Every query takes one without you asking:

- `SELECT` takes `ACCESS SHARE`, the weakest.
- `INSERT`, `UPDATE`, `DELETE` and `MERGE` take `ROW EXCLUSIVE`.
- Most `ALTER TABLE` forms take `ACCESS EXCLUSIVE`, the strongest. It
  conflicts with every mode, including a plain `SELECT`. It's the only
  mode that blocks plain reads.

The DDL that matters for migrations, as of Postgres 18:

| Change | Lock taken | Work on the table |
|---|---|---|
| `ADD COLUMN`, no default or a non-volatile one (a constant, say) | `ACCESS EXCLUSIVE` | catalog only |
| `ADD COLUMN` with a volatile default like `clock_timestamp()` | `ACCESS EXCLUSIVE` | rewrites table and indexes |
| `ALTER COLUMN ... TYPE` (most type changes) | `ACCESS EXCLUSIVE` | rewrites table and indexes |
| `DROP COLUMN` | `ACCESS EXCLUSIVE` | catalog only (the column is hidden) |
| `SET NOT NULL`, `ADD CHECK` | `ACCESS EXCLUSIVE` | scans every row |
| `ADD FOREIGN KEY` | `SHARE ROW EXCLUSIVE` on both tables | scans every row |
| any of the constraints above with `NOT VALID` | same lock | no scan |
| `VALIDATE CONSTRAINT` | `SHARE UPDATE EXCLUSIVE` | scans, writes keep going |
| `CREATE INDEX` | `SHARE` (blocks writes) | builds the index |
| `CREATE INDEX CONCURRENTLY` | `SHARE UPDATE EXCLUSIVE` | builds the index, writes keep going |

An `ALTER TABLE` with several parts takes the strongest lock any part
needs, and holds it until the [[transaction]] ends.

How much a change hurts is lock strength times time held. A rewrite
under `ACCESS EXCLUSIVE` blocks everything while it reads the table; a
catalog change blocks everything for a moment, if it gets the lock
right away.

## The lock queue

When a lock can't be granted, the request waits in a queue. Any later
request that conflicts with the *waiting* one queues up behind it, even
if it wouldn't conflict with whoever holds the lock now. Here's the
sequence, adapted from an outage GoCardless wrote up:

1. A slow report runs `SELECT ... FROM orders`. It holds `ACCESS SHARE`
   for a minute.
2. A migration runs `ALTER TABLE orders ADD COLUMN note text`. That's a
   catalog-only change, but it needs `ACCESS EXCLUSIVE`, which conflicts
   with the report's lock. It waits.
3. The app runs `SELECT * FROM orders WHERE id = 123`. It doesn't
   conflict with the report, but it conflicts with the waiting `ALTER`,
   so it queues behind it. So does every later query on `orders`,
   until the report ends and the `ALTER` runs.

![Timeline with three rows. The slow report holds ACCESS SHARE on orders for a long time. The ALTER TABLE arrives, cannot get ACCESS EXCLUSIVE, and waits until the report ends, then runs for a moment. App queries that arrive after the ALTER all wait behind it and only run once it finishes. The gap where app queries are blocked is marked as the outage.](img/ddl-locks-lock-queue.svg)

*A fast ALTER that has to wait turns into an outage for everything behind it. Adapted from Chris Sinjakli, "Zero-downtime Postgres migrations - the hard parts" (GoCardless).*

At GoCardless the `ALTER` itself took a few hundred milliseconds when
they re-ran it later, but it caused about 15 seconds of API downtime
while it sat in the queue. Nothing in the migration was slow. A long
read on a table the `ALTER` needed was enough. Postgres waits for a lock forever
unless it finds a [[deadlock-detection|deadlock]], so without a limit
the pile-up lasts as long as the slowest query in front.

## lock_timeout: give up instead of queueing

`lock_timeout` aborts any statement that waits longer than the limit
for a lock. The limit applies to each lock the statement tries to
take, and it's off by default (0). Set it at the top of a migration:

```sql
SET lock_timeout = '2s';
ALTER TABLE orders ADD COLUMN note text;
```

If the `ALTER` can't get its lock within two seconds, it fails, the
queue drains, and the app sees a short stall instead of an outage.
Pick a value your app can tolerate and retry later: aborting a deploy
costs less than taking the app down.

`statement_timeout`, also off by default, caps how long a statement
runs. Set for the app, it stops the report in step 1 from holding its
lock for long.

## Where it gets tricky

**"It's fast" isn't enough.** How soon a change *gets* its lock
depends on the longest open transaction on the table, and a console
session left in `BEGIN` counts ([[long-running-transactions]]).

**Lock levels change between versions.** When GoCardless wrote their
post (Postgres 9.4 era), adding a foreign key took `ACCESS EXCLUSIVE`
on both tables, which blocked reads of the referenced table. Postgres
18 takes `SHARE ROW EXCLUSIVE`, which still blocks writes. Adding a
column with a default rewrote the whole table until Postgres 11; since
then a non-volatile default is stored in the catalog. Check your version's docs.

**Rewrites are not [[mvcc|MVCC]]-safe.** After a table rewrite, a
transaction whose snapshot predates it can see the table as empty.

## What this means when you build

- Set `lock_timeout` in every migration, and retry on timeout rather
  than waiting.
- Prefer changes that touch only the catalog, and split scans off with
  `NOT VALID` then `VALIDATE`. The full recipes are in
  [[zero-downtime-migrations]].

## Further reading

- [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html), PostgreSQL 18 docs. The eight lock modes, which commands take each, and the conflict table.
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html), PostgreSQL 18 docs. The lock each form takes and which ones rewrite or scan.
- [Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html), PostgreSQL 18 docs. What `lock_timeout` and `statement_timeout` do.
- [Zero-downtime Postgres migrations - the hard parts](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/), Chris Sinjakli, GoCardless, Postgres 9.4 era. The lock queue explained through a real outage.

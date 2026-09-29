---
id: online-schema-change
title: Online schema change
depth: deep
phase: 6
note: >-
  Shadow-table tools: copy the table, capture changes, backfill in
  batches, then swap. How gh-ost, pt-osc and pgroll differ.
needs: [zero-downtime-migrations, triggers]
leads_to: []
compare_with: []
---

# Online schema change

An online schema change tool changes a big table's structure without
locking it for the length of the change. It builds a new copy of the
table with the new schema, copies the rows across in small chunks while
the app keeps writing, keeps the copy up to date with every write that
happens meanwhile, and at the end swaps the copy in with one short lock.
It's what you reach for when a change can't be done in place without
rewriting the whole table.

## The change that doesn't fit expand and contract

Say `orders` has a few hundred million rows and you need to change a
column's type. In Postgres, most type changes rewrite the entire table
and all its indexes, under an `ACCESS EXCLUSIVE` lock that blocks every
read and write until the rewrite is done (see [[ddl-locks]]). It can
also need up to double the disk while it runs.

[[zero-downtime-migrations|Expand and contract]] can do it by hand:
add a new column, write both, backfill, switch, drop. That's several
deploys of application code for one change. An online schema change
tool does the same thing one level down, on a whole table, inside the
database, with no app changes until the swap.

## Five steps: shadow, capture, copy, catch up, swap

Every tool of this kind follows the same outline:

1. **Create the shadow table.** An empty copy of `orders` with the new
   schema. Altering an empty table is instant.
2. **Start capturing changes.** From now on, every insert, update and
   delete on `orders` is recorded somewhere, so it can be applied to
   the shadow table too.
3. **Copy the rows**, one chunk at a time, from `orders` to the shadow
   table. Small chunks keep each copy query short, so it never holds
   locks for long, and the tool can slow down or pause when the
   database is busy.
4. **Catch up.** Apply the captured changes to the shadow table until
   it's nearly in step with the original.
5. **Cut over.** Take a brief lock on `orders`, apply the last few
   changes, and swap the table names. Then, usually, drop the old
   table.

![Diagram of an online schema change. The app writes to the original orders table. A capture step records every write, and a replay step applies those changes to the shadow table, which has the new schema. Separately, a chunked copy moves existing rows from the original to the shadow table. At cut-over, a brief lock and a rename make the shadow table the new orders.](img/online-schema-change-flow.svg)

*The shape every shadow-table tool shares: copy the old rows, replay the new writes, then swap.*

The order of steps 2 and 3 matters. Capture has to start before the
copy, or a row that changes after it's copied would be lost. And both
the copy and the replay need a way to find "the same row" in both
tables, which is why these tools require a primary key or a unique
index ([[primary-keys]]).

## Three ways to capture changes

The tools differ most in step 2.

**Triggers that write straight to the shadow table.**
pt-online-schema-change (Percona, for MySQL) adds `AFTER INSERT`,
`AFTER UPDATE` and `AFTER DELETE` [[triggers]] to the original table.
Each one repeats the change on the shadow table, inside the same
transaction as the app's write. The two tables are in step at every
moment, so the cut-over can be one atomic rename. The cost is that
every write to your busiest table now also writes to a second table,
and you can't pause that: stopping the triggers mid-copy would lose
changes.

**Triggers that write to a change log.** Facebook's OSC for MySQL, and
pg-osc for Postgres, have the trigger append each change to a side
table (pg-osc calls it the audit table). A separate process replays the
log onto the shadow table at its own pace. The app's writes still pay
for one extra insert each, but the shadow table's own writes happen
outside the app's transactions.

**Reading the database's own log.** gh-ost (GitHub, for MySQL) uses no
triggers at all. It connects to MySQL as if it were a replica, streams
the binary log, and picks out the row changes for the table. The app's
writes don't fire anything extra. gh-ost is the only writer to the
shadow table, alternating between copying chunks and applying log
events, so when it pauses it stops writing to the shadow table
entirely. It can even run the whole migration on a replica to test it.

gh-ost's authors explain why they dropped triggers: MySQL interprets
trigger code on every call, and the triggers' writes fight the app's
writes for locks. They saw that contention lock up whole tables. This
phase's lab compares trigger capture with Postgres
[[logical-replication]].

## The cut-over

Everything before the swap can be slow and paused. The swap is the one
moment that touches the app, and the tools handle it differently.

- **pt-online-schema-change** swaps with one atomic `RENAME TABLE` of
  both tables. Because its triggers kept the shadow table in step, there
  is nothing left to drain.
- **Asynchronous tools** have a problem: when they lock the original,
  changes may still be in flight. Facebook's OSC locks, drains, then
  does two renames, and in between the table doesn't exist, so queries
  fail. gh-ost holds the lock on one connection while another waits to
  run an atomic rename, blocked by a guard table until the backlog is
  applied. If anything times out, it falls back to where it was before
  the cut-over and tries again.
- **pg-osc** replays the audit table until about 20 rows are left, then
  takes an `ACCESS EXCLUSIVE` lock on the original in a transaction,
  swaps the names and repoints foreign keys, and commits.

A lock at cut-over means everything in [[ddl-locks]] applies: the lock
can wait behind a long query, and queries queue behind the waiting
lock. pt-online-schema-change sets short lock wait timeouts so it's the
one that gives up, not the app. pg-osc can optionally kill the
sessions in its way.

## pgroll: no shadow table at all

pgroll (Xata, for Postgres 14 and later) takes a different route. It
automates expand and contract instead of copying the table. `pgroll
start` makes only additive changes. For a breaking column change it
adds a new column, backfills it in batches (1,000 rows by default),
and installs triggers that copy every write between the old and new
columns. It also creates a Postgres schema of views for each version,
so old app code sees the old column names and new code sees the new
ones, on the same table, at the same time. `pgroll complete` drops the
old version and the old columns. It runs its DDL with a 500 ms
`lock_timeout` by default.

| Tool | Database | How it captures writes | Where the new schema lives | Cut-over |
|---|---|---|---|---|
| pt-online-schema-change | MySQL | triggers write to the shadow table | shadow table | atomic `RENAME` |
| gh-ost | MySQL | reads the binary log as a replica | shadow table | lock, drain, atomic `RENAME`, retry on timeout |
| pg-osc | Postgres | trigger writes to an audit table, replayed later | shadow table | `ACCESS EXCLUSIVE` in one transaction, rename |
| pgroll | Postgres | triggers between old and new columns | new columns in the same table, views per version | none; `complete` drops the old version |

## Where it gets tricky

**Foreign keys pointing at the table.** A rename swap doesn't carry
them over: they follow the old, renamed table. pt-online-schema-change
has to drop and re-add them on every child table, or use a faster mode
where the table briefly doesn't exist and there's no way back if the
rename fails. pg-osc re-adds them `NOT VALID` and validates afterwards.

**Existing triggers.** pt-online-schema-change won't run on a table
that already has triggers.

**Twice the disk.** The shadow table is a full second copy.

**A new table has no statistics.** On MySQL a freshly swapped-in
table can lack optimizer statistics, turning index lookups into full
table scans, so pt-osc runs `ANALYZE` before the swap.
pg-osc runs `ANALYZE` right after it ([[table-statistics]]).

**How strong is the lock to add a trigger?** The Postgres docs say
`CREATE TRIGGER` takes `SHARE ROW EXCLUSIVE`, which blocks writes but
not reads. pg-osc's docs say it takes `ACCESS EXCLUSIVE` at that step.
Either way it's a lock to take with a timeout.

**MySQL-first ideas.** The best-known tools, and the arguments for and
against triggers, come from MySQL. In Postgres, first check whether the
change is catalog-only (adding a column with a non-volatile default
is). Then you don't need a tool at all.

## What this means when you build

- Use one only for changes that would rewrite or long-lock a big table.
  Additive changes don't need it.
- Make sure the table has a primary key and you have the disk for a
  second copy.
- Plan the cut-over: a lock timeout, retries, and a time when long
  queries aren't running.
- Check foreign keys that reference the table, and run `ANALYZE` on
  the new one.
- Compare row counts or checksums between old and new before you drop
  the old table.

## Further reading

- [pt-online-schema-change](https://docs.percona.com/percona-toolkit/pt-online-schema-change.html), Percona, Percona Toolkit 3.7.1. The classic trigger-based design and its limits: foreign keys, existing triggers, chunk sizing.
- [gh-ost](https://github.com/github/gh-ost), GitHub, v1.1.11. The README and design docs make the case against triggers and explain log-based capture and the cut-over.
- [pg-osc](https://github.com/shayonj/pg-osc), Shayon Mukherjee, v0.9.10. A shadow-table tool for Postgres with an audit table, step by step.
- [pgroll](https://github.com/xataio/pgroll), Xata, v0.16.3. Expand and contract automated with versioned views instead of a shadow table.
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html), PostgreSQL 18 docs. Which changes rewrite the table in the first place.
- [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html), PostgreSQL 18 docs. The lock `CREATE TRIGGER` takes.

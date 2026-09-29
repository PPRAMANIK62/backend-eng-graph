---
id: zero-downtime-migrations
title: Zero-downtime migrations
depth: deep
phase: 6
note: >-
  Expand, migrate, contract: changing a schema while the app keeps
  running.
needs: [schema-migrations, ddl-locks]
leads_to: [online-schema-change]
compare_with: [deployment-strategies, api-versioning]
---

# Zero-downtime migrations

A zero-downtime migration changes your schema while the app keeps
serving traffic, with no maintenance page and no burst of errors. The
trick is to never make a change that the running code can't cope with.
You split one breaking change into several small ones (expand, migrate,
contract), ship each on its own, and make sure every step works with
both the code before it and the code after it.

## Why one statement breaks things

Take an `orders` table with a column `amount`, and say you want to call
it `amount_cents`. The obvious [[schema-migrations|migration]] is one
line:

```sql
ALTER TABLE orders RENAME COLUMN amount TO amount_cents;
```

It runs in an instant. It still breaks the app, for two reasons.

**Code and schema can't change at the same moment.** The migration runs
either before the new code is deployed or after it. If it runs before,
the old code is still asking for `amount`, which no longer exists. If
it runs after, the new code asks for `amount_cents` before it exists.
And many deploys aren't a single switch anyway: when new code rolls
out a few servers at a time (see [[deployment-strategies]]), old and
new versions run side by side for a while. So for some window, both
versions of the code are talking to one schema.

**Your code may remember the schema.** Rails' Active Record, an
[[orm|ORM]], caches a
table's columns at runtime, so dropping a column it still has cached
causes errors until the app restarts.

So the rule: **every schema change must work with the code that's
running when it lands, and every code change must work with the schema
that's there when it ships.**

## Expand, migrate, contract

The pattern that follows from that rule is called parallel change, or
expand and contract. You make one breaking change in three phases:

1. **Expand.** Add the new thing next to the old one. Old code keeps
   working because nothing it uses changed.
2. **Migrate.** Move data and code over to the new thing, as slowly as
   you like.
3. **Contract.** Once nothing uses the old thing, remove it.

For the rename, that becomes six steps. Each is a separate deploy, and
the app works at every point in between:

1. Add `amount_cents`.
2. Deploy code that writes to both columns. (Steps 1 and 2 expand.)
3. Backfill: copy `amount` into `amount_cents` for the old rows.
4. Deploy code that reads `amount_cents`. (Steps 3 and 4 migrate.)
5. Deploy code that stops writing `amount`.
6. Drop `amount`. (Steps 5 and 6 contract.)

![Six steps left to right, grouped under expand, migrate and contract. For each step, a row shows which columns exist in the table, what the app writes and what it reads. amount exists until step 6. amount_cents exists from step 1. Writes go to amount only, then to both from step 2, then to amount_cents only from step 5. Reads come from amount until step 4, then from amount_cents.](img/zero-downtime-migrations-expand-contract.svg)

*Renaming a column in six deploys. At every point, the running code and the schema agree. Steps adapted from Andrew Kane, Strong Migrations.*

Look at any step boundary and you'll see why it's safe. During step 2's
rollout, some servers write both columns and some write only `amount`;
that's fine, because the backfill in step 3 hasn't run yet and nobody
reads `amount_cents`. During step 4's rollout, some servers read the
old column and some the new, and both are complete because every
writer writes both. By step 6 no code mentions `amount`.

It's slower than one `RENAME`. In exchange, each step is small, each
step can be rolled back until the contract, and you can stop between
steps for as long as you need.

## Making each step safe in Postgres

Splitting the change fixes compatibility. It doesn't fix locking: each
step is still DDL, and every DDL statement takes a lock (see
[[ddl-locks]]). A few rules keep each step from blocking the table.

**Set a lock timeout on every migration.** Even an instant `ADD COLUMN`
needs an `ACCESS EXCLUSIVE` lock, and if it has to wait for a long
transaction, every query behind it waits too. With `lock_timeout` set,
the migration gives up instead, and you retry it. Strong Migrations, a
Rails tool that blocks unsafe migrations, uses a 10-second lock timeout
in its example, with a long statement timeout so the migration itself
can run a while.

**Add columns without a rewrite.** Since Postgres 11, adding a column
with no default, or with a non-volatile default, only changes the
catalog. A volatile default such as `clock_timestamp()` still rewrites
the whole table and its indexes under an exclusive lock.

**Backfill in batches, outside the migration's transaction.** One
`UPDATE orders SET amount_cents = amount` touches every row in one
transaction. If it runs inside the same transaction as an `ALTER`, the
table stays locked for the whole backfill. Update one batch of rows at a
time, pause between batches, and run it as a separate job
([[backfills]]).

**Add constraints in two steps.** Adding a `CHECK` or foreign key
normally scans every row while holding a lock that blocks writes.
Adding it `NOT VALID` skips the scan: new writes are checked right
away, old rows aren't. A later `VALIDATE CONSTRAINT` checks the old
rows under a much weaker lock (`SHARE UPDATE EXCLUSIVE`) that lets
reads and writes carry on.

`NOT NULL` needs a detour. `SET NOT NULL` scans the table under
`ACCESS EXCLUSIVE`, blocking reads and writes. But if a valid `CHECK
(amount_cents IS NOT NULL)` already exists, Postgres skips the scan. So:

```sql
ALTER TABLE orders ADD CONSTRAINT amount_cents_not_null
  CHECK (amount_cents IS NOT NULL) NOT VALID;          -- no scan
ALTER TABLE orders VALIDATE CONSTRAINT amount_cents_not_null;  -- scans, writes continue
ALTER TABLE orders ALTER COLUMN amount_cents SET NOT NULL;     -- no scan
ALTER TABLE orders DROP CONSTRAINT amount_cents_not_null;
```

Postgres 18 allows a not-null constraint itself to be `NOT VALID`,
which makes the `CHECK` detour unnecessary there.

**Build [[indexes]] concurrently.** A plain `CREATE INDEX` blocks writes
until it finishes. `CREATE INDEX CONCURRENTLY` doesn't, but it scans
the table twice, waits for older transactions, takes longer overall,
and can't run inside a transaction block, so a migration tool that
wraps each migration in a transaction has to be told not to.

**Drop in two deploys.** First tell the ORM to ignore the column and
deploy that. Then drop it.

## The same pattern for bigger moves

Expand and contract isn't only for columns. Stripe used it to move
hundreds of millions of subscription records out of the customer
record into their own table, with no maintenance window:

1. **Dual write.** New subscriptions go to both stores. They ramped
   the share of objects written twice up gradually while watching load,
   and copied old objects over lazily whenever they were updated.
   Then an offline job over database snapshots found the rest, which
   they backfilled, and the job ran again to confirm nothing was
   missing.
2. **Move reads.** Before switching, they read from both stores in
   production and compared the results, alerting on any difference.
3. **Move writes.** Write to the new store first, keep the old one as
   an archive, one code path at a time.
4. **Remove old data** once no code reads it.

Two ideas from this scale well. Change a little at a time (they never
changed more than a few hundred lines of code at once). And check,
don't assume: comparing old and new reads in production catches the
code path you forgot to update.

When the change can't be made additively at all, like changing a
column's type on a huge table, the usual tool is an
[[online-schema-change]]: copy the table in the background and swap.

## Where it gets tricky

**The contract step gets skipped.** Once the new column works, removing
the old one feels optional. It isn't: you're left paying for two
columns, two writes and a codebase where nobody's sure which one is
real. Skipping the contract can leave you worse off than before you
started.

**Dual writes can disagree.** When app code writes both columns, a bug
or a forgotten code path can update one and not the other. That's why
Stripe compared reads before trusting the new store. Writing both in
the same transaction helps; keeping them in step with a
[[triggers|trigger]] moves the job into the database. The general
problem is [[dual-writes]].

**Fast DDL can still cause an outage.** An instant `ADD COLUMN` that
waits behind a long read blocks every query behind it. GoCardless lost
about 15 seconds of API traffic to a migration that took a few hundred
milliseconds when re-run. The fix is the lock timeout, not a faster
statement.

**Concurrent index builds can fail halfway.** A failed `CREATE INDEX
CONCURRENTLY` leaves an invalid index that isn't used for queries but
still slows every write. Drop it and try again.

**"Zero downtime" isn't zero cost.** `VALIDATE CONSTRAINT`,
concurrent index builds and backfills all read the whole table. They
don't block your queries, but the extra CPU and I/O can slow them.

**The rules move with versions.** Before Postgres 11, adding a column
with any default rewrote the table. Before 18, a not-null constraint
couldn't be `NOT VALID`. Advice written for older versions can be too
cautious, or wrong, for yours.

## What this means when you build

- Treat every schema change as a series of deploys, each compatible
  with the code on both sides of it.
- Set `lock_timeout` in every migration and retry on timeout.
- Add columns without volatile defaults, add constraints `NOT VALID`
  then validate, build indexes `CONCURRENTLY`.
- Backfill in batches, outside the migration's transaction.
- Verify before you switch reads, and finish the contract step.
- A linter for migrations, like Strong Migrations for Rails, catches
  the known-dangerous statements before they reach production.

## Further reading

- [ParallelChange](https://martinfowler.com/bliki/ParallelChange.html), Danilo Sato, 2014. The short original description of expand, migrate and contract, and its cost.
- [Online migrations at scale](https://stripe.com/blog/online-migrations), Jacqueline Xu, Stripe, 2017. Expand and contract across tables, with dual writes, offline backfill and read comparison.
- [Strong Migrations](https://github.com/ankane/strong_migrations), Andrew Kane, v2.8.0. A catalogue of dangerous schema changes, each with its safe multi-step version.
- [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html), PostgreSQL 18 docs. Which changes rewrite or scan, and how NOT VALID and VALIDATE CONSTRAINT work.
- [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html), PostgreSQL 18 docs. What CONCURRENTLY costs and how it fails.
- [Zero-downtime Postgres migrations - the hard parts](https://gocardless.com/blog/zero-downtime-postgres-migrations-the-hard-parts/), Chris Sinjakli, GoCardless, Postgres 9.4 era. The usual rules, and the lock queue that broke them anyway.

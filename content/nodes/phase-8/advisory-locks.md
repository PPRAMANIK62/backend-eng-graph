---
id: advisory-locks
title: Advisory locks
depth: short
phase: 8
note: >-
  Locks on numbers you choose, for coordinating app code through
  Postgres.
needs: [explicit-locking, db-connection-pooling]
leads_to: []
compare_with: [distributed-locks, fencing-tokens]
---

# Advisory locks

An advisory lock is a lock on a number you choose. Postgres doesn't tie
it to any row or table and doesn't enforce what it means. It only
guarantees that two sessions can't hold conflicting locks on the same
number at once. That makes it a cheap way for several app servers that
already share a Postgres database to agree that only one of them does
something at a time.

## Locking a number

Say three app servers each run the nightly billing job, and only one
should actually do the work. Pick a number for "billing job", say 42:

```sql
SELECT pg_try_advisory_lock(42);   -- true for one session, false for the rest
-- ...the winner runs the job...
SELECT pg_advisory_unlock(42);
```

The first session to ask gets `true` and runs the job. The others get
`false` straight away and skip it. `pg_advisory_lock(42)`, without
`try`, would make them wait their turn instead.

The key is either one 64-bit number or two 32-bit numbers, and those
two key spaces never overlap. Locks can be exclusive or shared (shared
ones only conflict with exclusive ones). And the lock is completely
separate from the data: holding advisory lock 42 doesn't stop anyone
reading or writing any row, even one whose id is 42. It only stops
another session from taking lock 42. Every piece of code has to agree
to ask first, which is why they're called advisory.

Compared with a "locked" flag column in a table, advisory locks are
faster, don't bloat the table, and are cleaned up by the
server when the session ends, even if the client disconnects without
saying goodbye.

## Session locks and transaction locks

There are two lifetimes, and they behave quite differently:

- **Session-level** (`pg_advisory_lock`, `pg_try_advisory_lock`): held
  until you unlock it or the session ends. It ignores transactions: a
  lock taken inside a transaction that rolls back is still held, and an
  unlock sticks even if the transaction later fails. Requests stack, so
  locking 42 three times needs three unlocks.
- **Transaction-level** (`pg_advisory_xact_lock`,
  `pg_try_advisory_xact_lock`): released automatically when the
  transaction commits or rolls back. There's no unlock function.

Transaction-level locks behave like the row locks from
[[explicit-locking]], and they're harder to leak. Session-level locks
suit work that spans several transactions, such as a batch job that
commits as it goes.

Held advisory locks show up in the `pg_locks` view, so you can see who
holds what.

## Where it gets tricky

**Connection poolers break session locks.** With PgBouncer in
transaction pooling mode, each transaction may run on a different
server connection, and session-level advisory locks are on PgBouncer's
list of features that never work in that mode. The lock stays with a
server connection that someone else's transaction may use next. Use
transaction-level locks behind a transaction pooler
([[db-connection-pooling]]).

**The lock belongs to the connection, not your process.** If the
connection drops, Postgres releases the lock and another server can
start the job, even if the first process is still running and just
lost its connection. An advisory lock tells you who held the lock when
you asked. It doesn't stop a process that has lost it from carrying on.
That's the same problem [[distributed-locks]] have, and why they need
[[fencing-tokens]].

**Numbers are a shared namespace.** Two features that both pick 42 will
block each other. Keep the numbers in one place in your code, or use
the two-number form with the first number naming the feature. If your
natural key is a string, you have to turn it into a number yourself,
and two strings can land on the same number.

**Locks in a query can outrun its `LIMIT`.** In
`SELECT pg_advisory_lock(id) FROM foo WHERE id > 12345 LIMIT 100`, the
lock function may run on more rows than the `LIMIT` returns, leaving
session locks nobody knows to release. Apply the `LIMIT` in a subquery
first, then lock.

**They share the lock table.** Advisory locks live in the same
shared-memory table as ordinary locks, which caps them at somewhere in
the tens to hundreds of thousands, depending on configuration. Run out
and the server can't grant any lock at all. One advisory lock per job
is fine; one per row of a big table is not.

## What this means when you build

- For "only one of these at a time" when you already run Postgres,
  `pg_try_advisory_xact_lock` inside a transaction is the simplest
  tool, and it can't leak.
- Use session-level locks only on a direct connection or a session
  pooler, and always unlock in a `finally` block.
- Don't treat it as a lease that proves you're still the only one
  running. If duplicate work would corrupt something, make the work
  itself safe to repeat ([[idempotency]]) or checked at write time.

## Further reading

- [Explicit Locking, 13.3.5 Advisory Locks](https://www.postgresql.org/docs/current/explicit-locking.html), PostgreSQL 18 docs. Session versus transaction locks, the flag-column comparison, and the `LIMIT` trap.
- [Advisory Lock Functions](https://www.postgresql.org/docs/current/functions-admin.html), PostgreSQL 18 docs. Every function, the key format and what each returns.
- [PgBouncer features](https://www.pgbouncer.org/features.html), PgBouncer authors, 1.26. The table of features that break in transaction pooling, advisory locks included.

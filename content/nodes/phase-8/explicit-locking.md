---
id: explicit-locking
title: Explicit locking
depth: short
phase: 8
note: >-
  SELECT FOR UPDATE, NOWAIT and SKIP LOCKED.
needs: [two-phase-locking, lost-update]
leads_to: [advisory-locks, background-jobs]
compare_with: []
---

# Explicit locking

Most locks are taken for you: an `UPDATE` locks the rows it changes, a
`SELECT` takes a weak lock on the table. Explicit locking is asking for
a lock yourself, usually with `SELECT ... FOR UPDATE` on rows, so that
a read-then-write in your code is safe at the default isolation level.
The `NOWAIT` and `SKIP LOCKED` options change what happens when someone
else has the row, and `SKIP LOCKED` is what turns a Postgres table into
a decent job queue.

## Read, decide, write

A shop has one item left. Two requests run this at the same time, at
Postgres's default [[isolation-levels|READ COMMITTED]]:

```sql
BEGIN;
SELECT stock FROM items WHERE id = 7;         -- both see 1
UPDATE items SET stock = stock - 1 WHERE id = 7;
INSERT INTO orders ...;
COMMIT;
```

Both see a stock of 1, both decide to sell, and the item is sold
twice. Plain reads don't lock rows, so nothing made the second request
wait. It's the race behind a [[lost-update]]: a decision made on a
value that changed before the write.

Add `FOR UPDATE` to the read:

```sql
SELECT stock FROM items WHERE id = 7 FOR UPDATE;
```

Now the first transaction holds the row's lock until it commits. The
second one's `SELECT ... FOR UPDATE` waits. When the first commits, the
second gets the lock and, at READ COMMITTED, is handed the new version
of the row: stock 0, so it doesn't sell. At REPEATABLE READ or
SERIALIZABLE it gets an error instead, because the row changed after
its snapshot, and has to retry.

This is [[two-phase-locking]] done by hand for one row: take the lock
before you read, keep it until commit.

## Four strengths

Postgres has four row-level lock modes. None of them block plain
`SELECT`s; they only block writers and other lockers.

| Clause | Blocks | Taken automatically by |
|---|---|---|
| `FOR UPDATE` | every other row lock, `UPDATE`, `DELETE` | `DELETE`, and `UPDATE` of certain unique key columns |
| `FOR NO KEY UPDATE` | the same, except `FOR KEY SHARE` | every other `UPDATE` |
| `FOR SHARE` | `UPDATE`, `DELETE`, `FOR UPDATE`, `FOR NO KEY UPDATE` | |
| `FOR KEY SHARE` | `DELETE`, key-changing `UPDATE`, `FOR UPDATE` | |

If you'll update only non-key columns, `FOR NO KEY UPDATE` is the lock
the `UPDATE` takes anyway, and weaker than `FOR UPDATE`. `FOR SHARE`
means "nobody may change this row while I rely on it". For whole tables
there's `LOCK TABLE` ([[lock-granularity]]).

## Don't wait: NOWAIT and SKIP LOCKED

By default a lock request waits as long as it takes. Two options
change that:

- **`NOWAIT`** fails with an error right away if a row can't be locked.
- **`SKIP LOCKED`** leaves out rows that are locked and returns the
  rest. Postgres 9.5 (2016) added it.

`SKIP LOCKED` gives an inconsistent view of the table, so it's wrong
for normal queries. It's exactly right for a queue, where several
workers each want *some* job and don't care which:

```sql
BEGIN;
SELECT id, payload FROM jobs
 WHERE status = 'queued'
 ORDER BY id
 LIMIT 1
 FOR UPDATE SKIP LOCKED;
-- do the job, then:
UPDATE jobs SET status = 'done' WHERE id = $1;
COMMIT;
```

![Three workers run the same SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1 against a jobs table with rows 1 to 5. Worker A locks job 1. Worker B skips the locked job 1 and locks job 2. Worker C skips jobs 1 and 2 and locks job 3. Without SKIP LOCKED, workers B and C would both wait behind A for job 1.](img/explicit-locking-skip-locked.svg)

*Each worker skips rows another worker has locked, so they spread over the queue instead of lining up behind one row.*

With `LIMIT`, locking stops once enough rows are returned, so a worker
locks only the job it takes. See [[background-jobs]] for the rest of
what a job system needs.

## Where it gets tricky

**The lock lasts until commit.** A worker that holds its job's row lock
while it runs a ten-minute task keeps a transaction open for ten
minutes, with everything that holds back ([[long-running-transactions]]).
And a waiting lock request never gives up by itself; set `lock_timeout`
if you'd rather fail than hang.

**Locking a row writes to it.** Postgres keeps row locks on the row
itself, not in memory, so there's no limit on how many rows you lock,
but `SELECT ... FOR UPDATE` causes disk writes.

**At REPEATABLE READ, lock first.** The snapshot is fixed at the first
query. Take your locks before that, or the rows you lock may be newer
than the snapshot you read everything else from.

**`FOR UPDATE` only delays a conflicting write.** Once you commit
without changing the row, a waiting `UPDATE` goes ahead. The lock
protects your transaction, not the row forever.

**`ORDER BY` with `FOR UPDATE` can return rows out of order** at READ
COMMITTED: the rows are sorted, then locked, and a row's sort column
may change while you wait for it.

**`NOWAIT` and `SKIP LOCKED` apply to rows only.** The statement still
waits for its table-level lock.

## What this means when you build

- When a single `UPDATE ... SET x = x - 1 WHERE ...` can't express your
  logic, read with `FOR UPDATE` (or `FOR NO KEY UPDATE`) before you
  decide.
- Keep transactions that hold row locks short, and set `lock_timeout`.
- For a queue in Postgres, use `FOR UPDATE SKIP LOCKED` with `LIMIT`.
- When you need to coordinate something that isn't a row, look at
  [[advisory-locks]].

## Further reading

- [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html), PostgreSQL 18 docs. The four row-level lock modes and what each blocks.
- [SELECT, the locking clause](https://www.postgresql.org/docs/current/sql-select.html), PostgreSQL 18 docs. `NOWAIT`, `SKIP LOCKED`, `LIMIT` and the ordering caveat.
- [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 docs. What a waiting `FOR UPDATE` sees at each isolation level.
- [Data Consistency Checks at the Application Level](https://www.postgresql.org/docs/current/applevel-consistency.html), PostgreSQL 18 docs. When explicit locks are needed, and why to lock before the snapshot.
- [Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html), PostgreSQL 18 docs. `lock_timeout`.
- [PostgreSQL 9.5 release notes](https://www.postgresql.org/docs/release/9.5.0/), PostgreSQL Global Development Group, 2016. Where `SKIP LOCKED` arrived.

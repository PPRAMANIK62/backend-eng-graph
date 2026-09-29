---
id: optimistic-concurrency
title: Optimistic concurrency control
depth: short
phase: 8
note: >-
  Don't lock, check a version at commit, retry on conflict.
needs: [transaction]
leads_to: [event-sourcing]
compare_with: [two-phase-locking, conditional-requests, lost-update, write-skew, fencing-tokens, redis-transactions]
---

# Optimistic concurrency control

Optimistic concurrency control doesn't lock anything while you work.
You read, you compute, and when you write you check that nothing you
depended on changed in the meantime. If it did, the write fails and you
start over. It wins when conflicts are rare and loses when they're
common. In application code it usually looks like a version number on
each row.

## A version column

Alice and Bob both open the edit page for product 7. Each page load
reads the row, including a `version` column that's currently 3. Alice
changes the price and saves; a minute later Bob changes the name and
saves. Each save runs:

```sql
UPDATE products
   SET price = 12, version = version + 1
 WHERE id = 7 AND version = 3;
```

Postgres answers with the number of rows it updated. Alice's update
matches (version is 3), so it reports 1 row and the version becomes 4.
Bob's update, still saying `version = 3`, matches nothing and reports 0
rows. That's not an error to the database, so your code must check the
count: 0 means someone else changed the row since you read it. Bob's
request can reload the product and try again, or show him Alice's
change.

![Timeline with Alice, the products row and Bob. Both read product 7 at version 3. Alice runs UPDATE ... WHERE id = 7 AND version = 3; it matches, 1 row is updated, and the row is now at version 4. Bob runs the same UPDATE with version = 3; it matches nothing and 0 rows are updated. Bob re-reads version 4 and tries again.](img/optimistic-concurrency-version.svg)

*The version check turns a silent overwrite into a write that visibly fails.*

The check and the write happen in one statement, which is what makes
this safe. If Alice's and Bob's updates arrive at the same moment, the
second one waits for the first one's row lock. When the first commits,
Postgres (at READ COMMITTED) re-checks the `WHERE` clause against the
new version of the row, finds version 4, and updates nothing.

Notice what didn't happen: Alice and Bob held no locks for the minute
they had the page open. You shouldn't hold a database
[[transaction]] open while a person thinks, so this pattern, sometimes
called an optimistic offline lock, is the standard way to stop two
people overwriting each other across requests. DynamoDB builds the same
thing from a version attribute and conditional writes. HTTP APIs have
their own form of it ([[conditional-requests]]).

## The general idea

Kung and Robinson described the general approach in 1981. A transaction runs in
three phases: a **read** phase, where it reads freely and writes only
to private copies; a **validation** phase, where the system checks that
no other transaction's writes conflict with what it read; and a
**write** phase, where the copies become visible. If validation fails,
the transaction is thrown away and started again.

The trade against locking ([[two-phase-locking]]) is simple. Locking
makes transactions wait just in case; optimism lets them run and
restarts the ones that collided. With no locks there are no deadlocks,
but a transaction can keep losing and restarting, which Kung and
Robinson called starvation. Their fix for a starving transaction was
to let it run while effectively locking everything. So optimism pays
off when collisions are rare, such as read-mostly workloads, and
locking pays off when many transactions fight over the same data.

## Where it gets tricky

**A version column only protects the row you write.** Kung and
Robinson's validation compares everything a transaction read with what
others wrote meanwhile. A version
check on one row checks only that row. If your decision depended on
other rows you only read, a concurrent change to them slips through:
that's [[write-skew]].

**Every writer has to play along.** If one code path, a script or an
admin tool updates the row without bumping the version, the check
passes when it shouldn't. DynamoDB's mapper, for example, has a mode
that skips the check entirely.

**Replication can undo it.** A version check needs one place that
decides which write came first. DynamoDB warns that with global tables,
where concurrent writes in different regions are settled by [[conflict-resolution|last
writer wins]], optimistic locking doesn't work as expected.

**Hot rows retry forever.** A counter that every request increments
will fail its version check constantly. Use an atomic
`UPDATE ... SET n = n + 1` or a lock instead.

**Databases do this inside too.** Postgres's SERIALIZABLE
([[serializable-snapshot-isolation]]) is optimistic in spirit: it
doesn't block reads, and aborts a transaction when it finds a dangerous
conflict, so your code retries.

## What this means when you build

- Put a version column (or an updated counter) on rows people edit
  through forms or APIs, check it in the `WHERE` clause, and always
  check the updated row count.
- On a failed check, reload and retry a few times with backoff
  ([[retries-with-backoff]]), or return a conflict to the caller.
- For high-contention data, don't be optimistic: use an atomic update
  or `SELECT ... FOR UPDATE` ([[explicit-locking]]).

## Further reading

- [On Optimistic Methods for Concurrency Control](https://www.eecs.harvard.edu/~htk/publication/1981-tods-kung-robinson.pdf), H. T. Kung and John T. Robinson, 1981. The read, validation and write phases, and when optimism beats locking.
- [Optimistic Offline Lock](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html), David Rice, in Martin Fowler's catalog, 2003. The version check for edits that span several requests.
- [DynamoDB and optimistic locking with version number](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBMapper.OptimisticLocking.html), Amazon Web Services. A real version-attribute implementation, and where it breaks.
- [UPDATE](https://www.postgresql.org/docs/current/sql-update.html), PostgreSQL 18 docs. The row count that tells you the check failed.
- [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), PostgreSQL 18 docs. Why a racing UPDATE re-checks its WHERE clause at READ COMMITTED.

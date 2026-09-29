---
id: long-running-transactions
title: Long-running transactions
depth: short
phase: 8
note: >-
  What one open or idle-in-transaction session holds back for everyone
  else: cleanup, locks, disk.
needs: [vacuum]
leads_to: []
compare_with: [ddl-locks]
---

# Long-running transactions

A transaction that stays open for a long time, even one doing nothing,
costs every other session on the database. It keeps [[vacuum]] from
removing dead rows, holds its locks, and makes tables grow. A common culprit isn't a big batch job but an app that ran
`BEGIN`, did a query, and then went off to wait for something else.

## What an open transaction holds back

**Cleanup.** Under [[mvcc]], an old row version can only be removed
once no running transaction could still see it. Postgres tracks the
oldest snapshot still in use, the *xmin horizon*: a dead version is
removable only if the transaction that deleted it is older than that.
One session that opened a snapshot an hour ago pins the horizon an hour
back, for every table in the database. Every update and delete since
then leaves a dead version that VACUUM finds and has to leave alone.

![Timeline. Session A runs BEGIN and a SELECT, then sits idle in transaction until it finally commits. Meanwhile other sessions run many short updates. A dashed line marks the xmin horizon stuck at A's snapshot. Below, bars of dead versions that VACUUM can't remove grow taller over time, and only drop once A commits and vacuum catches up.](img/long-running-transactions-horizon.svg)

*One idle transaction pins the cleanup horizon while everyone else keeps writing.*

This is the part people miss: the session needn't touch the bloating
table, hold any significant locks, or run anything. Being open with a
snapshot is enough to keep vacuum from removing recently dead rows.

**Locks.** An idle transaction keeps every lock it took, for as long
as it sits there; that's one reason the idle-in-transaction timeout
exists. A migration that needs a conflicting lock on the same table
waits behind it (see [[ddl-locks]] for how that wait can stall other
queries too).

## How they happen, and how to find them

The classic pattern is *idle in transaction*: the app starts a
transaction, then calls a payment API, waits for user input, or hits an
exception path that never commits. Code with autocommit off does it
without an explicit `BEGIN` (see [[transaction]]).

`pg_stat_activity` shows each session's `state` (`idle in transaction`
is its own value), `xact_start`, and `backend_xmin`, the snapshot that
session is pinning. Sorting by the age of `backend_xmin` or
`backend_xid` finds the session holding back the horizon, and
`pg_terminate_backend()` ends it. `VACUUM (VERBOSE)` shows the problem
from the other side: a count of `dead row versions cannot be removed
yet`, with the oldest xmin.

Three other things pin the horizon without looking like a transaction:
a replication slot for a [[replication|replica]] that's down or far behind, a prepared
transaction from [[two-phase-commit]] that was never finished (these
survive restarts), and a standby with `hot_standby_feedback` on, which
tells the primary to keep rows its own queries still need.

## Limits you can set

Postgres has three timeouts, all off by default:

- `idle_in_transaction_session_timeout` ends a session that sits idle
  inside a transaction for longer than the limit. This one targets the
  common case directly.
- `transaction_timeout` (new in PostgreSQL 17) ends a session whose
  transaction, busy or idle, runs longer than the limit. Setting it in
  `postgresql.conf` isn't recommended, because it would hit every
  session.
- `statement_timeout` limits single statements, which doesn't help with
  an idle transaction.

The removed option is worth knowing about too. `old_snapshot_threshold`
let vacuum remove rows that old snapshots might still need and made
those snapshots fail later with a "snapshot too old" error. PostgreSQL
17 removed it, so ending the transaction is the way out.

## What this means when you build

- Keep network calls, user input and slow work outside transactions.
  Open the transaction, do the database work, commit.
- Set `idle_in_transaction_session_timeout` for application roles.
- Remember that a long report holds back vacuum for as long as it
  runs, on the primary or, with `hot_standby_feedback`, from a standby.
- Alert on the oldest `xact_start` and `backend_xmin` age in
  `pg_stat_activity`, and on unused replication slots.

## Further reading

- [Four reasons why VACUUM won't remove dead rows from a table](https://www.cybertec-postgresql.com/en/reasons-why-vacuum-wont-remove-dead-rows/), Laurenz Albe, 2018. The xmin horizon and the four things that hold it back, each with the query that finds it.
- [19.11 Client Connection Defaults](https://www.postgresql.org/docs/current/runtime-config-client.html), PostgreSQL 18 documentation. The idle-in-transaction and transaction timeouts, and why an idle transaction causes bloat.
- [PostgreSQL 17 release notes](https://www.postgresql.org/docs/release/17.0/). `transaction_timeout` added, `old_snapshot_threshold` removed.
- [27.2 The Cumulative Statistics System](https://www.postgresql.org/docs/current/monitoring-stats.html), PostgreSQL 18 documentation. The `pg_stat_activity` columns for finding the culprit.

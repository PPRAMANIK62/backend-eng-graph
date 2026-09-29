---
id: logical-replication
title: Logical replication
depth: short
phase: 10
note: >-
  Postgres decoding its WAL into a stream of row changes, read through a
  replication slot.
needs: [write-ahead-log]
leads_to: [change-data-capture]
compare_with: [triggers, leader-follower-replication]
---

# Logical replication

Postgres already writes every change to its [[write-ahead-log]]. Logical
decoding reads that log back and turns it into row changes ("insert
this row into `orders`", "update row 1042") that another program can
understand. A replication slot remembers how far each reader has got,
so it can disconnect and pick up where it left off. Postgres's
built-in logical replication runs on this, and so do change data
capture tools like Debezium.

## From WAL records to row changes

The WAL describes changes at the storage level: which bytes changed on
which page. That's enough for a physical replica, which copies pages
byte for byte, but useless to a search indexer that wants rows.
Logical decoding translates those records into a stream of row
changes, per table, that make sense without knowing Postgres's
internals.

To do that the WAL needs a bit more information than usual, so the
server has to run with `wal_level = logical`. The default is `replica`,
and changing it needs a restart, so it's worth setting before you need
it.

The translation is done by an output plugin, which turns the decoded
changes into whatever format the reader wants.

## A slot remembers where you are

A reader doesn't connect to "the WAL". It connects to a replication
slot, created for it. The slot is a stream of changes from one database,
replayed in the order they happened, and it records the position (the
LSN) the reader has confirmed.

![A Postgres server writes WAL segments left to right. Logical decoding and an output plugin turn records into row changes. A replication slot marks the position the consumer has confirmed. WAL to the left of that mark can be removed; WAL to the right is kept until the consumer confirms it, even while the consumer is offline.](img/logical-replication-slot.svg)

*The slot is a bookmark in the WAL, and Postgres keeps everything after the bookmark.*

A few properties matter when you build on it:

- **Slots survive crashes and disconnects.** They live independently
  of the connection. A reader can go away and come back and get
  everything since its last confirmed position.
- **You may see changes twice.** A slot's position is saved to disk
  only at a checkpoint. After a crash it can go back to an earlier
  LSN and resend recent changes. The reader has to handle that, for
  example by remembering the last LSN it processed and skipping
  anything at or before it.
- **One reader per slot.** Only one connection can read from a slot at
  a time, and each consumer normally gets its own slot, with its own
  position.
- **A starting snapshot comes free.** Creating a slot through the
  replication protocol exports a snapshot that matches exactly where
  the slot's stream begins. Copy the tables using that snapshot, then
  apply the stream, and you don't lose any changes in between.

## The slot holds WAL until you read it

A slot stops Postgres from removing WAL the reader hasn't confirmed,
and old catalog rows the decoding needs. This holds even when nobody is
connected to the slot.

So a reader that stops, or a slot someone forgot to drop, makes the WAL
directory grow until the disk fills. In the worst case, because vacuum
can't clean the catalog rows either, the database can shut down to
protect itself against transaction ID wraparound.

Two settings put limits on it:

- `max_slot_wal_keep_size` caps how much WAL a slot may hold. The
  default, `-1`, means no limit. With a limit, a slot that falls too
  far behind loses the WAL it needs and may not be able to continue.
- `idle_replication_slot_timeout` (in the Postgres 18 docs) invalidates
  slots that nobody has used for longer than the setting, checked at
  checkpoints. The default, zero, turns it off.

Either way you trade a full disk for a broken reader, which is usually
the right trade, but you have to choose it.

## Built-in logical replication

Postgres uses all of this for its own logical replication between
servers. You create a publication on the source (which tables to
send) and a subscription on the target. The subscriber first copies
each table from a snapshot, then applies the stream of changes in the
same order they happened on the publisher. Rows are matched by their
replica identity, usually the primary key.

Unlike physical replication, the two servers don't have to be
identical: you can replicate a subset of tables, send changes to a
different major version of Postgres, or to a different platform. The
subscriber behaves like any other Postgres server and can even publish
to others in turn.

## Where it gets tricky

**Slots and failover.** A slot lives on the primary. If the primary
fails and a standby takes over, readers need a slot on the new primary
at the right position. Since Postgres 17, logical slots can be kept in
sync on a hot standby (the `failover` option when creating the slot,
plus `sync_replication_slots` on the standby), so the reader can
continue after promotion.

**Logical is not physical.** Physical replication (see
[[leader-follower-replication]]) copies data by block address, byte for
byte. Logical replication sends row changes, table by table, matched by
replica identity.

## What this means when you build

- Set `wal_level = logical` ahead of time if you'll ever want
  [[change-data-capture]]; it needs a restart.
- Give every consumer its own slot, and drop slots you no longer use.
- Monitor how far each slot is behind, and set
  `max_slot_wal_keep_size` so a stuck reader can't fill the disk.
- Make consumers handle repeated changes, keyed by LSN.

## Further reading

- [Logical Decoding Concepts](https://www.postgresql.org/docs/current/logicaldecoding-explanation.html), PostgreSQL 18 docs. What decoding is, what a slot promises (and doesn't), failover sync, and the exported snapshot.
- [Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html), PostgreSQL 18 docs. Publications, subscriptions, the initial copy and in-order apply.
- [Write Ahead Log settings](https://www.postgresql.org/docs/current/runtime-config-wal.html), PostgreSQL 18 docs. `wal_level` and its default.
- [PostgreSQL 17 release notes](https://www.postgresql.org/docs/release/17.0/), 2024. Failover for logical slots and `sync_replication_slots`.
- [Replication settings](https://www.postgresql.org/docs/current/runtime-config-replication.html), PostgreSQL 18 docs. `max_slot_wal_keep_size` and `idle_replication_slot_timeout`.

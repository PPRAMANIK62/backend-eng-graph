---
id: change-data-capture
title: Change data capture
depth: deep
phase: 10
note: >-
  Turning a database's own change log into events. Debezium and friends.
needs: [logical-replication, log-based-messaging, log-compaction]
leads_to: [search-architecture]
compare_with: [transactional-outbox, event-sourcing, cache-invalidation]
---

# Change data capture

Change data capture (CDC) reads a database's own change log and turns
every committed row change into an event that other systems can
consume. Your application writes to one database, as it always did.
The search index, the cache, the [[data-warehouse|warehouse]] and other services follow
along from the log, in commit order, a moment later. It's the standard
way to keep several stores in step without [[dual-writes]].

## Why read the log instead of writing twice

Say orders live in Postgres and you also want them searchable in
Elasticsearch. Writing both from the application is a dual write: a
crash between the two writes, or two requests racing, leaves the stores
disagreeing, and nothing reports it.

A database already solves this problem for itself. A replica stays
identical to its leader because it applies the leader's changes in the
same order they committed. CDC does the same for systems that aren't
database replicas. You extract two things from the one database you
write to:

1. **A consistent snapshot** of the data at one point in time.
2. **A stream of every change** from that point on, in commit order.

Load the snapshot into the other store, then keep applying changes. The
order comes from the database's commit log, so the race between two
writers disappears: every consumer sees the same writes in the same
order. And because you still write to a real database first, you keep
what a database gives you: reads of your own writes and constraints
like "a balance never goes negative".

Getting that stream out of a database used to be the hard part. Before
Postgres 9.4, it meant triggers, which were fiddly and slow. Other
systems had their own feeds: the MySQL binlog, the MongoDB oplog,
Oracle GoldenGate. LinkedIn built Databus and Facebook built Wormhole
for this. Postgres 9.4 added logical decoding, and the
Postgres side of CDC is now built on [[logical-replication]]: a slot
on the server, and an output plugin that turns WAL records into row
changes.

## The pipeline

The setup this page follows is Debezium, an open-source CDC tool that
runs on Kafka Connect.

![A CDC pipeline. The application writes only to Postgres. Postgres's WAL is read through a replication slot and the pgoutput plugin by the Debezium connector running in Kafka Connect. Debezium writes one Kafka topic per table, keyed by primary key, and stores the last LSN it sent as its offset. Three consumers read the topics independently: a search indexer, a cache updater and a warehouse loader.](img/change-data-capture-pipeline.svg)

*One write, many derived stores, each reading the same ordered stream at its own pace. Adapted from Martin Kleppmann, "Bottled Water: Real-time integration of PostgreSQL and Kafka" (2015).*

Step by step, for Debezium's Postgres connector (version 3.6 when this
was written):

1. The connector connects over Postgres's streaming replication
   protocol and reads from its slot. The output plugin is usually
   `pgoutput`, which has been built into Postgres since version 10, so
   nothing needs installing on the server.
2. For each committed insert, update and delete it builds a change
   event and sends it to Kafka. By default each table gets its own
   topic, named like `server.public.orders`.
3. Each event carries the WAL position (LSN) it came from. Kafka
   Connect periodically stores the last LSN as the connector's offset.
   On restart, the connector asks Postgres for changes after that LSN.
4. Consumers read the topics like any other [[log-based-messaging|log]],
   each at its own pace. A new consumer can start from the beginning.

## What a change event looks like

A Debezium event has a key and a value. The key is the row's primary
key, so every change to one row goes to the same partition and stays
in order ([[message-ordering]]). The value has four main parts:

```json
{
  "before": { "id": 1042 },
  "after":  { "id": 1042, "status": "shipped", "total": 3999 },
  "op": "u",
  "source": { "lsn": 38209784, "txId": 771, "table": "orders" }
}
```

- `op` says what happened: `c` create, `u` update, `d` delete, `r` a
  row read during a snapshot (plus `t` for truncate).
- `after` is the new row. `before` is the old row, but only as much of
  it as Postgres logged, which depends on the table's replica identity.
  By default that's just the primary key; set `REPLICA IDENTITY FULL`
  on the table if consumers need every old column.
- `source` says where it came from: LSN, transaction id, table. That's
  what a consumer uses to spot duplicates.

A delete is followed by a tombstone: same key, `null` value. With
[[log-compaction]] turned on, Kafka then drops every older message for
that key. A compacted topic keyed by primary key ends up holding the
latest version of every row, which means the topic itself works as a
snapshot a new consumer can load from.

## Starting from a snapshot without stopping the world

The WAL doesn't keep history forever, so a CDC tool can't start from
the beginning of the log. It has to copy the existing data first, and
the copy has to line up with the stream exactly: every change after
the copy must be streamed, and nothing streamed may be overwritten by
an older copied value.

The simple way: open a transaction, note the current log position,
read every table (emitting each row as an `r` event), commit, then
stream from the noted position. Postgres helps here, because a new slot
exports a snapshot that matches its start position. But on a big
database the read takes a long time, streaming waits until it's done,
and if it fails halfway you start over. Some tools also took table
locks to get a consistent copy, blocking application writes.

Netflix's DBLog fixed this with watermarks, and Debezium adopted the
same design as incremental snapshots in Debezium 1.6:

1. Pause reading the log for a moment.
2. Write a **low watermark**: update a row in a small watermark table.
3. Select the next chunk of the table, in primary key order (Debezium
   defaults to 1,024 rows).
4. Write a **high watermark**, and resume reading the log.
5. As log events between the two watermarks go by, drop any chunk row
   whose key appears in them. The log's version is newer.
6. At the high watermark, emit the chunk rows that are left.

![A change log running left to right: events for k2 and k6, a low watermark L, events for k1 and k3, a high watermark H, then another event for k2. A chunk read between L and H holds rows k1 to k6. Keys k1 and k3 changed inside the window, so those chunk rows are dropped. The output is the log events up to H (k2, k6, k1, k3), then the remaining chunk rows k2, k4, k5, k6, then the later log event for k2.](img/change-data-capture-watermarks.svg)

*The select ran somewhere between L and H; any key that changed in that window is taken from the log instead. Adapted from Andreas Andreakis and Ioannis Papapanagiotou, "DBLog: A Watermark Based Change-Data-Capture Framework" (Netflix, 2020), figures 3 and 4.*

The chunk's select ran at some unknown point between the watermarks.
Dropping every row that changed inside that window means the chunk can
never deliver an older version of a row after a newer one (DBLog calls
that "time travel"). No locks are taken, the log keeps flowing between
chunks, and progress is saved per chunk, so a snapshot can be paused,
resumed, or rerun later for one table to repair a broken consumer.

## At least once, in commit order

Changes come out of Postgres in commit order, grouped by transaction,
and rolled-back transactions never appear. Delivery to consumers,
though, is at least once. Kafka Connect stores the connector's offset
only periodically. If the connector's process crashes, the replacement
restarts from the last stored LSN and resends whatever came after it.
(The slot itself can also rewind after a database crash; see
[[logical-replication]].)

Debezium's docs describe delivery as exactly once when nothing fails
and at least once during recovery. Design for the second: make
consumers [[idempotency|idempotent]], and use the LSN in `source` to skip
events you've already applied. Debezium's events are built to be safe
to replay: applying the same sequence again ends in the same state.

## Where it gets tricky

**The slot holds WAL while you're down.** If the connector stops, the
slot keeps every WAL file since its last confirmed position, and the
disk fills. A quieter trap: if the captured tables rarely change but
other tables in the same server are busy, the connector has nothing to
confirm, so the slot never advances even though the connector is
healthy. Debezium's fix is heartbeats, periodic writes the connector
can confirm. Never drop the slot to reclaim space unless you're ready
to take a new snapshot: the changes it held are gone.

**Failover.** On Postgres 15 and earlier, logical slots exist only on
the primary, so after a failover the connector has no slot on the new
primary and resuming takes manual work. Postgres 16 allows slots on a
standby, but you sync them by hand. Postgres 17 can sync failover
slots to a standby automatically. Even then, the slot has to be
verified before applications write to the new primary.

**Your table schema becomes a public API.** Consumers see your tables'
columns directly, so changing your own table can break them.
Logical decoding doesn't carry DDL either, so schema changes aren't
part of the stream in Postgres. This is the main reason to capture a
[[transactional-outbox]] table instead of your business tables: you
publish a deliberate event and keep your schema private. Schema
registries help consumers keep up ([[message-schemas]]).

**Missing old values.** With the default replica identity, `before` has
only the primary key. Large values that Postgres stores out of line
(TOAST, for values above roughly 8 KB) and that didn't change in an
update are left out of the event entirely; Debezium puts a placeholder
there. Consumers that merge partial rows must know this.

**Row changes aren't business events.** CDC tells you that
`orders.status` went from `placed` to `shipped`. It doesn't tell you
why. Each row change is its own event; to see which rows one
transaction touched together, turn on Debezium's transaction metadata,
which adds BEGIN and END events and a transaction id to each change.
If consumers need events that carry intent, publish them yourself,
with an outbox or with [[event-sourcing]].

**Consumers are behind.** Everything downstream is eventually
consistent with the database. Read-your-writes holds only against the
database itself.

## What this means when you build

- Pick one database as the source of truth, write only to it, and feed
  every other store from its change stream.
- Set `wal_level = logical` early, give each connector its own slot,
  and alert on how far each slot is behind.
- Plan the initial snapshot: know how long a full read takes, and
  prefer chunked (incremental) snapshots for large tables.
- Make every consumer idempotent and keyed by primary key; use the LSN
  to skip duplicates.
- Decide on purpose whether consumers see your tables or an outbox of
  designed events.
- Set replica identity on tables where consumers need old values.

## Further reading

- [Debezium connector for PostgreSQL](https://debezium.io/documentation/reference/stable/connectors/postgresql.html), Debezium, version 3.6. How a production CDC connector works end to end: snapshots, streaming, event format, replica identity, TOAST, missing DDL, WAL growth, failover and duplicates.
- [DBLog: A Watermark Based Change-Data-Capture Framework](https://arxiv.org/abs/2010.12597), Andreas Andreakis and Ioannis Papapanagiotou, Netflix, 2020. The watermark algorithm for snapshots that don't lock or stall the log, and a comparison of earlier tools.
- [Bottled Water: Real-time integration of PostgreSQL and Kafka](https://www.confluent.io/blog/bottled-water-real-time-integration-of-postgresql-and-kafka/), Martin Kleppmann, 2015. Why "snapshot plus change stream" is the right shape, and how compacted topics hold both. Written for Postgres 9.4; the tool itself was alpha.
- [Using logs to build a solid data infrastructure (or: why dual writes are a bad idea)](https://www.confluent.io/blog/using-logs-to-build-a-solid-data-infrastructure-or-why-dual-writes-are-a-bad-idea/), Martin Kleppmann, 2015. Why a single ordered log fixes dual writes, and why getting it from a database keeps constraints and read-your-writes.
- [Incremental Snapshots in Debezium](https://debezium.io/blog/2021/10/07/incremental-snapshots/), Jiri Pechanec, Debezium, 2021. What was wrong with all-or-nothing snapshots, and how Debezium 1.6 adopted DBLog's watermarks.
- [Reliable Microservices Data Exchange With the Outbox Pattern](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/), Gunnar Morling, Debezium, 2019. Why capturing an outbox table keeps consumers from depending on your internal tables, and how new consumers replay a topic from the start.

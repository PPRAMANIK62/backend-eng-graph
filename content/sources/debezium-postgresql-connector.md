---
id: debezium-postgresql-connector
title: Debezium connector for PostgreSQL
author: Debezium project
url: https://debezium.io/documentation/reference/stable/connectors/postgresql.html
kind: docs
primary: true
---

## Summary

The reference for Debezium's Postgres connector (read as Debezium 3.6):
an initial snapshot, then streaming row changes from a logical
replication slot through an output plugin (pgoutput or decoderbufs),
one Kafka topic per table, change events with before/after/op/source,
replica identity and TOAST caveats, incremental snapshots with
watermarks, WAL growth, and what happens on failures.

## Key claims

- Logical decoding arrived in Postgres 9.4. "PostgreSQL’s logical decoding feature was introduced in version 9.4." (Overview)
- Two parts: an output plugin inside Postgres (decoderbufs or pgoutput) and a Java Kafka Connect connector reading via the streaming replication protocol. "The connector uses the PostgreSQL streaming replication protocol, by means of the PostgreSQL JDBC driver" (Overview)
- The WAL is purged, so the connector starts with a consistent snapshot and then streams from exactly where the snapshot was taken. "After the connector completes the snapshot, it continues streaming changes from the exact point at which the snapshot was made." (Overview)
- It records the WAL position of each event and resumes from it after a crash. "upon restart the connector continues reading the WAL where it last left off." (Overview)
- Snapshot steps: start a transaction, read the current log position, scan tables emitting READ events, commit, record completion. (Snapshots, default workflow)
- pgoutput is built into Postgres 10+, so no extra plugin needs installing. "As of PostgreSQL 10+, there is a logical replication stream mode, called pgoutput that is natively supported by PostgreSQL." (PostgreSQL 10+ logical decoding support)
- The LSN in each event is the offset Kafka Connect stores. "For the PostgreSQL connector, the LSN recorded in each change event is the offset." (Streaming changes)
- Default topic per table: topicPrefix.schemaName.tableName. (Topic names)
- Change events carry before, after, op and source; before depends on REPLICA IDENTITY. "Whether or not this field is available is dependent on the REPLICA IDENTITY setting for each table." (create events, before)
- The source block names the origin: database and table, transaction id, LSN, snapshot flag, timestamp; the JSON examples use fields such as lsn, txId and table. "This field contains information that you can use to compare this event with other events, with regard to the origin of the events, the order in which the events occurred, and whether events were part of the same transaction." (create events, source)
- With default replica identity, an update's before holds only the primary key. "In this example, only the primary key column, id, is present because the table’s REPLICA IDENTITY setting is, by default, DEFAULT." (update events, before)
- Incremental snapshots let streaming continue during the snapshot. "You can run incremental snapshots in parallel with streamed data capture, instead of postponing streaming until the snapshot completes." (Incremental snapshots)
- Optional transaction metadata: BEGIN and END events per transaction, and each change event enriched with the transaction id and its position in it. "Debezium can generate events that represent transaction boundaries and that enrich data change event messages." (Transaction metadata)
- Replaying events is safe. "Debezium changes are idempotent, so a sequence of events always results in the same state." (Kafka Connect process crashes)
- op values: c (create), u (update), d (delete), r (read, from a snapshot), t (truncate), m (message). "For snapshot events, the value of the op field value is r, because a snapshot is a READ operation." (Incremental snapshots; create, update, delete, truncate, message events)
- A delete is followed by a tombstone (same key, null value) so log compaction can drop the key. "the PostgreSQL connector follows a delete event with a special tombstone event that has the same key but a null value." (delete events)
- REPLICA IDENTITY DEFAULT gives only the old primary key values for UPDATE and DELETE; FULL gives all old columns. "FULL - Emitted events for UPDATE and DELETE operations contain the previous values of all columns in the table." (Replica identity)
- Without a primary key (and default identity), only creates are emitted. "For a table without a primary key, the connector emits only create events." (Replica identity)
- Unchanged TOASTed values (above roughly 8 KB) are left out of update events unless in the replica identity; Debezium puts a placeholder. "Values that were stored by using the TOAST mechanism and that have not been changed are not included in the message, unless they are part of the table’s replica identity." (Toasted values)
- Incremental snapshots read tables in primary-key chunks (default 1024 rows) alongside streaming, using a snapshot window: a buffered READ row is dropped if a streamed change for the same key arrives in the window. "The default chunk size for incremental snapshots is 1024 rows." (Incremental snapshots)
- "If Debezium detects a match, it discards the buffered READ event, and writes the streamed record to the destination topic, because the streamed event logically supersede the static snapshot event." (Snapshot window)
- Incremental snapshots are based on DBLog's design (DDD-3). "Incremental snapshots are based on the DDD-3 design document." (Incremental snapshots)
- WAL can pile up when the captured tables see few changes while other tables or databases are busy; heartbeats fix it. "This situation can be easily solved with periodic heartbeat events." (WAL disk space consumption)
- confirmed_flush_lsn and restart_lsn in pg_replication_slots show how far the connector has confirmed and the oldest WAL it may still need. (WAL disk space consumption)
- One slot per connector; sharing a slot risks data loss. "When multiple connectors attempt to share a replication slot, they compete for the same position marker, resulting in unpredictable behavior and potential data loss." (Setting up multiple connectors)
- Exactly once when nothing fails, at least once during recovery. "In these abnormal situations, Debezium, like Kafka, provides at least once delivery of change events." (Behavior when things go wrong)
- Never drop the slot on the primary. "Never drop a replication slot on the primary server or you will lose data." (PostgreSQL becomes unavailable)
- Postgres 17+ can sync slots to a standby for failover; on 15 and earlier slots exist only on the primary. "PostgreSQL 17 and later support failover replication slots for automatic recovery; earlier versions require manual intervention to resume event capture." (Cluster failures)
- After a crash of Kafka Connect, events since the last flushed offset are sent again; consumers should expect duplicates and can use the LSN to spot them. "consumers should always anticipate some duplicate events." (Kafka Connect process crashes)
- Logical decoding does not carry DDL, so the connector cannot report schema changes. "Logical decoding does not support DDL changes." (Overview, limitations)
- Postgres 16 allows slots on replicas, but they are synced by hand. "Synchronization of replica slots is not automatic." (Cluster failures, PostgreSQL 16 or later)
- Even on 17 with a failover slot, verify the slot before writes resume on the new primary. "Pause Debezium until you can verify that you have an intact replication slot that has not lost data." (Recovering from failures in a PostgreSQL 17 cluster)
- The page is the Debezium 3.6 documentation. "Debezium 3.6 Documentation" (page header)

## Visuals worth redrawing

None on this page.

## My notes

- "Exactly once ... when operating normally" and "at least once" on
  failure: for design purposes it's at least once.

---
id: kleppmann-bottled-water-2015
title: "Bottled Water: Real-time integration of PostgreSQL and Kafka"
author: Martin Kleppmann
url: https://www.confluent.io/blog/bottled-water-real-time-integration-of-postgresql-and-kafka/
kind: blog
primary: true
---

## Summary

The announcement of Bottled Water, an early open-source CDC tool on top
of Postgres 9.4's logical decoding. Explains why dual writes drift, why
"snapshot plus stream of changes" is how replication works, and why a
log-compacted Kafka topic keyed by primary key can hold both.

## Key claims

- Getting data out of a database into other systems is hard because it keeps changing. "Writing to a database is easy, but getting the data out again is surprisingly hard." (intro)
- CDC means extracting a consistent snapshot and a stream of changes from that point. "a consistent snapshot at one point in time, and" / "a real-time stream of changes from that point onwards." (intro)
- Applying the changes in commit order gives an exact copy; that's how replication works. "If you apply those messages to a database in exactly the same order as the original database committed them, you end up with an exact copy of the database." (intro)
- LinkedIn built Databus and Facebook built Wormhole for this. "LinkedIn built Databus and Facebook built Wormhole for this purpose." (intro)
- Before 9.4, Postgres change streams meant triggers. "Until recently, if you wanted to get a stream of changes from Postgres, you had to use triggers." (Getting the real-time stream of changes)
- Logical decoding groups events by transaction, in commit order, and leaves out rolled-back transactions. "Aborted/rolled-back transactions do not appear in the stream." (Introducing Bottled Water)
- The snapshot is taken without locking, coordinated with the stream. "without locking — you can continue writing to the database while the copy is being made" (Introducing Bottled Water)
- Kafka message key = primary key (or replica identity); deletes become null values so log compaction removes them. "For deletes, the message value is set to null." (Why Kafka?)
- With compaction, one topic holds both the snapshot and the stream; a new consumer can rebuild a copy by reading from the start. (Why Kafka?)
- Output plugins are C code loaded into the server, which needs superuser access. "This requires superuser privileges and filesystem access on the database server" (The logical decoding output plugin)
- At the time, the plugin had to run on the leader. "At the moment, the logical decoding plugin must be installed on the leader database." (The logical decoding output plugin)
- The client replays unacknowledged messages after a crash, so duplicates but no loss. "Thus, some messages could appear twice in Kafka, but no data should be lost." (The client daemon)
- Other databases had their own change feeds, listed as examples: GoldenGate, the MySQL binlog, the MongoDB oplog. (intro, list of existing tools)
- The tool was alpha. "At present, Bottled Water is alpha-quality software." (Status)

## Visuals worth redrawing

- "Using change capture to drive derived data stores": one database, change stream, several derived stores.

## My notes

- Kleppmann wrote Bottled Water, so primary for how it worked. It was
  alpha software; the limitations are from 2015 (Postgres 9.4) and
  later Postgres versions changed some (pgoutput in 10, slots on
  standbys in 16, failover slots in 17).

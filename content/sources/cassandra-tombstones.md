---
id: cassandra-tombstones
title: Tombstones (Apache Cassandra docs)
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/tombstones.html
kind: docs
primary: true
---

## Summary

How Cassandra deletes data in a replicated store: a delete is written as
a time-stamped marker, kept for a grace period so replicas that missed
it can catch up, then removed during compaction. Explains "zombies",
deleted data that comes back.

## Key claims

- A delete is an insert of a marker. "Cassandra treats a deletion as an insertion, and inserts a time-stamped deletion marker called a tombstone." (What are tombstones?)
- Tombstones expire. "The key feature difference of a tombstone is that it has a built-in expiration date/time." (What are tombstones?)
- TTLs end as tombstones too. "After this amount of time has ended, Cassandra marks the object with a tombstone, and handles it like other tombstoned objects." (What are tombstones?)
- Reads ignore older values. "Once an object is marked as a tombstone, queries will ignore all values that are time-stamped previous to the tombstone insertion." (Why tombstones?)
- Zombies. "This kind of deleted but persistent object is called a zombie." (Zombies)
- How a zombie happens. "If the tombstoned object has already been deleted from the rest of the cluster before that node recovers, Cassandra treats the object on the recovered node as new data, and propagates it to the rest of the cluster." (Zombies)
- The grace period is per table, default ten days. "Its default value is 864000 seconds (ten days), after which a tombstone expires and can be deleted during compaction." (Grace period)
- What the grace period is for. "The purpose of the grace period is to give unresponsive nodes time to recover and process tombstones normally." (Grace period)
- Removal needs compaction to see the data too. "a tombstone can live in one SSTable and the data it marks for deletion in another, so a compaction must also remove both SSTables." (Deletion)
- Nothing happens until compaction runs. "Note that tombstones will not be removed until a compaction event even if gc_grace_seconds has elapsed." (Deletion)
- A node down longer than the grace period brings deletes back. "If a node remains down or disconnected for longer than gc_grace_seconds, its deleted data will be repaired back to the other nodes and reappear in the cluster." (Deletion)

## Visuals worth redrawing

- The three-node "[A], [A], [A]" walkthroughs with and without
  tombstones (Deletes without / with tombstones).

## My notes

- "latest" docs; Cassandra 5.0 at the time.

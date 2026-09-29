---
id: cassandra-repair
title: "Repair (Apache Cassandra operating docs)"
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/latest/cassandra/managing/operating/repair.html
kind: docs
primary: true
---

## Summary

Cassandra 5.0's anti-entropy repair: replicas build Merkle trees over
shared token ranges, compare them and stream the differences. Covers full
vs incremental repair, that it isn't run automatically, and why skipping
it can bring deleted data back.

## Key claims

- Hints can miss writes, and those gaps can turn into data loss. "Hints attempt to inform a node of missed writes, but are a best effort, and aren’t guaranteed to inform a node of 100% of the writes it missed." (Repair)
- Repair compares Merkle trees. "It compares the data with merkle trees, which are a hierarchy of hashes." (Repair)
- Incremental is the default kind. "Incremental repairs are the default repair type" (Incremental and Full Repairs)
- Incremental repair doesn't catch corruption or bugs, so full repair still has to run sometimes. "it doesn’t protect against things like disk corruption, data loss by operator error, or bugs in Cassandra." (Incremental and Full Repairs)
- Repair isn't automatic. "Since repair can result in a lot of disk and network io, it’s not run automatically by Cassandra." (Usage and Best Practices)
- A starting schedule. "running an incremental repair every 1-3 days, and a full repair every 1-3 weeks is probably reasonable." (Usage and Best Practices)
- Skip repair past the gc grace period and deletes come back. "At a minimum, repair should be run often enough that the gc grace period never expires on unrepaired data. Otherwise, deleted data could reappear." (Usage and Best Practices)
- The numbers. "With a default gc grace period of 10 days, repairing every node in your cluster at least once every 7 days will prevent this, while providing enough slack to allow for delays." (Usage and Best Practices)
- Missed writes plus expiring tombstones can lose data. "These inconsistencies can eventually result in data loss as nodes are replaced or tombstones expire." (Repair)
- Full repair covers all data; incremental only new data. "Full repairs operate over all of the data in the token range being repaired. Incremental repairs only repair data that’s been written since the previous incremental repair." (Incremental and Full Repairs)
- It runs through nodetool. "Incremental repair is the default and is run with the following command: nodetool repair" (Usage and Best Practices)
- Incremental repair never re-checks repaired data. "once an incremental repair marks data as repaired, it won’t try to repair it again." (Incremental and Full Repairs)

## Visuals worth redrawing

None.

## My notes

- "Deleted data could reappear" is the tombstone problem: a replica that
  missed the delete still has the old value after the tombstone is
  purged, and repair copies it back.

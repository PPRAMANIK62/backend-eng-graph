---
id: cassandra-compaction-overview
title: Compaction overview (Apache Cassandra 5.0 docs)
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/5.0/cassandra/managing/operating/compaction/overview.html
kind: docs
primary: true
---

## Summary

Cassandra 5.0's overview of compaction: why SSTables pile up, what a
compaction does, the kinds of compaction, the four strategies (UCS,
STCS, LCS, TWCS), and tombstones with their grace period.

## Key claims

- Why compaction is needed. "Since SSTables are consulted during read operations, it is important to keep the number of SSTables small." (Why must compaction be run?)
- What it accomplishes. "Two important factors accomplished by compaction are performance improvement and disk space reclamation." (What does compaction accomplish?)
- It's a sequential merge. "The merge process is performant, because rows are sorted by partition key within each SSTable, and the merge process does not use random I/O." (How does compaction work?)
- Old SSTables are deleted after pending reads finish. "The old versions, along with any rows that are ready for deletion, are left in the old SSTables, and are deleted as soon as pending reads are completed." (How does compaction work?)
- Minor compactions are automatic (after a flush, after compactions add SSTables, a periodic check). "A minor compaction triggered automatically in Cassandra for several actions:" (Types of compaction)
- A major compaction is one a user runs over everything. "A major compaction is triggered when a user executes a compaction over all SSTables on the node." (Types of compaction)
- UCS is recommended for new workloads. "UCS is a good choice for most workloads and is recommended for new workloads." (Strategies)
- STCS is still the default. "STCS is the default compaction strategy, because it is useful as a fallback when other strategies don’t fit the workload." (Strategies)
- LCS is for reads and updates, not immutable time series. "Leveled Compaction Strategy (LCS) is optimized for read heavy workloads, or workloads with lots of updates and deletes." (Strategies)
- TWCS is for TTL'd time series. "Time Window Compaction Strategy is designed for TTL’ed, mostly immutable time-series data." (Strategies)
- A delete is an insert of a tombstone. "Cassandra treats a deletion as an insertion, and inserts a time-stamped deletion marker called a tombstone." (Tombstones)
- Tombstones have a grace period, 864000 seconds (ten days) by default, to stop deleted data coming back from a replica that missed the delete. "Its default value is 864000 seconds (ten days), after which a tombstone expires and can be deleted during compaction." (Zombies)
- A tombstone can only go when the data it hides goes too. "But one complication for deletion is that a tombstone can live in one SSTable and the data it marks for deletion in another, so a compaction must also remove both SSTables." (Deletion)

## Visuals worth redrawing

None.

## My notes

- The page shows a "prerelease version" banner even under /doc/5.0/.
- Zombies from replicas are a distributed problem (phase 11); here the
  point is only that tombstones must outlive the data they hide.

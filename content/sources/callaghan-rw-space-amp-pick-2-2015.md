---
id: callaghan-rw-space-amp-pick-2-2015
title: Read, write & space amplification - pick 2
author: Mark Callaghan
url: http://smalldatum.blogspot.com/2015/11/read-write-space-amplification-pick-2_23.html
kind: blog
primary: true
---

## Summary

The short post that named the framework: read, write and space
amplification as three efficiency metrics for a database engine, and the
claim that an algorithm can be good at two of them but not all three.
Written by a database performance engineer who worked on InnoDB and
RocksDB (MyRocks) at Facebook, so primary for how those teams measured
engines.

## Key claims

- You can optimize for at most two of the three. "An algorithm can optimize for at most two from read, write and space amplification." (intro)
- B-tree vs LSM in one line. "For example a B-Tree has less read amplification than an LSM while an LSM has less write amplification than a B-Tree." (intro)
- The metrics assume a workload and a setup, and don't replace big-O. "They usually assume a specific workload and configuration including RAM size, database size and type of storage." (Purpose)
- Why they started: comparing InnoDB and RocksDB, speed alone wasn't enough. "better performance is an insufficient metric on which to choose an algorithm" (Purpose)
- Flash makes write-amp (endurance) and space-amp (capacity) matter. "Endurance (write amp) and capacity (space amp) matter when using flash." (Purpose)
- Constant factors matter once some data is on disk. "The difference between 1.2 and 1.5 disk reads per query can be a big deal." (Purpose)
- Read-amp definition. "Read-amp is the amount of work done per logical read operation." (Read amplification)
- Read-amp covers key comparisons in memory, and bytes and seeks on disk, plus decompression. "The work done can also include the cost of decompressing data read from storage" (Read amplification)
- Read-amp is separate for point queries, range queries, and point queries on missing keys; bloom filters help only the point case. "Bloom filters can't be used for a range query." (Read amplification)
- Write-amp definition. "Write-amp is the amount of work done per write operation." (Write amplification)
- A B-tree pays its read cost right away, an LSM defers it to compaction. "The read cost is deferred for a write-optimized algorithm like an LSM as compaction is done in the background and decoupled from the logical write." (Write amplification)
- The flash drive's own garbage collection adds write-amp underneath, when data with different lifetimes shares an erase block. "When data with different lifetimes ends up in the same logical erase block then the long-lived data will be copied out and increase flash GC write-amp (WAF greater than 1)." (Write amplification)
- Space-amp definition, and what moves it. "Space-amp is the ratio of the size of the database to the size of the data in the database." (Space amplification)
- Fragmentation in B-trees, old versions in LSMs. "It is increased by fragmentation with a B-Tree and old versions of rows with an LSM." (Space amplification)
- Performance and efficiency differ: parallel disk reads can hide read-amp in latency but not in capacity. "This improves response time but doesn't improve efficiency" (Efficiency & Performance)

## Visuals worth redrawing

None in the post.

## My notes

- Part one of a series; the B-tree vs LSM numbers are in
  `callaghan-btree-vs-lsm-amp-2015`.

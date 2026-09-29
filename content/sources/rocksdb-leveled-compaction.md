---
id: rocksdb-leveled-compaction
title: Leveled Compaction (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/Leveled-Compaction
kind: docs
primary: true
---

## Summary

How RocksDB's default compaction works: L0 files straight from the
memtable, L1 and below each one sorted run split into SST files, target
sizes growing by a multiplier, the scoring that picks which level to
compact, dynamic level sizing (default since 8.4), intra-L0 compaction,
and TTL and periodic compaction.

## Key claims

- L0 holds flushed memtables; other levels are one sorted run each. "Each level (except level 0) is one data sorted run" (Structure of the files)
- Inside a level, data is split by range into SST files. "Inside each level (except level 0), data is range partitioned into multiple SST files" (Structure of the files)
- Lookup in a level is a binary search on file ranges, then inside the file. "In all, it is a full binary search across all the keys in the level." (Structure of the files)
- Level targets grow exponentially. "The size targets are usually exponentially increasing" (Structure of the files)
- L0 to L1 is triggered by file count and usually takes all L0 files. "Normally we have to pick up all the L0 files because they usually are overlapping" (Compactions)
- Then one file from Ln is merged with the overlapping range of Ln+1. "we will pick at least one file from L1 and merge it with the overlapping range of L2." (Compactions)
- Several compactions can run at once; L0 to L1 isn't parallel by default. "However, L0 to L1 compaction is not parallelized by default." (Compactions)
- Which level first: score = size / target (L0: file count / trigger), highest wins. "We compare the score of each level, and the level with highest score takes the priority to compact." (Compaction Picking)
- Dynamic level bytes is recommended and default since 8.4. "`level_compaction_dynamic_level_bytes` is `true` (Recommended, default since version 8.4)" (Option heading)
- With it, targets are computed back from the last level, so 90% of data sits in the last level. "This is to guarantee a stable LSM-tree structure, where 90% of data is stored in the last level" (Guaranteed Space Amp Upper Bound)
- Worked example: base 1 GB, 6 levels, 276 GB last level gives targets 0, 0, 0.276, 2.76, 27.6 and 276 GB. "the target size of L1-L6 will be 0, 0, 0.276GB, 2.76GB, 27.6GB and 276GB, respectively." (Guaranteed Space Amp Upper Bound)
- Leveled compaction still can't keep up with writes far above its capacity. "Note that leveled compaction still cannot efficiently handle write rate that is too much higher than capacity based on the configuration." (More Adaptive Compaction)
- Leveled write amplification is often above 10. "Additional write amplification of 1 is far smaller than the usual write amplification of leveled compaction, which is often larger than 10." (Intra-L0 Compaction)
- Too many L0 files hurt reads. "Too many L0 files hurt read performance in most queries." (Intra-L0 Compaction)
- Cold key ranges can keep garbage forever without TTL compaction. "A file could exist in the LSM tree without going through the compaction process for a really long time if there are no updates to the data in the file's key range." (TTL)
- A TTL option forces old files through compaction to the bottommost level. "Files (and, in turn, data) older than TTL will be scheduled for compaction when there is no other background work." (TTL)

## Visuals worth redrawing

- The sequence of figures: L0 merged into L1, L1 overflows, one file
  pushed into L2, and so on.

## My notes

- The wiki is undated; version facts pinned to 8.2 and 8.4 as stated.

---
id: callaghan-btree-vs-lsm-amp-2015
title: Read, write & space amplification - B-Tree vs LSM
author: Mark Callaghan
url: http://smalldatum.blogspot.com/2015/11/read-write-space-amplification-b-tree.html
kind: blog
primary: true
---

## Summary

Part two of the amplification series. Works through read, write and
space amplification for a clustered B-tree (like InnoDB) and an LSM with
leveled compaction (RocksDB), with worked numbers, then says how to
measure them in a benchmark with iostat, vmstat and the database size.
The comment thread adds whether compaction reads belong to read-amp or
write-amp.

## Key claims

- Assumptions for read-amp: the B-tree's non-leaf levels are cached; for the LSM, everything but the largest level's data blocks. "For the LSM I assume that everything but the data blocks of the largest LSM level are in cache." (Read Amplification)
- Under those assumptions, worst-case disk reads per point query is one for both. "Worst-case disk read-amp for point queries is 1 for the B-Tree and the LSM" (Read Amplification)
- Bloom filters help point queries, but too many L0 files means too many filter checks, and they don't help range queries. "Bloom filters don't work for range queries, ignoring prefix bloom filters." (Read Amplification)
- Size-tiered compaction needs much more cache than leveled. "The cache requirement is much larger for an LSM with size-tiered compaction." (Read Amplification)
- B-tree worst case: one redo log write plus one page write per row change; 128-byte row, 4096-byte page gives 33. "The write-amp is 33 -- (4096 + 128) / 128." (Write Amplification)
- It gets smaller when several changes land on one page before write-back. "The write-amp is reduced when there is more one changed row on a page or when one row is changed many times before write back." (Write Amplification)
- LSM per level: about 10 in the handwaving model, about 7 in practice. "The write-amp to move rows from level N to N+1 is ~10 given my handwaving but in practice it is ~7" (Write Amplification)
- LSM total for levels 0 to 4: 1 redo, 1 flush, about 1 for L0 to L1, 7 for each of levels 2 to 4. "then the total write-amp is 24 -- 1 + 1 + 1 + 7 + 7 + 7." (Write Amplification)
- The two examples weren't meant as a head-to-head; the general tendency. "An LSM tends to have less write-amp than a B-Tree." (Write Amplification)
- Streams from different LSM levels have different data lifetimes and can mix in one flash erase block, so flash GC still adds write-amp. "If it does then there will be write-amp from flash GC even with an LSM." (Write Amplification)
- B-tree leaf pages end up 50 to 70% full under random updates, so space-amp 1.5 to 2. "When they are 2/3 full then space-amp is 1.5 and when they are 1/2 full then space-amp is 2." (Space Amplification)
- InnoDB per-row metadata. "An update-in-place B-Tree like InnoDB uses ~20 bytes/row for metadata to support consistent read and transactions." (Space Amplification)
- Compressed B-tree pages waste space because on-disk page sizes are fixed. "When a 16kb in-memory page compressed to 5kb for a table that uses 8kb pages on disk, then 3kb of the 8kb page on disk is wasted." (Space Amplification)
- LSM space-amp by compaction style. "With leveled compaction you are likely to get space-amp of 1.1 or 1.2 and with size-tiered compaction a more common result is space-amp of 2." (Space Amplification)
- Size-tiered needs temporary extra space while compacting the largest file. "Size-tiered compaction can suffer even more from additional but temporary space-amp when the max file is compacted" (Space Amplification)
- With compression, space-amp can drop below 1. "Compression reduces space-amp and for this reason I claim that space-amp of less than 1 is possible." (Space Amplification)
- How to measure: normalize server IO and CPU by queries per second. "I have begun reporting on read, write and space amplification by normalizing the server's IO and CPU rates by QPS during benchmarks." (B-Tree vs LSM in practice)
- iostat for disk read-amp and write-amp, vmstat CPU as a proxy for in-memory amp, database size for space-amp. "I use vmstat to measure the CPU utilization and that is a proxy for the in-memory read-amp and write-amp." (B-Tree vs LSM in practice)
- Run long enough for things to degrade. "I try to run workloads for at least 12 hours to give things time to go bad." (B-Tree vs LSM in practice)
- MyRocks vs InnoDB result. "The big deal for MyRocks compared to InnoDB is half the space-amp and half the write-amp." (B-Tree vs LSM in practice)
- Comment thread: asked whether compaction reads count as read-amp, the author would put them under write-amp, and notes B-trees also read during writes. "Write-amp is about the overhead for writes, and I would include it there" (comments)
- The B-tree worst case assumes a full buffer pool: reading the page in forces a dirty page out. "reading the to-be-modified page into the buffer pool forces a dirty page to be evicted and written back." (Write Amplification)

## Visuals worth redrawing

None; the worked write-amp sums are easy to draw as two write paths.

## My notes

- The comment thread points to a FAST 2016 paper for why the per-level
  number is below 10; not opened.

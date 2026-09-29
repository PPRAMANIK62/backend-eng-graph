---
id: rocksdb-overview
title: RocksDB Overview (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/RocksDB-Overview
kind: docs
primary: true
---

## Summary

The RocksDB wiki's architecture overview: a key-value library forked
from LevelDB 1.5, built from a memtable, a write-ahead log and sorted
SST files, with compaction styles, compression per level, block cache,
and the features around them.

## Key claims

- Forked from LevelDB. "The initial code was forked from open source leveldb 1.5." (1. Introduction)
- Three basic constructs. "The three basic constructs of RocksDB are **memtable**, **sstfile** and **logfile**." (3. High Level Architecture)
- Writes go to the memtable and optionally the WAL; a full memtable is flushed and its log deleted. "When the memtable fills up, it is flushed to a [**sstfile**](https://github.com/facebook/rocksdb/wiki/Rocksdb-BlockBasedTable-Format) on storage and the corresponding logfile can be safely deleted." (3)
- Restart replays the log. "On restart, it re-processes all the transactions that were recorded in the log." (4, Persistence)
- Per-write choice of whether to fsync the log; group commit shares one fsync. "Internally, RocksDB uses a batch-commit mechanism to batch transactions into the log so that it can potentially commit multiple transactions using a single `fsync` call." (4, Persistence)
- Blocks are never modified after being written, and each has a checksum. "A block, once written to storage, is never modified." (4, Data Checksuming)
- Why compaction exists. "Compaction removes key-value bindings that have been deleted or overwritten, and re-organizes data for query efficiency." (4, Multi-Threaded Compactions)
- Flush to L0 drops duplicates already. "RocksDB removes duplicate and overwritten keys in the memtable when it is flushed to a file in L0." (4, Multi-Threaded Compactions)
- Write throughput depends on compaction speed. "The overall write throughput of an LSM database directly depends on the speed at which compactions can occur, especially when the data is stored in fast storage like SSD or RAM." (4)
- L0 files overlap; other levels form one sorted run each. "Files in L0 may have overlapping keys, but files in other levels generally form a single sorted run per level." (4, Compaction Styles)
- Leveled (default) optimizes space amplification; universal optimizes write amplification. "Universal typically results in lower write-amplification but higher space- and read-amplification than Level Style Compaction." (4, Compaction Styles)
- FIFO compaction deletes the oldest file. "When total size of the data exceeds configured size (CompactionOptionsFIFO::max_table_files_size), we delete the oldest table file." (4, Compaction Styles)
- Write stalls: busy compaction threads can leave no room to flush. "If all background compaction threads are busy doing long-running compactions, then a sudden burst of writes can fill up the _memtable_(s) quickly, thus stalling new writes." (Avoiding Stalls)
- Compression can differ per level; 90% of data is at the bottom. "RocksDB may be configured to support different compression algorithms for data at the bottommost level, where `90%` of data lives." (Data Compression)
- A typical setup: ZSTD at the bottom, LZ4 above. "A typical installation might configure ZSTD (or Zlib if not available) for the bottom-most level and LZ4 (or Snappy if it is not available) for other levels." (Data Compression)
- The block cache has an uncompressed and an optional compressed part. "The block cache is partitioned into two individual caches: the first caches uncompressed blocks and the second caches compressed blocks in RAM." (Block Cache)
- Most LSM engines struggle with range scans because they touch many files. "Most LSM-tree engines cannot support an efficient range scan API because it needs to look into multiple data files." (Prefix Iterators)
- Whether to log a write, and whether to fsync the log before it commits, is a per-write option. "The `WriteOptions` may also specify whether or not a `fsync` call is issued to the transaction log before a `Put` is declared to be committed." (4, Persistence)
- Multi-threaded compaction can raise sustained write rates up to 10x on SSDs. "It is observed that sustained write rates may increase by as much as a factor of 10 with multi-threaded compaction when the database is on SSDs, as compared to single-threaded compactions." (4, Multi-Threaded Compactions)

## Visuals worth redrawing

- The architecture figure (memtable, WAL, SST files in levels, flush and
  compaction arrows).

## My notes

- Undated wiki; read when this was written.

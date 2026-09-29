---
id: rocksdb-wal
title: Write Ahead Log (WAL)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log-%28WAL%29
kind: docs
primary: true
---

## Summary

RocksDB wiki overview of its write-ahead log: every write goes to the
memtable and the WAL, the WAL rebuilds the memtable after a crash, and
a WAL file can be deleted once every column family has flushed past
it. Read via the wiki's raw markdown
(https://raw.githubusercontent.com/wiki/facebook/rocksdb/Write-Ahead-Log-%28WAL%29.md).

## Key claims

- Each update goes to the memtable and to the WAL on disk. "Every update to RocksDB is written to two places" (Overview)
- After a failure the WAL rebuilds the memtable. "In the event of a failure, write ahead logs can be used to completely recover the data in the memtable" (Overview)
- The default guarantees process crash consistency by flushing the WAL after every write. "In the default configuration, RocksDB guarantees process crash consistency by flushing the WAL after every user write." (Overview)
- One WAL is shared by all column families. "A single WAL captures write logs for all column families" (Overview)
- A new WAL starts when a column family is flushed. (Life Cycle of a WAL)
- A WAL can be deleted only when all data in it is in SST files. "A WAL is deleted (or archived if archival is enabled) when all column families have flushed beyond the largest sequence number contained in the WAL" (Life Cycle of a WAL)
- max_total_wal_size forces flushes so old WALs can be deleted. "Once WALs exceed this size, RocksDB will start forcing the flush of column families to allow deletion of some oldest WALs." (max_total_wal_size)
- disableWAL skips the log for a write. "WriteOptions::disableWAL is useful when users rely on other logging or don't care about data loss." (WriteOptions::disableWAL)

## Visuals worth redrawing

None.

## My notes

- "Flushing the WAL" here means pushing it to the OS, not fsync; see
  rocksdb-wal-performance for sync = false being the default.

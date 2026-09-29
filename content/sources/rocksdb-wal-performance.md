---
id: rocksdb-wal-performance
title: WAL Performance
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/WAL-Performance
kind: docs
primary: true
---

## Summary

RocksDB wiki page on WAL sync modes, group commit, I/Os per write and
the write amplification a synced WAL causes for tiny writes. Read via
the wiki's raw markdown
(https://raw.githubusercontent.com/wiki/facebook/rocksdb/WAL-Performance.md).

## Key claims

- By default (sync = false) WAL writes aren't synced to disk. "When WriteOptions.sync = false (the default), WAL writes are not synchronized to disk." (Non-Sync Mode)
- In that mode the WAL write isn't crash safe. "In this mode, the WAL write is not crash safe." (Non-Sync Mode)
- manual_wal_flush keeps WAL writes inside RocksDB until FlushWAL. (Non-Sync Mode)
- SyncWAL forces an fsync without blocking other writers. "The function will not block writes being executed in other threads." (Non-Sync Mode)
- With sync = true the WAL is fsynced before the write returns. "When WriteOptions.sync = true, the WAL file is fsync'ed before returning to the user." (Sync Mode)
- Group commit: concurrent writes are combined into one WAL write with one fsync. "all outstanding writes that qualify to be combined will be combined together and write to WAL once, with one fsync." (Group Commit)
- Writes with different options may not combine; group max 1MB; RocksDB doesn't delay writes to grow a group. "RocksDB won't try to increase batch size by proactive delaying the writes." (Group Commit)
- Each fsync of a new WAL file is at least two I/Os, data and metadata, because the file size changes. "every fsync will generate at least two I/Os, one for data and one for metadata." (Number of I/Os per write)
- recycle_log_file_num reuses WAL files so the size doesn't change and the metadata I/O may be avoided. (Number of I/Os per write)
- A 40-byte synced write can update 8KB, write amplification about 200. "If write is only 40 bytes, 8KB is updated, the write amplification is 8 KB/40 bytes ~= 200." (Write Amplification)

## Visuals worth redrawing

None.

## My notes

- Pairs with rocksdb-wal. The Basic Operations wiki page (opened) adds
  that a process crash alone loses nothing with sync = false, only a
  machine crash does; not given a note.

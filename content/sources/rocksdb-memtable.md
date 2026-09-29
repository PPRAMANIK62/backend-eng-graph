---
id: rocksdb-memtable
title: MemTable (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/MemTable
kind: docs
primary: true
---

## Summary

RocksDB's wiki page on the memtable: what it is, the options that size
it, the choice of implementations (skip list by default, hash-based
ones and a vector), when it's flushed, and concurrent inserts.

## Key claims

- What the memtable does. "MemTable is an in-memory data structure holding data before they are flushed to SST files." (opening)
- Reads check it first because it has the newest data. "reads has to query memtable before reading from SST files, because data in memtable is newer." (opening)
- When full it becomes immutable and a background thread flushes it. "Once a memtable is full, it becomes immutable and replaced by a new memtable." (opening)
- Default size of one memtable is 64 MB. "`ColumnFamilyOptions::write_buffer_size`: Size of a single memtable (Default: 64MB)." (options list)
- By default at most two memtables are kept before they're flushed. "The maximum number of memtables build up in memory, before they flush to SST files. (Default: 2)" (options list)
- The default implementation is a skip list. "The default implementation of memtable is based on skiplist." (opening)
- Why a skip list. "Skiplist-based memtable provides general good performance to both read and write, random access and sequential scan." (Skiplist MemTable)
- Hash-based memtables can't scan across prefixes cheaply. "The biggest limitation of the hash based memtables is that doing scan across multiple prefixes requires copy and sort, which is very slow and memory costly." (HashSkiplist MemTable)
- Only the skip list supports concurrent inserts, which are on by default. "Concurrent memtable insert is enabled by default and can be turn off via `DBOptions::allow_concurrent_memtable_write` option, although only skiplist-based memtable supports the feature." (Concurrent Insert)
- Memory overhead of the skip list is about 1.33 pointers per entry. "Average (~1.33 pointers per entry)" (Comparison table)
- Flush can happen before the memtable is full (total memtable memory, WAL size). "As a result, a memtable can be flushed before it is full." (Flush)
- Memtable data is uncompressed; SST files may be compressed. "since data in memtable is uncompressed." (Flush)

## Visuals worth redrawing

None.

## My notes

- 1.33 pointers per entry matches Pugh's 1⅓ for p = 1/4.
- The wiki is undated; read when this was written.

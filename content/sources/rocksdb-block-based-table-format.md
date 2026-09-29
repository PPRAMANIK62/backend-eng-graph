---
id: rocksdb-block-based-table-format
title: Rocksdb BlockBasedTable Format (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/Rocksdb-BlockBasedTable-Format
kind: docs
primary: true
---

## Summary

RocksDB's default SST format, forked from LevelDB's table format. Same
data blocks, BlockHandles and footer idea, with more meta blocks: full
or partitioned filters, a properties block, a compression dictionary
and range deletions.

## Key claims

- Forked from LevelDB's format. "This page is forked from LevelDB's document on [table format]" (opening)
- It's the default. "BlockBasedTable is the default SST table format in RocksDB." (opening)
- Meta blocks include filter, index, compression dictionary, range deletions and properties. "[meta block 3: compression dictionary block]" (File format)
- The index is a binary-search structure mapping keys to data blocks, possibly partitioned. "Index blocks are used to look up a data block containing the range including a lookup key." (Index Block)
- Full filter: one filter block per file. "In this filter there is one filter block for the entire SST file." (Full filter)
- The old per-2KB block-based filter is deprecated. "Note: the below explains block based filter, which is deprecated." (Block-based filter)
- Default properties recorded per file: data size, index size, filter size, raw key and value sizes, entry count, block count. "number of data blocks" (Properties Meta Block)
- Why a compression dictionary. "the dictionary is built during a single pass over the block, so small data blocks always have small and thus ineffective dictionaries." (Compression Dictionary Meta Block)
- The dictionary is built only when compacting into the bottommost level. "More specifically, the compression dictionary is built only during compaction to the bottommost level, where the data is largest and most stable." (Compression Dictionary Meta Block)
- Range deletions live in their own block. "Range deletions cannot be inlined in the data blocks together with point data since the ranges would then not be binary searchable." (Range Deletion Meta Block)
- Range deletions can only be dropped at the bottommost level. "They can be obsoleted (i.e., dropped) only during compaction to the bottommost level." (Range Deletion Meta Block)
- The dictionary is built from sampled data and is off by default. "Our solution is to initialize the compression library with a dictionary built from data sampled from previously seen blocks." and "By default it is zero, i.e., the block is not generated or stored." (Compression Dictionary Meta Block)
- Filters can be partitioned too. "The full filter is partitioned into multiple blocks." (Partitioned Filter)

## Visuals worth redrawing

- The file layout list; same shape as LevelDB's with more meta blocks.

## My notes

- Undated wiki; the filter note pins format_version=5 to RocksDB 6.6.

---
id: sstable
title: SSTables
depth: short
phase: 7
note: >-
  An immutable sorted file of blocks, with a block index and a bloom
  filter.
needs: [lsm-tree, bloom-filter, block-compression, binary-encoding, checksums]
leads_to: [compaction]
compare_with: []
---

# SSTables

An SSTable is the file an [[lsm-tree]] writes to disk: an immutable,
sorted map from keys to values, where both are arbitrary bytes. It's
split into small blocks, with an index at the end that says which block
holds which keys, and usually a [[bloom-filter]] that says which keys
it definitely doesn't hold. The format comes from Google, where
Bigtable kept its data in SSTables. LevelDB's table format follows the
same design, and RocksDB's is a fork of LevelDB's.

## Built once, in one pass

An SSTable is written by a memtable flush or by [[compaction]], and in
both cases the keys arrive already sorted. So the writer can stream:
fill a block with key/value pairs, write it, start the next, and keep
notes on the side. Once the last data block is out, it writes what it
learned along the way (the filter, the index) and then a small footer.
After that the file is never changed. That's why the index sits at the
end: it can't be written until all the data blocks exist.

Here's the layout of a LevelDB table, top to bottom:

- **Data blocks.** The sorted key/value pairs, cut into blocks, each
  optionally compressed on its own ([[block-compression]]). LevelDB's
  default block is about 4 KB before compression; Bigtable's was
  typically 64 KB.
- **Meta blocks.** In LevelDB, the filter block. RocksDB adds more
  (below).
- **A metaindex block.** Names each meta block and says where it is.
- **An index block.** One entry per data block. The key is a separator:
  something at least as large as the block's last key and smaller than
  the next block's first key. The value says where the block is.
- **A footer.** A fixed 48 bytes at the very end: where the metaindex
  and index blocks are, padding, and an 8-byte magic number that marks
  the file as a table. (Two handles of at most 20 bytes each, plus the
  8-byte magic, make the 48.)

"Where a block is" is a *block handle*: an offset and a size, each
written as a varint (see [[binary-encoding]]). Every block on disk is
followed by a 5-byte trailer, a byte saying how it's compressed and a
32-bit CRC, so a corrupted block is caught when it's read (see
[[checksums]]).

![Left: an SSTable file from top to bottom, with data blocks 1 to N, a filter block, a metaindex block, an index block whose entries (user:13 to block 1, user:22 to block 2) point up at the data blocks, and a 48-byte footer that points at the index and metaindex. Right: inside data block 1, four entries with shared and unshared byte counts: user:1001 stored in full at a restart point, user:1002 stored as 8 shared bytes plus "2", user:1057 as 7 shared bytes plus "57", and a later restart with user:1210 in full; the block ends with the restart offsets and their count. Then the block is compressed and gets a 5-byte trailer with the compression type and a CRC32.](img/sstable-layout.svg)

*A LevelDB-style table and one of its data blocks. Adapted from the LevelDB authors, "leveldb File format" and "table/block_builder.cc".*

## Inside a data block

Sorted keys next to each other usually share a prefix: `user:1001`,
`user:1002`, `user:1057`. So a block doesn't store each key in full.
Each entry records how many bytes it shares with the previous key, how
many new bytes follow, the value's length, then just the new bytes and
the value.

That makes a block smaller but impossible to search from the middle,
since every key depends on the one before. So every 16 keys (LevelDB's
default), the block stores a key in full: a *restart point*. The end of
the block lists the offsets of all restart points. A lookup binary
searches the restart points, then walks forward at most a few entries.

## Reading one key

1. Read the footer. It has a fixed size, so its position is the file
   size minus 48.
2. Read the index block (engines keep it in memory once the file is
   open) and binary search it for the first separator ≥ your key.
3. Check the filter. If it says "definitely not", stop here.
4. Read that one data block, check its CRC, decompress it, and search
   it as above.

With the index and filter in memory, that's at most one disk read per
file. An [[lsm-tree]] may
repeat this for a few files, newest first, until it finds the key.

## What RocksDB added

RocksDB's default table format is a fork of LevelDB's with more meta
blocks:

- **Filters.** One full filter per file replaced LevelDB's filter per
  2 KB of data, which is now deprecated. Filters and indexes can also be
  split into partitions by key range.
- **A properties block** with sizes and counts: data size, index size,
  filter size, raw key and value sizes, number of entries and blocks.
- **A compression dictionary,** built from sampled data when writing
  the bottommost level, because small blocks compress poorly on their
  own. It's off by default.
- **A range deletion block.** A "delete everything from A to B" entry
  can't sit among point keys, since it would break binary search, so it
  gets its own block. These can be dropped only during compaction into
  the bottommost level.

## What this means when you build

- Write sorted input straight through: data blocks first, then filter,
  index and footer. Never go back and patch the file.
- Put a checksum on every block and a magic number in the footer, and
  check both on read.
- Keep the index and filter of open files in memory; read data blocks
  on demand.
- Pick a block size for your reads: small for point lookups, larger for
  scans and better compression (see [[block-compression]]).

## Further reading

- [leveldb File format](https://github.com/google/leveldb/blob/main/doc/table_format.md), LevelDB authors. The whole table layout on one page: blocks, handles, index, filter block and footer.
- [leveldb table/block_builder.cc](https://github.com/google/leveldb/blob/main/table/block_builder.cc), LevelDB authors. The header comment is the spec for prefix-compressed entries and restart points.
- [Rocksdb BlockBasedTable Format (RocksDB wiki)](https://github.com/facebook/rocksdb/wiki/Rocksdb-BlockBasedTable-Format), RocksDB team. What a modern engine adds: full and partitioned filters, properties, dictionaries and range deletions.
- [Bigtable: A Distributed Storage System for Structured Data](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf), Fay Chang and others, 2006. Section 4: the original SSTable, and why a lookup costs one seek.

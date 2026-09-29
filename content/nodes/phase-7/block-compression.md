---
id: block-compression
title: Block compression
depth: short
phase: 7
note: >-
  Compressing pages or blocks: trading CPU for less I/O.
needs: []
leads_to: [sstable, column-storage]
compare_with: []
---

# Block compression

Block compression means compressing a data file in small, separate
pieces, a few kilobytes each, instead of as one stream. A database can
then read and decompress just the piece that holds the row it wants.
You spend CPU to compress and decompress, and get back smaller files:
less disk, fewer bytes read and written, and more data in the same
cache.

## Why blocks and not whole files

A storage engine's files are made of blocks, the unit it reads from
disk. In an [[sstable]], keys are sorted and packed into data blocks,
by default about 4 KB (uncompressed) in LevelDB and typically 64 KB in
Google's Bigtable. A lookup finds the right block through the file's
index and reads only that one.

If you compressed the whole file as one stream, reading one row would
mean decompressing everything before it. So each block is compressed on
its own. The file's index still finds the right block, and only that
block is read and decompressed. Then the engine searches inside it.

The price is compression ratio. A compressor learns from the data it
has already seen, and a 4 KB block doesn't give it much to learn from.
Bigger blocks compress better but make every point read fetch and
decompress more. LevelDB's advice is to go bigger if you mostly scan and
smaller if you mostly read small values, and not below about 1 KB or
above a few megabytes.

## Picking an algorithm

Fast compressors decompress at well over a gigabyte per second. zstd's
own benchmark, on one desktop CPU (Core
i7-9700K at 4.9 GHz, Linux 6.8, in memory, on the Silesia test corpus),
shows the usual trade:

| Compressor | Ratio | Compress | Decompress |
|---|---|---|---|
| lz4 1.10.0 | 2.10 | 675 MB/s | 3,850 MB/s |
| snappy 1.2.1 | 2.09 | 520 MB/s | 1,500 MB/s |
| zstd 1.5.7, level 1 | 2.90 | 510 MB/s | 1,550 MB/s |
| zlib 1.3.1, level 1 | 2.74 | 105 MB/s | 390 MB/s |

Those are whole-file numbers. Small blocks will compress less.

Engines use this in layers. LevelDB's default is a very fast
compressor. RocksDB defaults to Snappy, though LZ4 is almost always the
better choice there; Snappy stays the default to avoid compatibility
problems for existing users. Heavier compression goes where it pays most:
RocksDB can use a different algorithm for the bottommost level of its
[[lsm-tree]], which holds most of the data, and recommends zstd there.
That way you don't pay heavy-compression CPU on the upper levels.

## Where the bytes go

**The cache holds uncompressed blocks.** LevelDB's block cache keeps
blocks after decompression, so size it for your real data size, not the
compressed size. Caching the compressed bytes is left to the
operating system's [[page-cache]].

**Incompressible data is stored as is.** LevelDB turns compression off
automatically for data that doesn't compress, so random or
already-compressed values don't cost a decompression on every read.

**Not everything is compressed.** RocksDB compresses data and index
blocks but never filter blocks.

**Key order decides the ratio.** Compression finds repeats that sit near
each other. In Bigtable's web table, pages are stored under reversed
host names, so pages from one site sit side by side and share
boilerplate. With a two-pass scheme, Bigtable got a 10-to-1 reduction on
those pages, against the 3-to-1 or 4-to-1 typical of Gzip on HTML.
Choosing keys so similar data clusters is a compression decision.
[[column-storage]] takes the same idea further by storing each column's
values together.

## Where it gets tricky

**Small blocks and dictionaries.** Because each block starts with an
empty history, engines can train a dictionary on sample data and store
it in the file. zstd supports trained dictionaries for this, and
RocksDB can build one per file for the bottommost level.

**A missing library silently means no compression.** If RocksDB was
built without the library for the algorithm you chose, it falls back to
none. Your disk usage grows and nothing fails. The header of RocksDB's
log file lists which compression types are available, so look there.

**It changes write amplification too.** In an LSM tree every byte is
rewritten several times by [[compaction]], so compressed blocks mean
fewer bytes rewritten. RocksDB suggests heavy compression on every level if
you have spare CPU and want lower [[amplification|write amplification]]
as well as less space.

## What this means when you build

- Compress per block and store each block's compressed size in the
  index; decompress only the block you need.
- Start with a fast compressor (LZ4 or Snappy) everywhere and a heavier
  one (zstd) for cold, large data.
- Size the block cache for uncompressed data.
- Skip compression for blocks that don't shrink.
- Check at startup that the compression library you configured is
  really there.

## Further reading

- [Bigtable: A Distributed Storage System for Structured Data](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf), Fay Chang and others, 2006. Section 6: why compress per block, and how key locality gave a 10-to-1 ratio.
- [leveldb documentation](https://github.com/google/leveldb/blob/main/doc/index.md), LevelDB authors. Block size, per-block compression, and a cache that holds uncompressed blocks.
- [Compression (RocksDB wiki)](https://github.com/facebook/rocksdb/wiki/Compression), RocksDB team. What gets compressed, per-level and bottommost choices, and dictionary compression.
- [Zstandard README](https://github.com/facebook/zstd/blob/dev/README.md), zstd maintainers. A current benchmark of fast compressors, and why small data needs a dictionary.

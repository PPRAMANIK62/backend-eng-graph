---
id: leveldb-index
title: leveldb documentation (doc/index.md)
author: LevelDB authors (Google)
url: https://github.com/google/leveldb/blob/main/doc/index.md
kind: docs
primary: true
---

## Summary

LevelDB's main user documentation. The parts used here are the
Performance section: block size, per-block compression, the block cache
of uncompressed blocks, key layout for locality, and Bloom filter
policies.

## Key claims

- The block is the unit of I/O; the default is about 4 KB uncompressed. "The default block size is approximately 4096 uncompressed bytes." (Block size)
- Bigger blocks for scans, smaller for point reads. "Applications that mostly do bulk scans over the contents of the database may wish to increase this size." (Block size)
- Bigger blocks compress better. "Also note that compression will be more effective with larger block sizes." (Block size)
- Each block is compressed on its own. "Each block is individually compressed before being written to persistent storage." (Compression)
- Compression is on by default and skipped for data that won't compress. "Compression is on by default since the default compression method is very fast, and is automatically disabled for uncompressible data." (Compression)
- The block cache holds uncompressed blocks; the OS page cache holds compressed ones. "Note that the cache holds uncompressed data, and therefore it should be sized according to application level data sizes, without any reduction from compression." (Cache)
- Keys that sort together share blocks, so key design matters. "Therefore the application can improve its performance by placing keys that are accessed together near each other and placing infrequently used keys in a separate region of the key space." (Key Layout)
- A Get can take several disk reads; filters cut that. "Because of the way leveldb data is organized on disk, a single `Get()` call may involve multiple reads from disk." (Filters)
- 10 bits per key cuts unneeded reads by about 100x. "This filter will reduce the number of unnecessary disk reads needed for Get() calls by a factor of approximately a 100." (Filters)
- A custom comparator needs a matching filter policy. "If you are using a custom comparator, you should ensure that the filter policy you are using is compatible with your comparator." (Filters)
- Block size bounds. "There isn't much benefit in using blocks smaller than one kilobyte, or larger than a few megabytes." (Block size)
- Compressed blocks are cached by the OS. "(Caching of compressed blocks is left to the operating system buffer cache, or any custom Env implementation provided by the client.)" (Cache)

## Visuals worth redrawing

None.

## My notes

- LevelDB's options.h adds that Snappy is the default and was measured
  at roughly 200-500 MB/s compression on a Core 2; not opened as its own
  note, and those numbers are old.

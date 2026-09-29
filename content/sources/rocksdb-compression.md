---
id: rocksdb-compression
title: Compression (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/Compression
kind: docs
primary: true
---

## Summary

What RocksDB compresses in an SST file, how to choose algorithms per
column family and for the bottommost level, and what happens when a
compression library is missing.

## Key claims

- Data and index blocks are compressed separately; filters aren't. "In each SST file, data blocks and index blocks can be compressed individually." (What is compressed?)
- Filter blocks stay uncompressed. "Filter blocks are not compressed." (What is compressed?)
- Snappy is the default; LZ4 is usually better. "By default it is Snappy. We believe LZ4 is almost always better than Snappy." (Configuration)
- The light algorithms balance space and CPU. "LZ4/Snappy is a lightweight compression algorithm so it usually strikes a good balance between space and CPU usage." (Configuration)
- A heavier algorithm for the bottommost level, where most data is. "Usually the bottommost level contains majority of the data, so users get an almost optimal space setting, without paying CPU for compressing all the data at any level." (Configuration)
- ZSTD recommended there. "We recommend ZSTD." (Configuration)
- Heavy compression everywhere cuts write amplification too, if CPU allows. "If you have a lot of free CPU and want to reduce not just space but write amplification too, try to set `options.compression` to heavy weight compression type." (Configuration)
- A missing library silently means no compression. "If you pick a compression type but the library for it is not available, RocksDB will fall back to no compression." (Compression Library)
- Dictionary compression for the bottommost level. "Users can choose to compress each SST file of their bottommost level with a dictionary stored in the file." (Dictionary Compression)
- Snappy stays the default for compatibility. "We leave Snappy as default to avoid unexpected compatibility problems to previous users." (Configuration)
- The log header lists which compression types are available. "RocksDB will print out availability of compression types in the header of log files like this:" (Compression Library)

## Visuals worth redrawing

None.

## My notes

- The companion page (Dictionary Compression) explains why: 4 KB
  blocks are too small for the compressor to learn much. Opened; the
  same point is in the block-based table format page's "compression
  dictionary" section, which has a note.

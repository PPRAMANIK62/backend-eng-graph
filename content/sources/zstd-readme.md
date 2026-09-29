---
id: zstd-readme
title: Zstandard README (facebook/zstd)
author: zstd maintainers (facebook/zstd on GitHub)
url: https://github.com/facebook/zstd/blob/dev/README.md
kind: docs
primary: true
---

## Summary

The README of zstd's reference implementation. Its benchmark table
compares zstd 1.5.7 with brotli, zlib, lz4, snappy and others on the
Silesia corpus, and it explains why small data compresses badly and how
trained dictionaries help.

## Key claims

- What zstd is for. "__Zstandard__, or `zstd` as short version, is a fast lossless compression algorithm, targeting real-time compression scenarios at zlib-level and better compression ratios." (opening)
- The format is an RFC. "Zstandard's format is stable and documented in [RFC8878](https://datatracker.ietf.org/doc/html/rfc8878)." (opening)
- Benchmark setup: Core i7-9700K at 4.9 GHz, Ubuntu 24.04 (Linux 6.8), lzbench, gcc 14.2.0, Silesia corpus, in memory. "on a desktop featuring a Core i7-9700K CPU @ 4.9GHz" (Benchmarks)
- Results (ratio, compression speed, decompression speed): zstd 1.5.7 -1: 2.896, 510 MB/s, 1550 MB/s; zlib 1.3.1 -1: 2.743, 105 MB/s, 390 MB/s; lz4 1.10.0: 2.101, 675 MB/s, 3850 MB/s; snappy 1.2.1: 2.089, 520 MB/s, 1500 MB/s. "| **zstd 1.5.7 -1**       | 2.896 |   510 MB/s |  1550 MB/s |" (Benchmarks table)
- Higher levels trade compression speed for ratio; decompression stays about the same. "Decompression speed is preserved and remains roughly the same at all settings, a property shared by most LZ compression algorithms, such as [zlib] or lzma." (Benchmarks)
- Small inputs compress badly. "The smaller the amount of data to compress, the more difficult it is to compress." (The case for Small Data compression)
- Why: no history to learn from. "compression algorithms learn from past data how to compress future data. But at the beginning of a new data set, there is no \"past\" to build upon." (The case for Small Data compression)
- A trained dictionary fixes much of that. "Using this dictionary, the compression ratio achievable on small data improves dramatically." (The case for Small Data compression)

## Visuals worth redrawing

- Compression speed vs ratio chart (older run). Could redraw the table
  as a small bar chart of ratio vs decompression speed.

## My notes

- The numbers are one machine and one corpus, in memory. Database
  blocks are small, so real ratios in an SST are usually lower than
  whole-file ratios; the README says small data is harder but doesn't
  give block-sized numbers.

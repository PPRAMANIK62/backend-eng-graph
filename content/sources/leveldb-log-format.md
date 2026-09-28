---
id: leveldb-log-format
title: leveldb Log format
author: LevelDB authors (Google)
url: https://github.com/google/leveldb/blob/main/doc/log_format.md
kind: docs
primary: true
---

## Summary

The in-repo spec for LevelDB's write-ahead log file. The file is a series
of 32 KB blocks; each record has a CRC32C, a length, a type and the data.
Records that don't fit in a block are split into FIRST, MIDDLE and LAST
fragments. Short and exact, the model for a simple checksummed log. The
file has no date; the only commit touching `doc/log_format.md` on
GitHub is from 2017 (checked via the GitHub API).
The format may be older under another file name; not checked.

## Key claims

- The file is a sequence of 32KB blocks, and the tail may be a partial block. "The log file contents are a sequence of 32KB blocks. The only exception is that the tail of the file may contain a partial block." (opening)
- Record layout: checksum uint32 (CRC32C of type and data, little-endian), length uint16 (little-endian), type uint8, then data. "checksum: uint32 // crc32c of type and data[] ; little-endian" (record grammar)
- A record never starts in the last six bytes of a block; those bytes are a zero trailer that readers skip. "A record never starts within the last six bytes of a block (since it won't fit)." (after the grammar)
- Record types: FULL = 1, FIRST = 2, MIDDLE = 3, LAST = 4. (types list)
- Large records are split into fragments at block boundaries. "FIRST, MIDDLE, LAST are types used for user records that have been split into multiple fragments (typically because of block boundaries)." (types)
- Worked example: records of 1000, 97270 and 8000 bytes; the second spans three blocks. (Example)
- Resync is simple: on corruption, skip to the next block. "If there is a corruption, skip to the next block." (Some benefits, 1)
- Log contents embedded inside another log don't confuse the reader. "we do not get confused when part of the contents of one log file are embedded as a record inside another log file." (Some benefits, 1)
- Downsides: no packing of tiny records, no compression. (Some downsides)

## Visuals worth redrawing

- A 32 KB block holding a FULL record, a FIRST fragment and a trailer, then the next block with MIDDLE and LAST. Draw from the grammar and the A/B/C example.

## My notes

- The header is 4 + 2 + 1 = 7 bytes; that's why a record can't start in the last six bytes.
- The CRC covers type and data, not the length.

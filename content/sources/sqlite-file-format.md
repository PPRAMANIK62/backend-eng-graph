---
id: sqlite-file-format
title: Database File Format (section 4, The Write-Ahead Log)
author: SQLite developers
url: https://www.sqlite.org/fileformat2.html
published: 2026
accessed: 2026-09-28
kind: spec
primary: true
---

## Summary

SQLite's official file format spec. Section 4 defines the WAL file: a
32-byte header, then frames of a 24-byte header plus one database page.
A frame counts only if its salts match the header and a cumulative
checksum over everything before it matches. Transactions commit with a
commit frame. No page date; it's the living spec.

## Key claims

- The WAL is a header plus frames; each frame holds one page. "A WAL file consists of a header followed by zero or more \"frames\"." (4.1)
- Commit is a frame with a commit marker. "Transactions commit when a frame is written that contains a commit marker." (4.1)
- The WAL always grows from start to end and is reused after checkpoints; checksums and counters separate valid frames from leftovers. "Checksums and counters attached to each frame are used to determine which frames within the WAL are valid and which are leftovers from prior checkpoints." (4.1)
- Header: 32 bytes, eight big-endian 32-bit integers: magic, version (3007000), page size, checkpoint sequence, salt-1, salt-2, checksum-1, checksum-2. (4.1, WAL Header Format)
- Frame header: 24 bytes, six big-endian 32-bit integers: page number, db size after commit (zero if not a commit), salt-1, salt-2, checksum-1, checksum-2. (4.1, WAL Frame Header Format)
- Validity rule: salts match, and the cumulative checksum matches. "A frame is considered valid if and only if the following conditions are true" (4.1)
- The checksum is cumulative: computed over the WAL header's first 24 bytes and every frame up to this one. "the checksum computed consecutively on the first 24 bytes of the WAL header and the first 8 bytes and the content of all frames up to and including the current frame." (4.1)
- The checksum is a Fibonacci-weighted sum over 32-bit words, not a CRC. "The outputs s0 and s1 are both weighted checksums using Fibonacci weights in reverse order." (4.2)
- On reset, salt-1 is incremented and salt-2 randomized, which invalidates old frames. "These changes to the salts invalidate old frames in the WAL that have already been checkpointed but not yet overwritten" (4.4)
- Readers use only frames that are commits or followed by a commit. "the last valid instance of page P that is followed by a commit frame or is a commit frame itself becomes the value read." (4.5)
- Checkpoint syncs the WAL, copies pages into the database, then syncs the database; syncs act as write barriers. "The xSync operations serve as write barriers" (4.3)

## Visuals worth redrawing

- WAL header and frame header as byte-offset tables side by side with the LevelDB record header.

## My notes

- Compared with LevelDB: big-endian, per-frame pages instead of arbitrary records, cumulative checksum instead of per-record CRC, salts to tell old frames from new after the file is reused.

---
id: postgres-wal-internals
title: "WAL Internals, PostgreSQL documentation section 28.6"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/wal-internals.html
kind: docs
primary: true
---

## Summary

How PostgreSQL 18 (read as 18.6) lays out its WAL: LSNs as byte offsets,
16 MB segment files of 8 kB pages, and where recovery starts (pg_control,
then the checkpoint record, then redo forward).

## Key claims

- The LSN is a byte offset into the WAL that only grows. "The insert position is described by a Log Sequence Number (LSN) that is a byte offset into the WAL, increasing monotonically with each new record." (28.6, second paragraph)
- LSNs can be subtracted to measure WAL volume, so they track replication and recovery progress. "Values can be compared to calculate the volume of WAL data that separates them" (28.6, second paragraph)
- WAL lives in pg_wal as segment files, normally 16 MB each. "as a set of segment files, normally each 16 MB in size" (28.6, third paragraph)
- Each segment is divided into pages, normally 8 kB. "Each segment is divided into pages, normally 8 kB each" (28.6, third paragraph)
- Segment files get ever-increasing names starting at 000000010000000000000001. (28.6, third paragraph)
- Putting the WAL on a different disk from the data files helps. "It is advantageous if the WAL is located on a different disk from the main database files." (28.6, fourth paragraph)
- A drive that lies about writes can defeat the WAL. "this can be subverted by disk drives that falsely report a successful write to the kernel" (28.6, fifth paragraph)
- Recovery reads pg_control, then the checkpoint record, then redoes forward from the location in that record. "the server first reads pg_control and then the checkpoint record; then it performs the REDO operation by scanning forward from the WAL location indicated in the checkpoint record." (28.6, sixth paragraph)
- Full page images on the first change after a checkpoint make every page changed since then consistent after redo. "all pages changed since the checkpoint will be restored to a consistent state." (28.6, sixth paragraph)
- pg_control is under one disk page, so it isn't exposed to partial writes. "pg_control is small enough (less than one disk page) that it is not subject to partial-write problems" (28.6, last paragraph)

## Visuals worth redrawing

None.

## My notes

- The record header layout is only pointed to (access/xlogrecord.h).

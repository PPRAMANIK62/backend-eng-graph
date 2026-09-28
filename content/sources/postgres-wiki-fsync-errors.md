---
id: postgres-wiki-fsync-errors
title: Fsync Errors (PostgreSQL wiki)
author: PostgreSQL developers (maintained by Thomas Munro)
url: https://wiki.postgresql.org/wiki/Fsync_Errors
published: 2023-07-05            # last edit
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Postgres developers' own record of "fsyncgate 2018": what PostgreSQL
assumed about fsync, how each OS actually behaves after a write-back
error, and what Postgres changed (it now PANICs on fsync failure).

## Key claims

- Postgres assumed a successful fsync meant all the file's data was on disk. "PostgreSQL believes that a successful call to fsync() means that *all* data for a file is on disk, as part of its checkpointing protocol." (Research notes and OS differences)
- On some OSes that isn't true, so data can be lost without any error. "Apparently that is not the case on some operating systems, leading to the potential for unreported data loss." (Research notes and OS differences)
- The fix: Postgres now PANICs on fsync failure, from a PostgreSQL 12 commit, backpatched to 11, 10, 9.6, 9.5, 9.4. "PostgreSQL will now PANIC on fsync() failure." (Current status)
- Linux 4.13 improved error handling (errseq_t based write-back error reporting). "Linux kernel 4.13 improved fsync() error handling" (Current status)
- Other databases changed too. "Similar changes were made in InnoDB/MySQL, WiredTiger/MongoDB and no doubt other software" (Current status)
- Linux before 4.13: errors can be lost, and failed buffers are marked clean, so a retry can falsely succeed. "buffers are marked clean after errors, so retrying fsync() can falsely report success" (Open source kernels, Linux < 4.13)
- Linux 4.13 and 4.15: only errors after open() are reported, which broke Postgres's pattern of reopening files and handing fsync to the checkpointer. "fsync() only reports writeback errors that occurred after you called open()" (Open source kernels)
- Linux 4.14 and 4.16+: someone gets the first error even across close/open, but only once, and pages are still thrown away. "you still only get the error once (so retrying fsync() is not OK)" (Open source kernels)
- After an error you might read back older data than you wrote. "so you might read back an older version of the page than you most recently wrote" (Open source kernels, Linux >= 4.16)
- FreeBSD keeps failed buffers dirty so later fsyncs retry. "FreeBSD: buffers remain dirty" (Open source kernels)
- NetBSD, OpenBSD (before a later change), macOS invalidate the buffers, so later fsyncs can succeed despite loss. "NetBSD: buffers are invalidated here so future fsync() calls may return success despite data loss" (Open source kernels)
- ZFS is likely different because it doesn't use the regular page cache. "ZFS is likely to be a special case even on Linux, because it doesn't use the regular page cache" (Special cases)

## Visuals worth redrawing

- A per-OS table: what happens to the dirty page and to a second fsync
  after an error. Our own table from this page.

## My notes

- Last edited 2023; the Linux kernel-version detail stops at 4.16. Check
  whether anything changed later before claiming "still".

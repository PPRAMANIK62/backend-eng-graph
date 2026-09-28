---
id: rebello-fsync-failures-2020
title: Can Applications Recover from fsync Failures?
author: Anthony Rebello, Yuvraj Patel, Ramnatthan Alagappan, Andrea C. Arpaci-Dusseau, Remzi H. Arpaci-Dusseau
url: https://www.usenix.org/conference/atc20/presentation/rebello
published: 2020-07-15
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

A USENIX ATC 2020 study that injects block write failures under ext4,
XFS and Btrfs (Linux 5.2.11) to see what state the filesystem is in
after fsync fails, then uses a FUSE filesystem (CuttleFS) to test how
Redis, LMDB, LevelDB, SQLite and PostgreSQL cope. None cope fully.
Read from the open-access PDF (https://www.usenix.org/system/files/atc20-rebello.pdf).

## Key claims

- All three filesystems mark the pages clean after fsync fails, so retrying doesn't help. "all three file systems mark pages clean after fsync fails, rendering techniques such as application-level retry ineffective." (§1 Introduction)
- What the clean page holds differs: ext4 and XFS keep the new data in memory, Btrfs goes back to the old state. "ext4 and XFS contain the latest copy in memory while Btrfs reverts to the previous consistent state." (§1)
- ext4 in data=journal mode sometimes reports the failure on the next call instead. "ext4 data mode does not report an fsync failure immediately in some cases, instead (oddly) failing the subsequent call." (§1)
- Failed journal writes during fsync make the filesystem unavailable. "Failed updates to some structures (e.g., journal blocks) during fsync reliably lead to file-system unavailability." (§1)
- No application handles it fully. "none are sufficient: fsync failures can cause catastrophic outcomes such as data loss and corruption." (Abstract)
- Redis didn't even check fsync's return code. "Some applications (Redis) are surprisingly careless with fsync, not even checking its return code" (§1)
- Apps can look correct while the data is still cached, then return stale data once it's evicted. "when said data is purged from the cache (due to cache pressure or OS restart), however, the application then returns stale data" (§1)
- Recovery should use only on-disk state, not the page cache. "applications should ensure recovery protocols only use existing persistent (on-disk) state to recover." (§1)
- Copy-on-write (Btrfs) looked more robust than journaling here. "the copy-on-write strategy seems to be more robust against corruptions, reverting to older states when needed." (§1)
- A Postgres checkpoint flushes the log's changes to the data files, fsyncs each file, and on success truncates the log. "After an fsync is called on each of the files, and PostgreSQL is notified that everything was persisted successfully, the log is truncated." (§2)
- No application handled fsync failure perfectly even after the Postgres problem was reported; PostgreSQL could lose old and new data on updates. "both new and old data can be lost on updates (PostgreSQL)" (§1)
- PostgreSQL's fix is to crash, restart, and replay the WAL instead of retrying fsync; MySQL and WiredTiger/MongoDB did similar. "PostgreSQL to respond to the fsync error by crashing and restarting without retrying the fsync." (§2)
- Test setup: Ubuntu, Linux 5.2.11, default mkfs and mount options, ext4 in data=ordered and data=journal. "We use an Ubuntu OS with Linux kernel version 5.2.11." (§3.2.2)

## Visuals worth redrawing

- The per-workload step diagrams in §3 (write, fsync fails, page marked
  clean but differs from disk). Redraw one as a timeline.

## My notes

- Even with PANIC, the paper found PostgreSQL could lose old and new data
  on updates in some cases ("both new and old data can be lost on updates
  (PostgreSQL)", §1). Worth mentioning carefully.

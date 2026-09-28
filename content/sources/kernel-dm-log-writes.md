---
id: kernel-dm-log-writes
title: dm-log-writes
author: Linux kernel documentation (device-mapper)
url: https://docs.kernel.org/admin-guide/device-mapper/log-writes.html
published: unknown
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

Kernel docs for the dm-log-writes device-mapper target. It passes all I/O
to one block device and logs every write to a second device, so the log
can later be replayed onto a device up to any point and checked. Built for
file system developers testing crash behavior.

## Key claims

- Two devices: one gets I/O normally, the other gets a log of all writes. "This target takes 2 devices, one to pass all IO to normally, and one to log all of the write operations to." (intro)
- Purpose. "This is intended for file system developers wishing to verify the integrity of metadata or data as the file system is written to." (intro)
- Write data is copied into the log so replay is exact. "The data that is in the WRITE requests is copied into the log to make the replay happen exactly as it happened originally." (intro)
- Writes are logged only once a flush shows they're out of the cache, to model what's on disk rather than in cache. "normal WRITE requests are not actually logged until the next REQ_PREFLUSH request." (Log Ordering)
- The goal is the worst case for power failure. "to simulate the worst case scenario with regard to power failures." (Log Ordering)
- Example: W1,W2,W3,C3,C2,Wflush,C1,Cflush is logged as W3,W2,flush,W1. (Log Ordering)
- FUA writes are logged when they complete; discards are treated like writes to keep order. (Log Ordering)
- Marks: `dmsetup message log 0 mark <name>` inserts a named point; every log ends with "dm-log-writes-end". (Messages)
- Userspace replay tool: https://github.com/josefbacik/log-writes (`replay-log`). (Userspace component)
- Worked fsync test: create the target over two devices, mkfs, mark, mount, run a workload that ends in fsync, mark, record md5sum, unmount, replay to the fsync mark on the first device, mount, compare md5sum. (Example usage)
- `replay-log ... --fsck "btrfsck /dev/sdb" --check fua` replays to each FUA and runs fsck at each step. (Example usage)

## Visuals worth redrawing

- The write/complete/flush timeline and the resulting log order (Log Ordering example).

## My notes

- Status checked via GitHub API on 2026-09-28: `drivers/md/dm-log-writes.c` is in mainline Linux; `josefbacik/log-writes` last commit 2024-07-09.
- It works under a real file system, so the file system's own metadata writes are in the log along with data.

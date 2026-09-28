---
id: lazyfs-github
title: "LazyFS: A FUSE Filesystem with an internal dedicated page cache"
author: INESC TEC HASLab (dsrhaslab)
url: https://github.com/dsrhaslab/lazyfs
published: 2026-05-07
accessed: 2026-09-28
kind: code
primary: true
---

## Summary

The LazyFS source repo and README. LazyFS is a FUSE file system that sits
on top of a real one (tested with ext4) and keeps written data in its own
cache until the program calls fsync. You then tell it, through a FIFO or
a config file, to throw away unsynced data, tear writes, or crash at a
chosen system call. `published` is the date of the latest release, 0.3.1.

## Key claims

- What it is. "A FUSE file system with an internal dedicated page cache that only flushes data if explicitly requested by the application." (README, opening)
- Purpose. "This is useful for simulating power failures and losing unsynced data." (README, opening)
- Tested with ext4 (default mount options) as the backend, on Debian 11 and Ubuntu 20.04; C++17, needs CMake, g++, and FUSE 3 packages. (README, Installation)
- `clear-cache` drops all unsynced data; can be triggered at a point such as after the sixth fsync of a file. "Clears unsynced data in a certain point of the execution." (README, faults list)
- `torn-op` splits one write into parts and persists only some. "dividing a write system call into smaller parts, with some of these parts being persisted while others are not." (README, faults list)
- `torn-seq` persists only some writes of a run of writes to one file with no fsync between them. (README, faults list)
- `crash` kills LazyFS before or after a chosen system call on paths matching a regex, including rename, link and symlink with source and target patterns. "Kill the filesystem, which is triggered by an operation, a timing and a path regex" (README, commands)
- Commands are sent by writing lines to a FIFO, e.g. `echo "lazyfs::clear-cache" > /tmp/faults.fifo`. (README, commands)
- After a LazyFS crash the mount may need `fusermount -uz`. (README, end)
- Status badge on the README: "research prototype". (README, badges)
- Maintenance, from the GitHub API on 2026-09-28: latest release 0.3.1 on 2026-05-07 (previous 0.3.0 on 2024-03-08); last commit 2026-08-24; not archived.

## Visuals worth redrawing

- The stack: program → LazyFS (FUSE, own page cache) → ext4 → disk, with a "clear-cache" arrow wiping the LazyFS cache.

## My notes

- LazyFS's cache is its own, not the kernel's. What survives a LazyFS "crash" is what the program fsynced through LazyFS, plus whatever LazyFS had passed to ext4.

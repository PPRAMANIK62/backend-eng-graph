---
id: kernel-vm-sysctl
title: Documentation for /proc/sys/vm/
author: Linux kernel developers
url: https://docs.kernel.org/admin-guide/sysctl/vm.html
published: unknown            # living doc, served as the kernel 7.3.0-rc5 docs
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel's reference for the `/proc/sys/vm` knobs. For the page cache
the useful entries are the dirty-page limits, the flusher timing, and
`drop_caches`. The site served it as part of the 7.3.0-rc5 docs, but the
file's own header still says it was written for kernel 2.6.29.

## Key claims

- `dirty_background_bytes` / `dirty_background_ratio`: the amount of dirty memory at which background flusher threads start writing. "Contains the amount of dirty memory at which the background kernel flusher threads will start writeback." (dirty_background_bytes)
- `dirty_bytes` / `dirty_ratio`: the amount at which the process doing the writing has to start writeback itself. "Contains the amount of dirty memory at which a process generating disk writes will itself start writeback." (dirty_bytes)
- Only one of each bytes/ratio pair is active; the other reads as 0. "Only one of them may be specified at a time." (dirty_background_bytes note)
- The ratio is of available memory (free plus reclaimable), not total RAM. "The total available memory is not equal to total system memory." (dirty_ratio)
- Dirty data older than `dirty_expire_centisecs` gets written at the next flusher wakeup. "Data which has been dirty in-memory for longer than this interval will be written out next time a flusher thread wakes up." (dirty_expire_centisecs)
- The flusher threads wake up every `dirty_writeback_centisecs`; 0 disables periodic writeback. "The kernel flusher threads will periodically wake up and write old data out to disk." (dirty_writeback_centisecs)
- `drop_caches` drops only clean pages, never dirty ones. "This is a non-destructive operation and will not free any dirty objects." (drop_caches)
- Running `sync` first gives it more clean pages to drop. "the user may run sync prior to writing to /proc/sys/vm/drop_caches" (drop_caches)
- It isn't a way to control cache size; the kernel reclaims cache when memory is needed. "These objects are automatically reclaimed by the kernel when memory is needed elsewhere on the system." (drop_caches)
- Not recommended outside testing. "use outside of a testing or debugging environment is not recommended." (drop_caches)
- (added in review) Writing 3 frees slab objects and page cache. "To free slab objects and pagecache: echo 3 > /proc/sys/vm/drop_caches" (drop_caches)
- (added in review) Dropping caches costs I/O and CPU to rebuild. "it may cost a significant amount of I/O and CPU to recreate the dropped objects" (drop_caches)
- (added in review) The page still says it describes 2.6.29. "is valid for Linux kernel version 2.6.29." (header)

## Visuals worth redrawing

None.

## My notes

- No default values given for the dirty ratios. Experiment 0002 reads this
  machine's actual values instead.
- The "valid for 2.6.29" header is stale; re-check the entries against a
  current kernel source if something looks off.

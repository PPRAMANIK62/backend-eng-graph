---
id: kernel-sysfs-block
title: ABI stable sysfs-block (/sys/block/<disk>/ attributes)
author: Linux kernel developers (entries by Martin K. Petersen, Himanshu Madhani and others)
url: https://www.kernel.org/doc/Documentation/ABI/stable/sysfs-block
published: 2009
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel's stable ABI description of the files under `/sys/block/<disk>/`
and its `queue/` directory. Each entry has a date and a one-paragraph
meaning. It's how you read a block device's sector sizes, write cache mode
and atomic write limits on your own machine. Entries date from 2009 to
2024; the file itself has no single date.

## Key claims

- logical_block_size is the smallest unit the device can address, usually 512 bytes. "This is the smallest unit the storage device can address. It is typically 512 bytes." (queue/logical_block_size, May 2009)
- physical_block_size is the smallest unit the device can write atomically; it may be bigger than the logical size. "This is the smallest unit a physical storage device can write atomically." (queue/physical_block_size, May 2009)
- Example of the two differing: SATA drives with 4 KB sectors that show 512-byte logical blocks. "One example is SATA drives with 4KB sectors that expose a 512-byte logical block size to the operating system." (queue/physical_block_size)
- write_cache reads "write back" or "write through". "It will return \"write back\" for the former case, and \"write through\" for the latter." (queue/write_cache, April 2016)
- Writing to write_cache only changes the kernel's view, and can drop cache flushes. "Writing to this file can change the kernels view of the device, but it doesn't alter the device state." (queue/write_cache)
- atomic_write_unit_min_bytes is the smallest atomic write; atomic writes start on and are multiples of it. "This parameter specifies the smallest block which can be written atomically with an atomic write operation." (atomic_write_unit_min_bytes, February 2024)
- atomic_write_unit_max_bytes is the largest atomic write, a power of two. "This parameter defines the largest block which can be written atomically with an atomic write operation." (atomic_write_unit_max_bytes, February 2024)
- atomic_write_max_bytes is the device's reported maximum, used when merging atomic writes. "This parameter specifies the maximum atomic write size reported by the device." (atomic_write_max_bytes, February 2024)
- (added in review) Toggling write_cache to "write through" also stops the kernel's cache flushes. "since that will also eliminate cache flushes issued by the kernel." (queue/write_cache)

## Visuals worth redrawing

None.

## My notes

- The atomic_write entries are listed as `/sys/block/<disk>/atomic_write_*`
  but experiment 0003 read them from `/sys/block/nvme0n1/queue/`. Trust the
  machine.
- The ABI doesn't say what a value of 0 means for the atomic_write files.
- docs.kernel.org/ABI/stable/sysfs-block.html and
  docs.kernel.org/block/queue-sysfs.html returned 404 on 2026-09-28.

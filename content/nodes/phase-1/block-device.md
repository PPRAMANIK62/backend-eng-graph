---
id: block-device
title: Block devices
depth: short
phase: 1
note: >-
  A disk as the kernel sees it: a numbered list of fixed-size blocks.
needs: []
leads_to: [filesystem, ssd-internals, torn-writes]
compare_with: []
---

# Block devices

A block device is a disk as the kernel sees it: a long row of fixed-size
blocks, numbered from zero, that you can read or write only as whole
blocks. Everything you store on a server ends up as writes to numbered
blocks, so the block size, the queues in front of the drive and the drive's
write cache decide how fast those writes go and what survives a power cut.

## A disk is a numbered list of sectors

Take the SSD in my laptop, a WD PC SN740, which Linux calls `nvme0n1`. To
the kernel it has no files and no folders. It has sectors, each with a
number, and two commands that matter here: read sector N, write sector N.

The smallest unit the device can address is its logical block size. It is
usually 512 bytes, and on my drive it is 512 bytes
([experiment 0003](../../experiments/0003-what-my-ssd-reports-to-the-kernel.md)).
If you want to change 100 bytes in the middle of a sector, something above
the drive has to read the whole sector, change the 100 bytes, and write the
whole sector back. The drive can't take less.

There is a second size, the physical block size: the smallest unit the
device can write atomically, meaning all of it lands or none of it does.
Usually it equals the logical size, but it can be bigger. The classic case
is a SATA hard drive with 4 KB sectors that still presents 512-byte logical
blocks to the operating system. My SN740 reports 512 for both.

## The path from a write to the drive

A program doesn't talk to the block device directly. It writes to a file,
the [[filesystem]] decides which blocks that file lives in, and the block
layer carries the block writes to the driver.

The block layer in Linux is blk-mq, the multi-queue block layer. The old
design had one request queue behind one lock, which was fine while a hard
disk's moving head was the slow part. With SSDs the kernel became the slow
part, so blk-mq gives each CPU its own queue.

A write goes through two levels of queues:

1. **Software staging queues**, one per CPU (or per NUMA node). Here the
   kernel can merge requests for neighbouring sectors, so writes to
   sectors 3–6, 6–7 and 7–9 become one request for 3–9. An I/O scheduler
   can reorder requests here too.
2. **Hardware dispatch queues**, which the driver maps onto the device's
   own submission queues. There are never more of these than CPU cores.

A request can skip the first level and go straight to a hardware queue
when there is no scheduler and nothing to merge. My laptop runs the `none`
scheduler for the NVMe drive, which puts requests on the current CPU's
queue without reordering them.

Nothing in the block layer or the device protocols promises that requests
finish in the order they were sent.

![A write's path from a program down to the drive: the filesystem picks blocks, blk-mq puts the request on a per-CPU software staging queue where it can be merged or scheduled, then on one of fewer hardware dispatch queues, then the NVMe submission queues, and finally the drive's volatile write cache, which a flush empties to flash.](img/block-device-write-path.svg)

*The path a write takes from `write()` to flash, through blk-mq's two levels of queues. Adapted from Linux kernel developers, "Multi-Queue Block IO Queueing Mechanism (blk-mq)" (Linux kernel docs).*

## "Done" doesn't mean on the flash

The last stop is the drive, and many drives have a write cache. The kernel
shows it in `/sys/block/<disk>/queue/write_cache` as either "write back"
(the cache holds writes) or "write through". Mine says "write back", and
the drive also supports FUA writes, which bypass that cache
([experiment 0003](../../experiments/0003-what-my-ssd-reports-to-the-kernel.md)).

With a write-back cache, a write that has completed can still be sitting
in the drive's volatile memory. It isn't safe from a power cut until the
kernel sends a flush or writes with FUA. Asking for that is the job of
[[fsync]], and what a drive keeps in that cache is part of
[[ssd-internals]].

## Where it gets tricky

**Writing to `write_cache` doesn't change the drive.** Echoing "write
through" into that file only changes what the kernel believes. The drive
keeps caching, and the kernel stops sending the cache flushes that made
the cache safe. So toggling it to look safer can make things less safe.

**Stacked devices have their own view.** My root filesystem doesn't sit on
`nvme0n1` directly. It sits on `dm-0`, a LUKS encryption layer that is
itself a block device on top of the SSD. The two can report different
things: the SSD accepts TRIM, but `dm-0` reports that it doesn't, so TRIM
from the filesystem never reaches the drive
([experiment 0003](../../experiments/0003-what-my-ssd-reports-to-the-kernel.md)).
Always check the device your filesystem is actually on.

**How big a write lands whole is a separate question.** Newer entries
(dated 2024) in the same sysfs docs report atomic write limits (`atomic_write_unit_min_bytes`,
`atomic_write_unit_max_bytes`). My drive reports 0 for these, and the
kernel docs don't say what 0 means. What happens to a write bigger than a
sector when the power goes is the topic of [[torn-writes]].

## What this means when you build

- Look up your real sector sizes in `/sys/block/<disk>/queue/` before you
  pick a record or page size for anything you store.
- Don't assume two writes you sent in order finish in order. If order
  matters, wait for the first to be durable before sending the second.
- A completed write is not a durable write when the cache is "write back".
- Check the whole stack (LUKS, LVM, RAID) for what it passes down.

## Further reading

- [ABI stable sysfs-block](https://www.kernel.org/doc/Documentation/ABI/stable/sysfs-block), Linux kernel developers, 2009–2024. The meaning of every file under `/sys/block/`, including sector sizes, write cache and atomic write limits.
- [Multi-Queue Block IO Queueing Mechanism (blk-mq)](https://docs.kernel.org/block/blk-mq.html), Linux kernel docs. Why the block layer has per-CPU queues and how requests move through them.

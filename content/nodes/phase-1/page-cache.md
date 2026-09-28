---
id: page-cache
title: The page cache
depth: deep
phase: 1
note: >-
  The kernel keeps file data in RAM. Reads and writes hit it first, not
  the disk.
needs: [virtual-memory, filesystem]
leads_to: [mmap, direct-io, fsync]
compare_with: []
---

# The page cache

When your program reads or writes a file on Linux, it almost never talks
to the disk directly. It talks to the page cache: a copy of file data
that the kernel keeps in otherwise unused RAM. Knowing how that cache
fills, when it writes back to disk and when it throws pages away
explains why a second read is fast, why a write can "succeed" and still
be lost, and why a server with plenty of RAM can still stall on I/O.

## Following one read through the cache

Say your service opens `users.db` and reads 4 KiB at offset 0. The
[[system-call]] lands in the kernel, which finds the file through the
[[filesystem]] and then asks one question: is that part of the file
already in the page cache?

If it is, the kernel copies the bytes into your buffer and returns. No
disk operation happens at all. If it isn't, the kernel has to find a free
page of RAM for it (freeing some memory first if there's none), start a
read from the disk, wait for it, store the page in the cache, and only
then copy it to you.

The cost difference is large. On the laptop this project runs on, a
random 4 KiB read that skipped the cache and went to the NVMe SSD took
49.8 µs at the median, while a load from RAM in the same set of runs
took 104 to 125 ns
([experiment 0001](../../experiments/0001-latency-numbers-on-my-laptop.md)).
A cache hit is paid in RAM time and a system call. A miss is paid in
disk time.

Three details matter once you look closer:

- **The unit is a page**, usually 4 KiB. The cache doesn't track bytes;
  every file read and write is handled as whole pages. That's where the
  name comes from. The kernel works in pages almost everywhere, as you
  saw with [[virtual-memory]].
- **The cache is shared.** Once a page of `users.db` is cached, any
  process that reads that part of the file gets it from RAM, not just
  the one that caused the read.
- **Every normal way of reading goes through it:** `read`, `pread`,
  `sendfile`, and memory-mapping a file with [[mmap]]. The exception is
  [[direct-io]], which exists to skip it.

![The read path and the write path through the page cache. A read checks the cache: a hit copies from RAM with no disk I/O; a miss finds a free page, reads from disk, stores the page in the cache and then copies it. A write updates the cached page, marks it dirty and returns; the page reaches disk later through the flusher threads, or now with fsync.](img/page-cache-read-write.svg)

*Reads and writes both go through the page cache first. Adapted from Viacheslav Biriukov, "Essential Page Cache theory" (biriukov.dev, 2025).*

## Reading ahead of you

If you read a file from start to end, waiting for a disk read on every
page would be slow. So the kernel guesses. When a read misses the cache,
it reads the page you asked for plus more pages after it that you
haven't asked for yet. That's readahead.

Each readahead request has two parts: the pages you're waiting for (the
synchronous part) and extra pages that are read in the background (the
asynchronous part). The kernel marks the first page of the background
part with a flag. When you reach that page, it's the signal to start the
next readahead. Once the kernel sees you're reading sequentially, it
stays ahead of you and you stop waiting on the disk. When the extra
pages keep getting used, the kernel reads further ahead next time. It
takes a bet, and raises it when the bet pays off. This logic lives in
`mm/readahead.c`, and its documentation was only written for Linux 5.18
(2022).

You can give the kernel hints about your access pattern with
`posix_fadvise`. On Linux, `POSIX_FADV_SEQUENTIAL` doubles the readahead
window for the file, `POSIX_FADV_RANDOM` turns readahead off (useful when
you jump around a big file and the extra pages would be waste), and
`POSIX_FADV_WILLNEED` starts reading a range into the cache without
blocking you. These are hints. The kernel is allowed to ignore them.

## Writes land in RAM and become dirty pages

Now the service writes 100 bytes into `users.db`. The kernel doesn't
send them to the disk. It updates the page in the page cache and marks
it **dirty**, meaning the RAM copy is newer than the disk copy. Then the
write call returns.

That's why writes usually feel fast: they're a memory copy. Any process
that reads the file afterwards sees the new bytes, because reads come
from the same cache. But the disk still has the old data, and your
program has no idea when that will change.

Two details follow from working in pages:

- A write smaller than a page, into a page that isn't cached, makes the
  kernel read the whole page from disk first, so it can merge your bytes
  into it. A tiny write can cost a read.
- Writes are only fast when there's free memory to hold them. Under
  memory pressure, a write may have to wait for the kernel to free pages.

If the data has to survive a crash, you call [[fsync]] (or `fdatasync`),
which blocks until the file's dirty pages are on stable storage. Opening
the file with `O_SYNC` or `O_DSYNC` does the same for every write. How
far those guarantees go is a story of its own.

## When dirty pages reach the disk

If you never call fsync, dirty pages are written back by kernel flusher
threads. Four settings in `/proc/sys/vm` decide when:

- **Background limit** (`dirty_background_bytes` or
  `dirty_background_ratio`): once this much memory is dirty, the flusher
  threads start writing in the background.
- **Hard limit** (`dirty_bytes` or `dirty_ratio`): once this much is
  dirty, a process that's writing has to do writeback itself. From its
  point of view, `write` suddenly gets slow.
- **Age** (`dirty_expire_centisecs`): data dirty for longer than this is
  written out at the next flusher wakeup.
- **Wakeup interval** (`dirty_writeback_centisecs`): how often the
  flusher threads wake up to look.

Each limit comes as a pair, bytes or ratio, and only one of each pair is
active. Setting one makes the other read as 0. The ratio is a percentage
of *available* memory (free plus reclaimable), not of total RAM.

On the laptop this project runs on, someone set byte limits
([experiment 0002](../../experiments/0002-writeback-settings-on-my-laptop.md)):

| Setting | Value on this machine |
|---|---|
| `dirty_background_bytes` | 64 MiB |
| `dirty_bytes` | 256 MiB |
| `dirty_expire_centisecs` | 3000 (30 s) |
| `dirty_writeback_centisecs` | 1500 (15 s) |

So a program here can have 64 MiB of written data that exists only in
RAM before background writeback starts. A small write that stays under
that limit can sit dirty for about 30 seconds, plus up to 15 more until
the flusher wakes. If the power goes during that window, the write is
gone, even though `write` returned success long ago.

![A timeline of one small write on this machine: dirty in RAM until it expires at 30 s, then waiting up to 15 s for the flusher, so on disk by about 45 s; a power cut anywhere before that loses it. Below, a bar of total dirty memory with background writeback starting at 64 MiB and writers forced to do writeback at 256 MiB.](img/page-cache-dirty-timeline.svg)

*When dirty data reaches the disk on this machine, with the settings read off it in [experiment 0002](../../experiments/0002-writeback-settings-on-my-laptop.md).*

## Which pages get thrown out

The page cache uses memory nobody else is using, and gives it back when
someone needs it. Page cache pages are one of the two main kinds of
memory the kernel can reclaim (the other is anonymous memory, like your
heap, which has to go to swap).

Reclaim happens in two ways. When free memory falls below a "low"
watermark, a kernel thread called kswapd wakes up and frees pages in
the background. If memory keeps falling to a lower "min" watermark, an
allocation can't wait for kswapd anymore: the process asking for memory
stalls and reclaims pages itself. That's how a plain memory allocation
in your service can end up waiting on cache eviction.

Clean pages are cheap to reclaim, because the disk already has the same
data; the kernel just drops them. Dirty pages have to be written first.

To choose which pages go, the kernel keeps two lists of file pages per
cgroup, an inactive list and an active list, both roughly
least-recently-used. A page read for the first time goes on the inactive
list. If it's accessed again while still there, it's promoted to the
active list. New pages enter at the head of a list and drift toward the
tail, and eviction takes them from the inactive list. The idea is that a
file you read once, like a backup scan, only passes through the inactive
list and doesn't push out pages your service touches all the time. The real algorithm adds more, like
"shadow entries" that remember recently evicted pages so the kernel can
notice when a working set just slightly bigger than memory keeps
evicting and re-reading the same pages.

![The inactive and active lists, each with a head and a tail. Page P enters at the head of the inactive list on its first read, is promoted to the head of the active list when accessed again, moves back to the inactive list if it goes unused, and is evicted from the inactive tail.](img/page-cache-lru-lists.svg)

*One page's trip through the two lists. Adapted from Viacheslav Biriukov, "Page Cache eviction and page reclaim" (biriukov.dev, 2025).*

## Where it gets tricky

**`drop_caches` doesn't do what people think.** Writing `3` to
`/proc/sys/vm/drop_caches` drops clean cache pages and some kernel
caches. It never frees dirty pages (run `sync` first if you want more
dropped), and it isn't a way to limit the cache: the kernel reclaims
cache on its own when memory is needed. Using it outside of testing
costs I/O and CPU to rebuild what was dropped. It's for benchmarks that
need a cold cache, not for "freeing memory" on a server.

**Write success isn't durability.** A `write` that returned without an
error only means the page cache has your data. It says nothing about
whether the later writeback to disk will work. What happens when it
doesn't is covered in [[fsync-errors]].

**Writes can be slow for reasons that aren't the disk.** Crossing the
hard dirty limit makes the writer do writeback. Low free memory makes it
wait for reclaim. A partial-page write to an uncached page makes it wait
for a read. All three show up as a slow `write` call.

**The docs are old in places.** The kernel's own reference page for these
`/proc/sys/vm` settings still says it describes kernel 2.6.29, and it
doesn't list default values. Read the values off your machine instead of
trusting a blog's table, like experiment 0002 did.

**Hints are hints.** `posix_fadvise` advice is non-binding.
`POSIX_FADV_DONTNEED` won't drop dirty pages, and partial pages are
ignored. If you want pages gone, fsync first and use page-aligned
ranges.

**The eviction picture here is simplified.** The two-list model leaves
out reference flags, per-NUMA-node lists and shadow entry math. It's
enough to reason about "why did my cache get evicted", not to predict
exactly which page goes next.

## What this means when you build

- Expect the second read of a file to be much faster than the first, and
  benchmark with that in mind. A benchmark on a warm cache measures RAM,
  not your disk. Use `drop_caches` in tests only.
- A `write` returning success means "in RAM". If you promised a client
  their data is saved, you need [[fsync]].
- Know your machine's dirty limits. They set how much unsynced data a
  crash can take, and when writers start to stall.
- Tell the kernel your access pattern with `posix_fadvise` when it's
  clearly sequential or clearly random.
- Leave memory for the cache. A process that grabs all the RAM for its
  heap makes every file read a disk read, and pushes others into direct
  reclaim.
- Databases that manage their own cache sometimes bypass all of this
  with [[direct-io]], or map files straight into memory with [[mmap]].
  Both are trade-offs against what this cache does for you.

## Further reading

- [Documentation for /proc/sys/vm/](https://docs.kernel.org/admin-guide/sysctl/vm.html), Linux kernel developers. The reference for the dirty-page limits, flusher timing and `drop_caches`.
- [Concepts overview](https://docs.kernel.org/admin-guide/mm/concepts.html), Linux kernel developers. The official short description of the page cache and of reclaim with kswapd and watermarks.
- [Essential Page Cache theory](https://biriukov.dev/docs/page-cache/2-essential-page-cache-theory/), Viacheslav Biriukov, 2025. The clearest step-by-step read and write path; the rest of the series has hands-on tools.
- [Page Cache eviction and page reclaim](https://biriukov.dev/docs/page-cache/4-page-cache-eviction-and-page-reclaim/), Viacheslav Biriukov, 2025. Active and inactive lists with worked examples, and evicting a file by hand.
- [Readahead: the documentation I wanted to read](https://lwn.net/Articles/888715/), Neil Brown, 2022. How readahead's sync and async parts and the `PG_readahead` marker work, from the developer who documented it.
- [posix_fadvise(2)](https://man7.org/linux/man-pages/man2/posix_fadvise.2.html), man-pages, 2026. The access-pattern hints and what each does to readahead on Linux.

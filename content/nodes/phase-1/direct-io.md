---
id: direct-io
title: Direct I/O
depth: short
phase: 1
note: >-
  Skipping the page cache to control I/O yourself, like some databases
  do.
needs: [page-cache]
leads_to: []
compare_with: [mmap]
---

# Direct I/O

Direct I/O means opening a file with the `O_DIRECT` flag so reads and
writes move data between the drive and your own buffer, skipping the
[[page-cache]]. Programs that keep their own cache, databases above all,
use it to stop the kernel caching the same data a second time and to
decide for themselves what stays in memory. In exchange you give up
everything the page cache did for you, and you take on strict rules.

## What changes when you open with O_DIRECT

Take a 4 KiB read at some offset in a big file.

With normal buffered I/O, the kernel checks the page cache, reads from
the drive on a miss, keeps the page, and copies it into your buffer.

With `O_DIRECT`, the kernel tries to transfer the data straight between
the drive and your buffer, with the page cache out of the picture. No
cached copy is kept, so reading the same block twice goes to the drive
twice. Caching and deciding what to keep are now your job.

So in general it makes performance worse. It's meant for applications
that do their own caching. For them, the page cache would only hold a
second copy of data they already cache.

You can see the raw cost it exposes. On this project's laptop, random
4 KiB `O_DIRECT` reads from a 2 GiB file took 49.8 µs at the median and
249 µs at p99.9, going through btrfs and disk encryption to an NVMe SSD
([experiment 0001](../../experiments/0001-latency-numbers-on-my-laptop.md)).
With `O_DIRECT` the test measured the drive path instead of RAM, which
is why it used the flag.

## The alignment rules

`O_DIRECT` can require that the buffer's memory address, the transfer
length and the file offset all be multiples of some block size. The
exact rule depends on the filesystem and the kernel version, and may not
exist at all:

- In Linux 2.4, most filesystems wanted multiples of the filesystem
  block size, typically 4096 bytes.
- Linux 2.6.0 relaxed that to the device's logical block size, typically
  512 bytes (`blockdev --getss` shows it). The SSD in experiment 0001
  reports 512-byte logical sectors.
- Since Linux 6.1, you can ask with `statx(2)` and the
  `STATX_DIOALIGN` flag, which reports whether a file supports direct
  I/O and what alignment it needs, if the filesystem supports the query.

A misaligned request either fails with `EINVAL` or quietly falls back to
buffered I/O. The quiet fallback is the dangerous one: your code works,
but it isn't doing what you think.

## It doesn't make writes durable

"Direct" sounds like "straight to disk", but the drive has its own
volatile cache, and `O_DIRECT` alone doesn't promise your data or
metadata is on stable storage when `write` returns. For that you still
need [[fsync]], or `O_SYNC` together with `O_DIRECT`.

## Where it gets tricky

**Linus Torvalds has never liked it.** In a 2002 kernel mailing list
reply, he called the interface stupid and said it performed badly
because of its design: every read and write is synchronous, and it has
to walk page tables for each transfer. He called it an "Oracleism", a
feature added for database vendors. His alternative was to keep the
page cache and split the work into an asynchronous "start the I/O" step
and a separate mapping or sync step. The person he was answering made
the other side's case: databases keep their own cache, so they want the
kernel's out of the way. The same kernel-versus-database tension shows
up in the argument over [[mmap]].

**Don't mix it.** Using `O_DIRECT` and normal buffered I/O on the same
file, especially the same byte ranges, is slow even when it's correct,
and mixing it with mmap on the same file is also advised against.

**Watch out with fork.** If the buffer is private memory (the heap,
static buffers or any `MAP_PRIVATE` mapping), `O_DIRECT` I/O running while the process calls
`fork` can corrupt data in parent and child. Finish all direct I/O
before forking, or use shared memory for the buffers.

## What this means when you build

- Don't reach for `O_DIRECT` unless you're building your own cache. For
  most services the page cache does better.
- If you do, align buffers, lengths and offsets, and check the rules with
  `statx` and `STATX_DIOALIGN` where it's available.
- Still call fsync, or add `O_SYNC`, when writes must be durable.
- Use it in benchmarks when you want to measure the drive, not RAM.

## Further reading

- [open(2)](https://man7.org/linux/man-pages/man2/open.2.html), man-pages, 2026. The O_DIRECT description, its alignment rules by kernel version, and its warnings about mixing and fork.
- [Re: O_DIRECT performance impact on 2.4.18](https://static.lwn.net/2002/0516/a/lt-deranged-monkey.php3), Linus Torvalds, 2002. The famous objection to O_DIRECT's design, and the page cache based alternative he wanted.

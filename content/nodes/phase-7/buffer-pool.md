---
id: buffer-pool
title: The buffer pool
depth: deep
phase: 7
note: >-
  The database's own cache of pages, its eviction policy, and why it
  doesn't just trust the OS.
needs: [page-cache, direct-io, database-pages]
leads_to: [checkpoints, crash-recovery]
compare_with: [mmap, eviction-policies, latches]
---


# The buffer pool

The buffer pool is the database's own cache of [[database-pages|pages]]:
a big block of memory, cut into page-sized frames, that holds copies of
table and index pages while queries work on them. Every read and every
change goes through it. How it decides what to keep, when it writes
changed pages back, and whether it trusts the operating system's
[[page-cache]] as well shape how a database behaves once its data is
bigger than its memory.

## One page request, start to finish

A query needs page 1,207 of the `users` table. It doesn't read the file.
It asks the buffer pool for the page and expects a pointer to it in
memory. The rest of the database acts as if the whole database were in
memory; the buffer pool makes that true one page at a time.

Inside, the buffer pool is an array of frames, each the size of one
page, plus a hash table called the page table that maps page ids to
frames. The request goes like this:

1. **Look up page 1,207 in the page table.**
2. **Hit:** the page is already in a frame. Pin it (add one to its pin
   count) and hand back a pointer. No I/O at all.
3. **Miss:** pick a frame to reuse (the victim). If the victim page is
   dirty, meaning it was changed in memory, write it out first. Read
   page 1,207 from disk into the frame, update the page table, pin it,
   hand back the pointer.
4. **When the query is done with it,** it unpins the page.

![The buffer pool as a row of numbered frames holding pages, some marked dirty and some pinned. A page table to the left maps page ids to frames. A request for page 1207 checks the page table: on a hit it returns a pointer to the frame; on a miss it chooses an unpinned victim frame, writes the victim to the data file first if it is dirty, then reads page 1207 from the data file into that frame.](img/buffer-pool-request.svg)

*A page request, hit and miss. The page table is in memory only; where a page lives on disk is a separate mapping.*

## Pins and dirty flags

Each frame carries two pieces of state that matter.

**The pin count** says how many [[thread|threads]] are using the page right now.
A pinned page can't be evicted, because someone holds a pointer into it.
Pins can be held a while: a Postgres sequential scan keeps the current
page pinned until it has gone through every row on it. Changing the
bytes on a page needs more than a pin: a separate short-lived lock (a
[[latches|latch]]) on the page's contents, so no one sees a half-changed row. If
every frame is pinned and the pool is full, there's nothing to evict and
the request fails.

**The dirty flag** says the page in memory differs from the one on disk.
The buffer pool is a write-back cache: a change marks the page dirty and
returns, and the page is written later. That's what makes it fast, and
it's also where the [[write-ahead-log]] comes in. A dirty page
can't just be written whenever it's convenient: the log records
describing its changes have to be on disk first. You can see this rule
at work in Postgres: before it reuses a dirty buffer whose page has a
new log position, it has to write and flush the log up to that point.

## Choosing a victim

When there's no free frame, the pool must evict something. The textbook
answer is least recently used (LRU): evict the page untouched for the
longest time. Exact LRU means keeping every page in order by last
access, updated on every single access, from many threads. That costs
too much.

**CLOCK** is the usual approximation. Picture the frames in a circle,
each with a reference bit that's set when the page is used. A clock hand
sweeps around. At each frame, if the bit is set, clear it and move on.
If it's clear, that page is the victim. A page that's used keeps getting
its bit set again before the hand comes back, so it survives.

Postgres uses a version of this called clock sweep. Instead of one bit,
each buffer has a usage count that goes up each time the buffer is
pinned, up to a small limit. The hand decrements it on each pass and
takes the first unpinned buffer whose count is zero. A page used often
gets several passes of the hand before it can go.

![Eight buffers arranged in a circle, each labelled with its usage count and whether it is pinned. The clock hand starts at buffer 3 (count 2) and decrements it to 1, skips pinned buffer 4, decrements buffer 5 from 1 to 0, and stops at buffer 6, whose count is already 0, choosing it as the victim.](img/buffer-pool-clock-sweep.svg)

*Postgres's clock sweep. Adapted from the PostgreSQL buffer manager README and Andy Pavlo's CMU 15-445 buffer pool notes.*

## The scan problem

LRU and CLOCK share one weakness: a big sequential scan. A query that
reads a whole table touches every page once. Each page looks "recently
used", so the scan pushes out pages other queries use all the time, and
then never needs its own pages again. Everyone else's reads start
missing. This is called sequential flooding, and it's the second
example in the 1993 LRU-K paper.

The same paper shows a quieter problem. Customers looked up at random
through a clustered B-tree alternate between index leaf pages and row
pages. Each leaf page is used far more often than each row page, so
the leaves are the ones worth keeping. LRU only knows what was touched
last, so it ends up with roughly half of each. Its answer, LRU-K, tracks
the last K accesses per page and evicts by how often a page is used, not
just how recently.

Real systems fix the scan problem more cheaply:

- **InnoDB splits its LRU list in two.** A page read from disk goes in
  at a midpoint, the head of an "old" sublist that is 3/8 of the pool by
  default. Only when it's accessed again, and at least 1,000 ms after
  its first access (the `innodb_old_blocks_time` default), is it moved to
  the "young" part. A scan touches a page a few times in quick
  succession and then never again, so its pages stay in the old part
  and age out from there.
- **Postgres gives big scans a small ring.** A large sequential scan
  gets a ring of 256 KB of buffers and reuses them over and over,
  instead of claiming the whole pool. [[vacuum|`VACUUM`]] gets a ring
  too, and bulk writes like `COPY` get 16 MB, at most an eighth of the
  pool.

## Writing dirty pages ahead of time

If a query has to evict a dirty page, it must wait for that write before
it can read its own page. To keep that off the query's path, a
background writer walks ahead of the clock hand and writes out dirty
pages that are likely to be evicted soon, so that by the time the hand
arrives they're clean and can be dropped at once. In Postgres it looks
for buffers that are dirty, unpinned and have a usage count of zero.
Flushing dirty pages in bulk at intervals is a separate job, covered in
[[checkpoints]].

## Why not just trust the OS?

The kernel already has a page cache that does all this for files. So
why build another?

The databases that do it give the same reasons. The database knows
things the kernel doesn't: which dirty pages must wait for the log
before being written, which pages a query plan is about to read, which
pages belong to a one-off scan, which I/O is on a user's critical path.
And the kernel can do things the database can't allow, such as writing
a dirty page to disk at any moment.

Using [[mmap]] instead of a buffer pool makes those problems sharp. The
kernel can flush a changed page before the [[transaction]] that changed it
commits. Any memory access can stall on a [[page-faults|page fault]],
and the database can't know in advance which ones will. I/O errors
arrive as [[signals]] from whatever line of code touched the page. And
eviction doesn't scale: in one set of tests on Linux 5.11 with fast NVMe
drives, random reads through mmap ran at about half of what direct reads
managed once the page cache was full.

Once a database has its own buffer pool, the page cache mostly holds a
second copy of the same pages. So many databases skip it with
[[direct-io]]. InnoDB on Linux opens its data files with `O_DIRECT` by
default (MySQL 8.4) and gives the buffer pool most of the memory: up to
80% on a dedicated server is common. It still calls [[fsync]], because
`O_DIRECT` skips the kernel's cache, not the drive's.

Postgres is the well-known exception. It reads and writes through the
page cache, keeps its own buffer pool (`shared_buffers`) smaller, and
relies on the kernel's cache as a second level. The default is 128 MB,
the manual suggests starting at 25% of RAM on a dedicated server, and
says more than 40% is unlikely to help.

## Where it gets tricky

**Double caching is real.** With Postgres, a page can sit in
`shared_buffers` and in the page cache at the same time. That's a known
cost of its design, and part of why its advice on `shared_buffers` looks
so different from InnoDB's.

**Not everyone agrees the OS is the enemy.** The mmap argument has a
pointed reply from LMDB's author: with a read-only map every mapped page
is clean, so the kernel can drop it without writing, and on a machine
running more than the database, only the kernel sees the memory
pressure of everything. The 2022 mmap paper's tests were read-only, on
raw drives, with fio as the baseline, which critics note is not a
database. Even LMDB answers the write-safety problem by keeping its map
read-only by default.

**Contention moves around.** A buffer pool is shared by every thread,
so its own locks matter. Before Postgres 8.1, one lock guarded the whole
buffer manager and became a bottleneck. Postgres 8.2 split the page
table lock into partitions, and eviction takes only a short spin lock.

**Hit rate isn't the whole story.** An eviction policy that looks great
on hit rate can still hurt if its bookkeeping is expensive on every
access, which is why CLOCK exists at all. General cache eviction,
outside databases, is [[eviction-policies]].

**The I/O path is changing.** Postgres 18 added an asynchronous I/O
subsystem that lets a backend queue several reads at once, which helps
sequential scans, bitmap heap scans and vacuum. It's chosen with the
`io_method` setting: `worker` by default, [[io-uring|`io_uring`]] or `sync` as
options.

## What this means when you build

- Size the buffer pool on purpose. Postgres's 128 MB default is for tiny
  machines; start at 25% of RAM and measure. InnoDB wants most of the
  memory on a dedicated box.
- Watch the hit rate and, more usefully, the read latency of misses.
  A working set that just outgrew memory shows up as a sudden jump in
  disk reads.
- Big scans (reports, backups, `SELECT *` with no `WHERE`) are the
  classic way to wreck a cache for everyone else. Know how your database
  protects against them, and run them away from the primary if you can.
- If you build your own: fixed-size frames, a page table, pin counts,
  dirty flags, clock sweep, a background writer, and a hard rule that
  the log is flushed before a dirty page is written.

## Further reading

- [Lecture #06: Buffer Pools](https://15445.courses.cs.cmu.edu/fall2024/notes/06-bufferpool.pdf), Andy Pavlo, CMU 15-445, 2024. The whole mechanism: frames, page table, pins, dirty flags, LRU, CLOCK, LRU-K, and why databases don't hand this to the OS.
- [src/backend/storage/buffer/README](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/storage/buffer/README), PostgreSQL 18 source. A production buffer manager: pins vs content locks, clock sweep with usage counts, ring buffers, the background writer.
- [The LRU-K Page Replacement Algorithm For Database Disk Buffering](https://www.cs.cmu.edu/~natassa/courses/15-721/papers/p297-o_neil.pdf), Elizabeth O'Neil, Patrick O'Neil and Gerhard Weikum, 1993. Why LRU picks the wrong pages, with two clear examples.
- [Buffer Pool](https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html), MySQL 8.4 Reference Manual. InnoDB's midpoint-insertion LRU and the young and old sublists.
- [Making the Buffer Pool Scan Resistant](https://dev.mysql.com/doc/refman/8.4/en/innodb-performance-midpoint_insertion.html), MySQL 8.4 Reference Manual. The two settings that keep scans from flushing the pool.
- [InnoDB Startup Options and System Variables](https://dev.mysql.com/doc/refman/8.4/en/innodb-parameters.html), MySQL 8.4 Reference Manual. `innodb_flush_method` and the `O_DIRECT` default.
- [19.4. Resource Consumption](https://www.postgresql.org/docs/current/runtime-config-resource.html), PostgreSQL documentation, version 18. `shared_buffers` sizing and the new `io_method`.
- [PostgreSQL 18 release notes](https://www.postgresql.org/docs/release/18.0/), PostgreSQL Global Development Group, 2025. The new asynchronous I/O subsystem.
- [Are You Sure You Want to Use MMAP in Your Database Management System?](https://www.cidrdb.org/cidr2022/papers/p13-crotty.pdf), Andrew Crotty, Viktor Leis and Andrew Pavlo, 2022. The four problems with mmap in place of a buffer pool, measured.
- [Are You Sure You Want to Use MMAP in Your DBMS?](https://www.symas.com/post/are-you-sure-you-want-to-use-mmap-in-your-dbms), Howard Chu. The LMDB author's reply.

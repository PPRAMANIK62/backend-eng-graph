---
id: full-page-writes
title: Full-page writes
depth: short
phase: 7
note: >-
  How databases survive a page only half written at power loss: Postgres
  full-page writes, the InnoDB double-write buffer.
needs: [torn-writes, write-ahead-log, checkpoints]
leads_to: [crash-recovery]
compare_with: []
---

# Full-page writes

A [[database-pages|database page]] is bigger than what a drive promises to write in one
piece, so a power cut can leave a page half old and half new. The
[[write-ahead-log]] can't fix that on its own, because its records
describe small changes that assume the page around them is sound.
Postgres answers with full-page writes: it logs a whole copy of the page
the first time it changes after each checkpoint. InnoDB answers with a
doublewrite buffer: it writes every page somewhere safe first.

## Why a normal log record isn't enough

Postgres writes data in 8 kB pages, which is 16 sectors of 512 bytes. A
power cut can stop that write partway: some sectors new, the rest old.
That's a [[torn-writes|torn write]].

Now think about recovery. The WAL holds a record like "on page 12, row
3, set the balance to 400". Redo applies that change to whatever page 12
is on disk. If page 12 is torn, its header or other rows may be a mix
of two versions, and applying one row change to that mess doesn't give
you a correct page. The row-level records simply don't hold enough to
rebuild the whole page.

## Postgres: log the whole page once per checkpoint

With `full_page_writes = on` (the default), the first time a page is
changed after a [[checkpoints|checkpoint]], Postgres puts the entire page
into the WAL instead of just the change. Later changes to the same page,
until the next checkpoint, are logged normally.

Once per checkpoint is enough because replay always starts at a
checkpoint. So the first record recovery meets for any page changed
since then is that full image. Recovery writes the image over whatever
is on disk, torn or not, and applies the later records on top.

![Top row, Postgres: after a checkpoint, the first change to page 12 puts a full copy of the page into the WAL, and later changes add small records. A power cut tears page 12 on disk. On replay, the full image overwrites the torn page and the small records are applied on top. Bottom row, InnoDB: a page flushed from the buffer pool is first written to the doublewrite file and synced, then written to its place in the data file. If that second write is torn, recovery copies the good page from the doublewrite file.](img/full-page-writes-two-ways.svg)

*Two ways to get a known-good copy of a page before overwriting it in place.*

The cost is WAL volume: each page's first change after a checkpoint
writes a whole page instead of a small record. Two knobs help: a longer
checkpoint interval means fewer "first changes", and
`wal_compression` (off by default; `pglz`, `lz4` or `zstd`) compresses
the page images at some CPU cost.

## InnoDB: write every page twice

InnoDB (MySQL 8.4) protects the data file instead of the log. When it
flushes pages from its [[buffer-pool]], it first writes them to
doublewrite files, then writes them to their real place in the data
files. If a crash tears a page in the data file, recovery finds a good
copy in the doublewrite files.

Writing twice sounds like twice the cost, but it isn't twice the I/O
operations: pages go into the doublewrite file as one big sequential
chunk with one [[fsync]]. `innodb_doublewrite` is on by default in most
cases. A `DETECT_ONLY` setting writes only metadata, which lets InnoDB
notice torn pages but not repair them.

## Where it gets tricky

**Turning it off is a bet on your storage.** With `full_page_writes`
off, Postgres runs faster but a crash can leave unrecoverable or silent
corruption. That's fine only if something below guarantees whole-page
writes. A [[filesystem]] that prevents partial page writes, such as ZFS,
qualifies. A battery-backed disk controller doesn't, unless it
guarantees it writes full 8 kB pages.

**Hardware that writes whole pages makes the trick unnecessary.** InnoDB
already turns the doublewrite buffer off by itself on Fusion-io devices
that support atomic writes. [[torn-writes]] covers the drive and kernel
side of promising untorn writes.

**Checksums change what gets logged.** A change that only touches hint
bits normally doesn't trigger a full-page image. With data
[[checksums]] on, Postgres logs hint bit updates anyway. The
`wal_log_hints` setting does the same without checksums, which is a way to measure how much
extra WAL checksums would cost you.

## What this means when you build

- If your pages are bigger than a sector and you overwrite them in
  place, you need one of these two tricks, or storage that promises
  untorn writes at your page size.
- If you use full-page images, expect more WAL right after each
  checkpoint, and weigh that when you pick the checkpoint interval.
- An append-only design, like the phase 1 [[append-only-log]], sidesteps
  this: it never overwrites a page, it only needs to spot a torn tail.

## Further reading

- [Write Ahead Log settings](https://www.postgresql.org/docs/current/runtime-config-wal.html), PostgreSQL Global Development Group, PostgreSQL 18. `full_page_writes`, `wal_log_hints` and `wal_compression`: what each does and what turning it off risks.
- [Reliability](https://www.postgresql.org/docs/current/wal-reliability.html), PostgreSQL Global Development Group, PostgreSQL 18. Why an 8 kB page write can tear, and when storage makes full-page writes unnecessary.
- [Doublewrite Buffer](https://dev.mysql.com/doc/refman/8.4/en/innodb-doublewrite-buffer.html), Oracle, MySQL 8.4. InnoDB's alternative: write each page to a doublewrite file first.

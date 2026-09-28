---
id: chu-mmap-response
title: Are You Sure You Want to Use MMAP in Your DBMS?
author: Howard Chu (Symas, LMDB author)
url: https://www.symas.com/post/are-you-sure-you-want-to-use-mmap-in-your-dbms
published: 2024-02-09
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

LMDB's author answers the CIDR 2022 mmap paper point by point. His case:
LMDB uses a read-only map by default, so most of the paper's problems
don't apply; the paper benchmarks fio, not a database; and the OS knows
more about memory pressure on a shared machine than any one process.

## Key claims

- LMDB maps the file read-only by default, so the paper's partial-update and msync concerns don't apply. "by default LMDB doesn't use a writable mmap." (section 3 comments)
- A read-only map also stops stray pointer writes from corrupting pages. "that's why LMDB uses a read-only mmap by default." (on 3.3 Error handling)
- I/O stalls happen in any design: if data isn't in memory, the caller waits. "the calling application can't make any progress until the I/O completes" (on 3.2 I/O stalls)
- With a read-only map all pages are clean, so the OS can drop them without writing. "That means all map pages are always clean" (on 3.4 Performance issues)
- The benchmark compares fio, not database implementations. "They don't actually compare DBMS implementations" (on section 4)
- LMDB is small. "coming in at under 64KB of object code" (on section 1)
- On a shared machine only the OS sees overall memory and I/O pressure, so a database's own buffer pool can be paged out anyway. "When you're sharing a machine with multiple other tasks, only the OS can ever truly know what's going on in the I/O susbsystem, in memory pressure, etc." (closing)
- Using only the page cache makes multi-process sharing cheap. "mmap solely uses the filesystem page cache means you can easily support multi-process concurrency" (closing)
- He endorses the RavenDB reply to the paper. (intro)

## Visuals worth redrawing

None.

## My notes

- An interested party (he wrote LMDB and sells support). Strong on
  design, no measurements in the post.
- Doesn't directly answer the TLB shootdown point.

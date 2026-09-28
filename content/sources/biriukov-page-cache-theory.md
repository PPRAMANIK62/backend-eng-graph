---
id: biriukov-page-cache-theory
title: Essential Page Cache theory (Linux Page Cache for SRE, chapter 2)
author: Viacheslav Biriukov
url: https://biriukov.dev/docs/page-cache/2-essential-page-cache-theory/
kind: blog
primary: false
---

## Summary

A step-by-step walk through the read path and write path of the Linux
page cache, from an SRE who wrote a whole series on it. Clear on dirty
pages and on why writes look fast.

## Key claims

- The page cache is a write-back cache inside the VFS, there to cut I/O latency. "A write-back cache algorithm is a core building block of the Page Cache." (intro)
- The unit is a page, usually 4 KiB, so I/O is aligned to pages. "Linux’s approach (and not only Linux’s, by the way) is to use pages (usually 4K in length) in almost all structures and operations." (intro)
- A write smaller than a page can force a read of the whole page first. "if your write is smaller than the page size, the kernel will read the entire page before your write can be finished." (intro)
- All reads and writes go through the page cache, except direct I/O. "all data reads and writes go through Page Cache. However, there are some exceptions for Direct IO (DIO)" (intro)
- Read hit: the kernel returns cached pages with zero disk operations. "As you can see kernel has made 0 disk operations in this case." (Read requests ②)
- Read miss: find room (reclaiming if needed), read from disk into the cache, return from the cache; later reads from any process hit the cache. "any future requests to read this part of the file (no matter from which process or cgroup) will be handled by Page Cache" (Read requests ③)
- Reads can come from read(), pread(), mmap(), sendfile() and others. "read(), pread(), vread(), mmap(), sendfile(), etc." (Read requests ①)
- Writes usually just update pages in the cache; the caller doesn't know when they reach disk. "The caller doesn’t know when the actual page flush occurs, but it does know that the subsequent reads will return the latest data." (Write requests I)
- Pages with unflushed data are called dirty. "Such pages, that contain un-flushed data have a special name: dirty pages." (Write requests I)
- Writes are only fast when there's no memory pressure. "this is correct only if the system or a cgroup doesn’t have memory pressure issues and there are enough free pages" (Write requests I)
- fsync, fdatasync, msync block until the file's dirty pages are on disk; O_SYNC and O_DSYNC make every write do that. "Linux provides fsync(), fdatasync() and msync() syscalls which block until all dirty pages of the file get committed to disks." (Write requests II)

## Visuals worth redrawing

- Figure 1, reads and writes through the page cache (numbered steps).
  Redraw as our own read-path / write-path diagram, credit "adapted from
  Biriukov".

## My notes

- Secondary source; the mechanism matches the kernel docs
  (kernel-mm-concepts).

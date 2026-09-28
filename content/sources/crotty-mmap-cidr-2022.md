---
id: crotty-mmap-cidr-2022
title: Are You Sure You Want to Use MMAP in Your Database Management System?
author: Andrew Crotty, Viktor Leis, Andrew Pavlo
url: https://www.cidrdb.org/cidr2022/papers/p13-crotty.pdf
kind: paper
primary: true
---

## Summary

A CIDR 2022 paper arguing that databases shouldn't use mmap in place of
their own buffer pool. It explains how mmap works, lists databases that
used it and moved away, names four problems (transactional safety, I/O
stalls, error handling, performance), and measures mmap against fio with
O_DIRECT on fast NVMe SSDs.

## Key claims

- mmap maps a file into the program's address space; the OS loads pages on access and evicts when memory fills. "The OS transparently loads pages only when the program references them and automatically evicts pages if memory fills up." (Abstract)
- Step by step: mmap reserves address space but loads nothing; the first access page-faults, the OS reads the page, adds a page table entry, and the CPU caches it in its TLB. "the OS triggers a page fault to load the referenced part of the file from secondary storage into a physical memory page." (§2.1, Figure 1)
- Databases have been drawn to mmap since the early 1980s. "Since the early 1980s, these supposed benefits have enticed DBMS developers to forgo implementing a buffer pool and instead rely on the OS to manage file I/O" (§1)
- The appeal: no read/write system calls, no copy into a user buffer, less memory used. "mmap can return pointers to pages stored in the OS page cache, thereby avoiding an extra copy into a buffer allocated in user space." (§3.4)
- Evicting a mapped page means invalidating other cores' TLBs with an inter-processor interrupt, a TLB shootdown. "the OS has to issue an expensive inter-processor interrupt to flush them, which is called a TLB shootdown" (§2.1)
- MongoDB's MMAPv1 was deprecated after WiredTiger became default in 2015 and removed in 2019. "MongoDB deprecated MMAPv1 and then completely removed it in 2019" (§2.3)
- Problem 1: the OS can write a dirty mapped page to disk at any time, even before the transaction commits. "the OS can flush a dirty page to secondary storage at any time, irrespective of whether the writing transaction has committed." (§3.1)
- LMDB uses shadow paging and allows a single writer. "LMDB solves this problem by allowing only a single writer." (§3.1)
- Problem 2: any access can block on a page fault, and mmap has no async reads. "accessing any page could result in an unexpected I/O stall because the DBMS cannot know whether the page is in memory." (§3.2)
- Problem 3: I/O errors show up as SIGBUS anywhere in the code, and bad pointer writes get persisted. "any code that interacts with mmap-backed memory can now produce a SIGBUS" (§3.3)
- Problem 4: eviction doesn't scale; three bottlenecks. "(1) page table contention, (2) single-threaded page eviction, and (3) TLB shootdowns." (§3.4)
- Setup: AMD EPYC 7713 (64 cores), 512 GB RAM with 100 GB for the page cache, Linux 5.11, Samsung PM1733 SSDs as raw block devices, fio 3.25 with O_DIRECT as baseline, read-only workloads. "100 GB was available to Linux (v5.11) for its page cache." (§4)
- Random reads, 100 threads, one SSD: fio held close to 900K reads/s; mmap matched it for about 27 s, dropped to near zero for about 5 s when the page cache filled, then ran at about half of fio. "finally recovered to approximately half of fio’s performance." (§4.1)
- Their advice: maybe use mmap only if the working set fits in memory and the workload is read-only. "Your working set (or the entire database) fits in memory and the workload is read-only." (§6)
- (added in review) Random reads covered a 2 TB range on NVMe drives. "we used a random access pattern over a 2 TB SSD range to simulate a larger-than-memory OLTP workload." (§4.1); fio's rate matched "NVMe latency of roughly 100 𝜇s" (§4.1)

## Visuals worth redrawing

- Figure 1, the seven steps of an mmap access. Redraw as the main mmap
  figure, credit "adapted from Crotty, Leis, Pavlo 2022".
- Figure 2a, random-read throughput over time (fio flat, mmap dropping
  when the cache fills).

## My notes

- Read-only workloads only, which the authors call mmap's best case.
- Chu's reply (chu-mmap-response) says their benchmark isn't a DBMS.

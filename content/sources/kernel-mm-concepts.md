---
id: kernel-mm-concepts
title: Concepts overview (memory management)
author: Linux kernel developers
url: https://docs.kernel.org/admin-guide/mm/concepts.html
published: unknown            # living doc, served as the kernel 7.3.0-rc5 docs
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel admin guide's overview of memory management ideas. Its "Page
cache" and "Reclaim" sections give the official short version of what the
page cache is and how the kernel takes memory back from it.

## Key claims

- File data read once is kept in RAM so later reads skip the disk. "Whenever a file is read, the data is put into the page cache to avoid expensive disk access on the subsequent reads." (Page cache)
- Writes go into the page cache too and reach the device later. "when one writes to a file, the data is placed in the page cache and eventually gets into the backing storage device." (Page cache)
- Written pages are marked dirty and synced to the device before the memory is reused. "The written pages are marked as dirty" (Page cache)
- Page cache is one of the two main kinds of reclaimable memory, with anonymous memory. "The most notable categories of the reclaimable pages are page cache and anonymous memory." (Reclaim)
- Below a low watermark of free memory, the kswapd daemon wakes and frees pages in the background. "an allocation request will awaken the kswapd daemon." (Reclaim)
- Below a lower "min" watermark, allocations stall and reclaim directly. "In this case allocation is stalled until enough memory pages are reclaimed to satisfy the request." (Reclaim)
- Anonymous memory (heap, stack) isn't backed by a file; dirty anonymous pages get swapped out instead. "the dirty page will be swapped out." (Anonymous Memory)
- Virtual memory hides physical memory's details, keeps only what's needed in RAM, and gives protection and controlled sharing. "allows to keep only needed information in the physical memory (demand paging)" (Virtual Memory Primer)
- Every memory access uses a virtual address that the CPU translates. "With virtual memory, each and every memory access uses a virtual address." (Virtual Memory Primer)
- Physical memory is split into page frames; the page size depends on the architecture. "The size of each page is architecture specific." (Virtual Memory Primer)
- One physical page can be mapped as several virtual pages. "Each physical memory page can be mapped as one or more virtual pages." (Virtual Memory Primer)
- Page tables are hierarchical; the top-level pointer lives in a register and high address bits index each level. "The pointer to the top level page table resides in a register." (Virtual Memory Primer)
- Translation costs several memory accesses, so CPUs cache translations in the TLB, which is small. "Usually TLB is pretty scarce resource" (Huge Pages)
- Programs with large working sets suffer TLB misses. "applications with large memory working set will experience performance hit because of TLB misses." (Huge Pages)
- On x86, 2M and 1G pages are mapped from the second and third level tables. "it is possible to map 2M and even 1G pages using entries in the second and the third level page tables." (Huge Pages)
- Huge pages cut TLB pressure. "Usage of huge pages significantly reduces pressure on TLB, improves TLB hit-rate and thus improves overall system performance." (Huge Pages)
- Two mechanisms: hugetlbfs (reserved, configured by admins) and THP (automatic). "THP manages such mappings transparently to the user and hence the name." (Huge Pages)
- Anonymous memory is created for stack and heap or by mmap; reads map a shared zero page, writes get a real page. "The read accesses will result in creation of a page table entry that references a special physical page filled with zeroes." (Anonymous Memory)
- A write to such a page allocates a regular physical page. "When the program performs a write, a regular physical page will be allocated to hold the written data." (Anonymous Memory)

## Visuals worth redrawing

None.

## My notes

- Clean page cache pages can simply be dropped; dirty ones must be written
  first. The Reclaim section implies this ("either just free them ... or
  evict to the backing storage device").

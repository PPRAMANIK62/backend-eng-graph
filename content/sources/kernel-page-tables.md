---
id: kernel-page-tables
title: Page Tables
author: Linux kernel developers
url: https://docs.kernel.org/mm/page_tables.html
published: unknown
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel's own explanation of page tables: what they map, why they're a
hierarchy (five levels today: PGD, P4D, PUD, PMD, PTE), how huge pages
fit at the PMD and PUD levels, and how the MMU, TLB and page-fault path
work (sections "Page Tables", "Page Table Folding", "MMU, TLB, and Page
Faults"). Living doc.

## Key claims

- Page tables map virtual addresses to physical ones. "Page tables map virtual addresses as seen by the CPU into physical addresses as seen on the external memory bus." (Page Tables)
- Linux uses a five-level hierarchy, mapped by each architecture onto its hardware. "Linux defines page tables as a hierarchy which is currently five levels in height." (Page Tables)
- The five levels, top to bottom, are PGD, P4D, PUD, PMD and PTE (Page Global Directory, Page Level 4 Directory, Page Upper Directory, Page Middle Directory, Page Table Entry). An architecture that doesn't use all levels folds them away. "If the architecture does not use all the page table levels, they can be _folded_ which means skipped" (Page Tables)
- With 4 KB pages, the low 12 bits are the offset, so PAGE_SHIFT is 12. "this is why PAGE_SHIFT in this case is defined as 12" (Page Tables)
- Hierarchical tables avoid wasting memory on the large unused holes of an address space. "By using hierarchical page tables large holes in the virtual address space does not waste valuable page table memory" (Page Tables)
- A higher-level entry can map a large contiguous range directly. "allows mapping a contiguous range of several megabytes or even gigabytes in a single high-level page table entry" (Page Tables)
- Each user process has its own top-level table (pgd) in its mm_struct. "each userspace process in the system also has its own memory context and thus its own pgd" (Page Tables)
- The MMU uses TLBs and page walk caches; on a miss it walks the tables. "If no translation is found, MMU uses the page walks to determine the physical address and create the map." (MMU, TLB, and Page Faults)
- Page faults happen when access isn't permitted or the data isn't in physical memory. "because the CPU is trying to access memory that the current task is not permitted to, or because the data is not present into physical memory." (MMU, TLB, and Page Faults)
- Lazy allocation and copy-on-write are expected causes of faults; swapped-out pages are another. "These are triggered by process management optimization techniques called “Lazy Allocation” and “Copy-on-Write”." (MMU, TLB, and Page Faults)
- Swapping is undesirable, done only under memory pressure. "it’s undesirable since it’s performed as a means to reduce memory under heavy pressure." (MMU, TLB, and Page Faults)
- If the kernel can't make room, the OOM killer terminates processes. "the kernel invokes the out-of-memory (OOM) killer to make room by terminating lower priority processes" (MMU, TLB, and Page Faults)
- Bad accesses in user space get SIGSEGV. "the kernel sends a Segmentation Fault (SIGSEGV) signal to the current thread." (MMU, TLB, and Page Faults)
- All architectures end up in handle_mm_fault(), which allocates missing table levels. "all architectures end up to the invocation of handle_mm_fault()" (MMU, TLB, and Page Faults)
- Huge pages of 2 MB and 1 GB are mapped by PMD and PUD entries. "They are respectively mapped by the PMD and PUD page entries." (MMU, TLB, and Page Faults)
- Huge pages reduce TLB pressure and page table overhead but can waste memory. "However, these benefits come with trade-offs, like wasted memory and allocation challenges." (MMU, TLB, and Page Faults)
- The final step is a read, copy-on-write, or shared fault. "performs one of do_read_fault() , do_cow_fault() , do_shared_fault() ." (MMU, TLB, and Page Faults)

## Visuals worth redrawing

- The PGD → P4D → PUD → PMD → PTE ladder (ASCII diagram in "Page Tables").

## My notes

- Page is served under the kernel 7.3.0-rc5 docs build as of 2026-09-28.

---
id: ostep-paging
title: "Operating Systems: Three Easy Pieces, ch. 18: Paging: Introduction"
author: Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf
published: 2025
accessed: 2026-09-28
kind: book
primary: false
---

## Summary

Splits the address space into fixed-size pages and physical memory into
page frames, with a per-process page table mapping one to the other.
Shows what a page table entry holds, and why a plain linear page table is
both too big and too slow. Footer reads "© 2008–25"; read via pdftotext.

## Key claims

- A page table maps virtual page numbers to physical frame numbers. "The page table is just a data structure that is used to map virtual addresses (or really, virtual page numbers) to physical addresses (physical frame numbers)." (18.3)
- A 32-bit address with 4 KB pages splits into a 20-bit VPN and a 12-bit offset. "This virtual address splits into a 20-bit VPN and 12-bit offset" (18.2)
- A linear table for that is about a million entries, 4 MB per process at 4 bytes each; 100 processes need 400 MB. "we get an immense 4MB of memory needed for each page table!" (18.2)
- A valid bit lets unused parts of the address space take no physical memory. "the valid bit is crucial for supporting a sparse address space" (18.3)
- A PTE also has protection bits, a present bit, a dirty bit and a reference (accessed) bit. "A present bit indicates whether this page is in physical memory or on disk" (18.3)
- The x86 PTE (Figure 18.5) has P, R/W, U/S, caching bits, A, D and the PFN. "Figure 18.5 shows an example page table entry from the x86 architecture" (18.3)
- Every load needs an extra memory access to fetch the PTE first. "Extra memory references are costly, and in this case will likely slow down the process by a factor of two or more." (18.4)
- Without careful design, page tables are too slow and too big. "page tables will cause the system to run too slowly, as well as take up too much memory." (18.4)

## Visuals worth redrawing

- Figures 18.1 and 18.2: a 64-byte address space with four 16-byte pages placed in scattered frames of a 128-byte physical memory.
- Figure 18.5: the x86 PTE bit layout.

## My notes

- Real systems fix the size problem with multi-level tables (ch. 20) and the speed problem with the TLB (ch. 19).

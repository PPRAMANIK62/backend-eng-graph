---
id: ostep-tlbs
title: "Operating Systems: Three Easy Pieces, ch. 19: Paging: Faster Translations (TLBs)"
author: Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf
kind: book
primary: false
---

## Summary

The TLB is a small hardware cache of recent virtual-to-physical
translations. The chapter walks an array example to show spatial and
temporal locality, explains caching and locality in general (a tip box),
covers context switches and ASIDs, and ends with "TLB coverage" and
larger pages. Footer reads "© 2008–23"; read via pdftotext.

## Key claims

- The TLB is part of the MMU and caches popular translations. "is simply a hardware cache of popular virtual-to-physical address translations" (intro)
- TLBs are what make paging fast enough to use. "TLBs in a real sense make virtual memory possible" (intro)
- A miss means walking the page table, which costs extra memory accesses. "TLB misses lead to more memory accesses." (19.1)
- Walking an array of ten ints over three 16-byte pages gives a 70% hit rate on first pass, thanks to spatial locality. "the TLB improves performance due to spatial locality." (19.2)
- Two kinds of locality: temporal (reuse soon) and spatial (nearby next). "There are usually two types of locality: temporal locality and spatial locality." (Tip: Use Caching When Possible)
- Hardware caches keep copies in small fast on-chip memory. "take advantage of locality by keeping copies of memory in small, fast on-chip memory." (Tip: Use Caching When Possible)
- Fast caches must be small because of physics. "If you want a fast cache, it has to be small, as issues like the speed-of-light and other physical constraints become relevant." (Tip: Use Caching When Possible)
- Locality is a rule of thumb, not a law. "these properties depend on the exact nature of the program, and thus are not hard-and-fast laws but more like rules of thumb." (Tip: Use Caching When Possible)
- TLB entries belong to one process, so a context switch must flush them or tag them. "these translations are not meaningful for other processes." (19.5)
- Some hardware adds an address space identifier (ASID) so entries from different processes can share the TLB. "some hardware systems provide an address space identifier (ASID) field in the TLB." (19.5)
- Random access over more pages than the TLB covers is slow ("Culler's Law"). "RAM isn’t always RAM." (Tip: RAM Isn't Always RAM)
- Exceeding TLB coverage is fixed by larger pages, which databases use. "Support for large pages is often exploited by programs such as a database management system (a DBMS)" (19.8)

## Visuals worth redrawing

- Figure 19.1: TLB control flow (hit path vs miss path).
- The array-on-pages example in 19.2, with hits and misses marked.

## My notes

- The locality tip box is the cleanest short definition of temporal vs spatial locality I've found.

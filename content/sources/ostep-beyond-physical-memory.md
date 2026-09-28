---
id: ostep-beyond-physical-memory
title: "Operating Systems: Three Easy Pieces, ch. 21: Beyond Physical Memory: Mechanisms"
author: Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys.pdf
kind: book
primary: false
---

## Summary

Adds disk (swap space) below RAM as a level of the memory hierarchy, the
present bit, and the page fault: what the OS does when a page isn't in
memory. Footer reads "© 2008–23"; read via pdftotext.

## Key claims

- Disk is another level of the memory hierarchy, bigger and slower than RAM. "in our memory hierarchy, big and slow hard drives sit at the bottom, with memory just above." (intro)
- A larger level is slower, or it would be used as memory. "it is generally slower (if it were faster, we would just use it as memory, no?)" (intro)
- Accessing a page that isn't in physical memory is a page fault. "The act of accessing a page that is not in physical memory is commonly referred to as a page fault." (Aside: Swapping Terminology)
- It is really a legal access, so "page miss" would be a better name. "really, it should be called a page miss." (Aside: Swapping Terminology)
- The OS's page-fault handler services it, even with a hardware-managed TLB. "Virtually all systems handle page faults in software" (21.3)
- For a swapped-out page, the OS reads it from disk, updates the PTE, and retries the instruction. "When the disk I/O completes, the OS will then update the page table to mark the page as present" (21.3)
- The faulting process blocks during the I/O, so others can run. "while the I/O is in flight, the process will be in the blocked state." (21.3)
- Bad page replacement makes a program run at disk speed, 10,000 to 100,000 times slower. "a program could run 10,000 or 100,000 times slower." (21.4)

## Visuals worth redrawing

- None checked yet; the chapter has a physical-memory-plus-swap figure worth a look when redrawing.

## My notes

- The book speaks of hard drives; the laptop has an NVMe SSD. Experiment 0001 gives our SSD's read time.

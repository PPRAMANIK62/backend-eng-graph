---
id: ostep-address-spaces
title: "Operating Systems: Three Easy Pieces, ch. 13: The Abstraction: Address Spaces"
author: Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/vm-intro.pdf
kind: book
primary: false
---

## Summary

Introduces the address space: the running program's private view of
memory, holding code, stack and heap. Sets the three goals of a virtual
memory system: transparency, efficiency, protection. PDF footer reads
"© 2008–23" and "[Version 1.10]"; read as text via pdftotext.

## Key claims

- The address space is the program's view of memory. "We call this abstraction the address space, and it is the running program’s view of memory in the system." (13.3)
- It holds the code, a stack for calls and locals, and a heap for dynamic allocations. "the heap is used for dynamically-allocated, user-managed memory" (13.3)
- Goal one, transparency: the program acts as if it has its own memory. "the program behaves as if it has its own private physical memory." (13.4)
- Goal two, efficiency, needs hardware help such as TLBs. "the OS will have to rely on hardware support, including hardware features such as TLBs" (13.4)
- Goal three, protection, gives isolation between processes. "Protection thus enables us to deliver the property of isolation among processes" (13.4)
- Every address a user program can print is virtual. "any address you can see as a programmer of a user-level program is a virtual address." (Aside: Every Address You See Is Virtual)
- The VM system gives each program the illusion of a large, sparse, private address space. "providing the illusion of a large, sparse, private address space to each running program" (13.5)

## Visuals worth redrawing

- Figure 13.3: a tiny 16 KB address space with code, heap and stack regions (check the exact layout when redrawing).

## My notes

- Chapter 18 onward explains how paging implements this.

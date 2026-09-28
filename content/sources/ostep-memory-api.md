---
id: ostep-memory-api
title: "Operating Systems: Three Easy Pieces, ch. 14: Interlude: Memory API"
author: Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/vm-api.pdf
published: 2025
accessed: 2026-09-28
kind: book
primary: false
---

## Summary

Stack vs heap memory in C, malloc() and free(), common bugs, and the
system calls underneath (brk/sbrk, mmap). Footer reads "© 2008–25"; read
via pdftotext.

## Key claims

- Stack memory is managed by the compiler, also called automatic memory. "allocations and deallocations of it are managed implicitly by the compiler for you" (14.1)
- Stack space is freed when the function returns. "When you return from the function, the compiler deallocates the memory for you" (14.1)
- Heap memory is for long-lived data and is managed by the programmer. "heap memory, where all allocations and deallocations are explicitly handled by you, the programmer." (14.1)
- A single line like `int *x = malloc(...)` uses both: the pointer on the stack, the int on the heap. "both stack and heap allocation occur on this line" (14.1)
- malloc and free are library calls, not system calls; the library manages space inside the address space. "they are not system calls, but rather library calls." (14.5)
- The library grows the heap with brk/sbrk or gets anonymous memory with mmap. "you can also obtain memory from the operating system via the mmap() call." (14.5)

## Visuals worth redrawing

None.

## My notes

- Go hides malloc/free, but the same split exists; see the Go GC guide's "Where Go values live".

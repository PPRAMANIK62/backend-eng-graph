---
id: kernel-page-table-isolation
title: Page Table Isolation (PTI)
author: Linux kernel documentation
url: https://docs.kernel.org/arch/x86/pti.html
published: living document (read at 7.3.0-rc5 on docs.kernel.org)
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel's own description of page table isolation, the x86 defence
against Meltdown-style attacks: user space runs with page tables that map
almost none of the kernel, so every entry into and exit from the kernel
switches page tables. Lists the memory and runtime costs and how PCID
reduces them.

## Key claims

- PTI protects against attacks that read kernel memory from user space, like Meltdown. "Page Table Isolation (pti, previously known as KAISER [1]) is a countermeasure against attacks on the shared user/kernel address space such as the “Meltdown” approach" (23.1 Overview)
- User-space page tables map only a small part of the kernel. "The userspace page tables contain only a minimal amount of kernel" (23.1 Overview; sentence continues with the entry/exit data)
- Every kernel entry and exit (interrupt, syscall, exception) must switch page tables by writing CR3, at about a hundred cycles each. "Moves to CR3 are on the order of a hundred cycles, and are required at every entry and exit." (23.3 Overhead, Runtime Cost)
- Losing global pages means more TLB misses after a context switch, costing at most 1%. "The actual loss of performance is very small, however, never exceeding 1%." (23.3)
- PCID lets the CPU avoid flushing the whole TLB when switching page tables. "Process Context IDentifiers (PCID) is a CPU feature that allows us to skip flushing the entire TLB when switching page tables" (23.3)
- Without PCID, every CR3 write flushes the whole TLB. "On systems without PCID support, each CR3 write flushes the entire TLB." (23.3)
- Each process needs an extra 4 KiB for its top-level page table. "(Consumes an additional 4k per process)." (23.3, Increased Memory Use)

## Visuals worth redrawing

- Two page-table views: kernel page tables (map everything) vs user page
  tables (user memory plus a small entry/exit area).

## My notes

- Numbers are generic; Gregg (2018) shows how much it varies by workload.

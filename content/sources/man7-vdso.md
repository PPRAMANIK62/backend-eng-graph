---
id: man7-vdso
title: vdso(7) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man7/vdso.7.html
published: 2025-12-25
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The vDSO is a small shared library the kernel maps into every process so
that some "system calls", like asking the time, can run in user space
without entering the kernel. Lists the functions it provides per
architecture. Linux man-pages 6.19.

## Key claims

- System calls can be slow; the old x86 `int $0x80` goes through the full interrupt path. "Making system calls can be slow." and "it goes through the full interrupt-handling paths in the processor's microcode as well as in the kernel." (Example background)
- Newer x86 CPUs have faster instructions for entering the kernel. "Newer processors have faster (but backward incompatible) instructions to initiate system calls." (Example background)
- gettimeofday is called very often and its answer isn't secret, so the kernel puts the data in memory the process can read. "Thus the kernel arranges for the information required to answer this question to be placed in memory the process can access." (Example background)
- With the vDSO, gettimeofday stops being a system call. "Now a call to gettimeofday(2) changes from a system call to a normal function call and a few memory accesses." (Example background)
- On x86-64 the vDSO provides `__vdso_clock_gettime`, `__vdso_getcpu`, `__vdso_gettimeofday` and `__vdso_time`. (ARCHITECTURE-SPECIFIC NOTES, x86-64 table)

## Visuals worth redrawing

None.

## My notes

- Explains why a `clock_gettime` loop won't show up in strace and why
  a "syscall benchmark" that calls gettimeofday measures the wrong thing.
  (Our experiment 0001 used getppid through syscall(), which does enter
  the kernel.)

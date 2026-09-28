---
id: man7-syscall
title: syscall(2) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man2/syscall.2.html
published: 2026-02-02
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

Describes the `syscall()` library function for calling any system call by
number, and gives, for each CPU architecture, the instruction that enters
the kernel and the registers that carry the call number, arguments,
return value and error. Linux man-pages 6.19.

## Key claims

- syscall() calls a system call by number, useful when libc has no wrapper. "Employing syscall() is useful, for example, when invoking a system call that has no wrapper function in the C library." (DESCRIPTION)
- It stores errors in errno. "stores any error returned by the system call in errno(3)." (DESCRIPTION)
- In general 0 means success and -1 means an error, with the error number in errno. "A -1 return value indicates an error, and an error number is stored in errno." (RETURN VALUE)
- On x86-64 the instruction is `syscall`, the call number goes in rax and the result comes back in rax. Table row: "x86-64      syscall               eax     rax  rdx" (Architecture calling conventions, first table; the man page lists the number register as eax/rax)
- On i386 the instruction is `int $0x80`. Table row: "i386        int $0x80             eax     eax  edx" (same table)
- On x86-64 arguments go in rdi, rsi, rdx, r10, r8, r9. Table row: "x86-64        rdi   rsi   rdx   r10   r8    r9" (second table)
- On arm64 the instruction is `svc #0`. Table row: "arm64       svc #0                w8      x0   x1" (first table)

## Visuals worth redrawing

- The two register tables, trimmed to x86-64 and arm64.

## My notes

- Companion syscalls(2) lists every Linux system call with the version it
  appeared in; not cited here.

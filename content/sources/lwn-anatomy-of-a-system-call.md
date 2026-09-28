---
id: lwn-anatomy-of-a-system-call
title: Anatomy of a system call, part 1
author: David Drysdale
url: https://lwn.net/Articles/604287/
kind: blog
primary: false
---

## Summary

LWN walkthrough of how a `read()` system call gets from a user program to
the kernel function on x86_64 (kernel code as of 2014): the SYSCALL
instruction, the MSR_LSTAR register that points at the entry code, the
syscall table indexed by the number in RAX, and the SYSCALL_DEFINEn
macros.

## Key claims

- A system call needs special instructions to switch the CPU into ring 0, and is identified by a number, not an address. "Special instructions are needed to make the processor perform a transition to ring 0 (privileged mode)." (intro)
- The called code is picked by syscall number. "the kernel code being invoked is identified by a syscall number, rather than by a function address." (intro)
- x86_64 convention: number in RAX (0 for read), first three arguments in RDI, RSI, RDX, then the SYSCALL instruction. "put the system call number (0 for read) into the RAX register, and the other parameters into specific registers (RDI, RSI, RDX for the first 3 parameters), then issue the SYSCALL instruction." (x86_64 section)
- At boot, the kernel writes the entry point's address into MSR_LSTAR; SYSCALL jumps there. "the model-specific register for handling the SYSCALL instruction." (x86_64 section)
- The entry code saves registers on the kernel stack and calls the function at entry RAX of `sys_call_table`. "The system_call code pushes the registers onto the kernel stack, and calls the function pointer at entry RAX in the sys_call_table table" (x86_64 section)
- The kernel's read starts by looking up the file descriptor, with -EBADF as the default error: the listing shows `fdget_pos(fd)` and `ssize_t ret = -EBADF;` (SYSCALL_DEFINEn section)
- read() itself lives in fs/read_write.c and hands most work to vfs_read(). (SYSCALL_DEFINEn section)

## Visuals worth redrawing

- The path user program -> libc -> SYSCALL -> MSR_LSTAR entry ->
  sys_call_table[RAX] -> sys_read -> back.

## My notes

- File names (entry_64.S, system_call) are from 2014 kernels; the entry
  code has been reorganized since. Describe the path, not file names.

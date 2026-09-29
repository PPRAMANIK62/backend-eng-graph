---
id: man7-bpf
title: bpf(2), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man2/bpf.2.html
kind: docs
primary: true
---

## Summary

The man page for the `bpf()` system call (man-pages 6.19): the single
call that creates maps, loads programs and attaches them. It describes
eBPF against classic BPF, the verifier's promise, maps, program types,
privilege rules and the JIT compilers by architecture.

## Key claims

- One system call for all of it. "The bpf() system call performs a range of operations related to extended Berkeley Packet Filters." (DESCRIPTION)
- Both classic and extended BPF are checked before loading. "For both cBPF and eBPF programs, the kernel statically analyzes the programs before loading them, in order to ensure that they cannot harm the running system." (DESCRIPTION)
- The verifier's promise. "An in-kernel verifier statically determines that the eBPF program terminates and is safe to execute." (DESCRIPTION)
- Programs run on events and store what they find in maps. "A new event triggers execution of the eBPF program, which may store information about the event in eBPF maps." (DESCRIPTION)
- Maps are shared between kernel programs and user space. "They allow sharing of data between eBPF kernel programs, and also between kernel and user-space applications." (eBPF maps)
- Programs can be rejected for infinite loops or unknown calls. "eBPF programs can be deemed invalid due to unrecognized instructions, the use of reserved fields, jumps out of range, infinite loops or calls of unknown functions." (ERRORS, EINVAL)
- The program type decides which helpers it can call. "The eBPF program type (prog_type) determines the subset of kernel helper functions that the program may call." (eBPF program types)
- The system call was added in Linux 3.18. (HISTORY)
- Before Linux 4.4 everything needed CAP_SYS_ADMIN; from 4.4 unprivileged users can load limited socket filter programs. "Prior to Linux 4.4, all bpf() commands require the caller to have the CAP_SYS_ADMIN capability." (NOTES)
- Unprivileged use can be turned off. "Unprivileged access may be blocked by writing the value 1 to the file /proc/sys/kernel/unprivileged_bpf_disabled." (NOTES)
- eBPF JIT on x86-64 since Linux 3.18 (cBPF since 3.0), arm64 since 3.18, riscv since 5.1. "x86-64 (since Linux 3.18; cBPF since Linux 3.0)" (NOTES, JIT list)

## Visuals worth redrawing

None.

## My notes

- The privilege notes are about CAP_SYS_ADMIN; ebpf.io mentions the newer
  CAP_BPF. The man page doesn't say when CAP_BPF arrived; don't give a
  version.

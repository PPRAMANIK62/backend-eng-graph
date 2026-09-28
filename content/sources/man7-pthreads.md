---
id: man7-pthreads
title: pthreads(7) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man7/pthreads.7.html
published: 2026-02-08
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

Overview of POSIX threads on Linux: what threads in one process share,
what each thread has for itself, and how Linux implements them (NPTL, one
kernel scheduling entity per thread, built on clone and futex). Linux
man-pages 6.19.

## Key claims

- Threads in a process share global memory; each has its own stack. "These threads share the same global memory (data and heap segments), but each thread has its own stack (automatic variables)." (DESCRIPTION)
- Process-wide attributes shared by all threads include the process ID, open file descriptors, signal dispositions, current directory, user and group IDs and resource limits. "POSIX.1 also requires that threads share a range of other attributes (i.e., these attributes are process-wide rather than per-thread)" (DESCRIPTION, list)
- Per-thread attributes include thread ID, signal mask, errno and scheduling policy; on Linux also CPU affinity. "As well as the stack, POSIX.1 specifies that various other attributes are distinct for each thread" (DESCRIPTION, list)
- LinuxThreads, the original implementation, is unsupported since glibc 2.4. "Since glibc 2.4, this implementation is no longer supported." (Linux implementations of POSIX threads)
- Linux threads are 1:1: each thread is a kernel scheduling entity, created with clone, synchronized with futex. "Both of these are so-called 1:1 implementations, meaning that each thread maps to a kernel scheduling entity." (Linux implementations of POSIX threads)
- With NPTL all threads of a process share one PID. "all members of a thread group share the same PID." (NPTL)

## Visuals worth redrawing

None; the two lists (shared vs per-thread) make a good table.

## My notes

- Signal dispositions are shared but signal masks are per-thread; relevant
  for the signals node.

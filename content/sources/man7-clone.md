---
id: man7-clone
title: clone(2) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man2/clone.2.html
kind: docs
primary: true
---

## Summary

The Linux system call underneath both fork-like process creation and
thread creation. Flags choose what the new task shares with its creator:
memory, file descriptor table, signal handlers, thread group. Linux
man-pages 6.19.

## Key claims

- clone is like fork but lets the caller choose what to share. "By contrast with fork(2), these system calls provide more precise control over what pieces of execution context are shared between the calling process and the child process." (DESCRIPTION)
- CLONE_VM makes the two share one memory space. "If CLONE_VM is set, the calling process and the child process run in the same memory space." (CLONE_VM)
- CLONE_FILES makes them share one file descriptor table. "If CLONE_FILES is set, the calling process and the child process share the same file descriptor table." (CLONE_FILES)
- CLONE_THREAD puts the child in the caller's thread group; thread groups came in Linux 2.4 so threads can share a PID. "Thread groups were a feature added in Linux 2.4 to support the POSIX threads notion of a set of threads that share a single PID." (CLONE_THREAD)
- getpid returns the thread group ID; each thread has its own system-wide thread ID. "Since Linux 2.4, calls to getpid(2) return the TGID of the caller." (CLONE_THREAD)

## Visuals worth redrawing

None.

## My notes

- Good for showing that on Linux "process" and "thread" are both tasks
  with different amounts of sharing.

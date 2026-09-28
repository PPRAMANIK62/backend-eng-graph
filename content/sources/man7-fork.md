---
id: man7-fork
title: fork(2) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man2/fork.2.html
published: 2026-06-05
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The reference for how Linux creates a new process by copying the calling
one. Lists what the child gets and doesn't get from the parent, and how
Linux makes the copy cheap with copy-on-write. Linux man-pages 6.19.

## Key claims

- fork copies the calling process to make a new one. "fork() creates a new process by duplicating the calling process." (DESCRIPTION)
- Parent and child have separate memory after the call. "The child process and the parent process run in separate memory spaces." (DESCRIPTION)
- Writes by one don't show up in the other. "Memory writes, file mappings (mmap(2)), and unmappings (munmap(2)) performed by one of the processes do not affect the other." (DESCRIPTION)
- The child gets its own process ID. "The child has its own unique process ID" (DESCRIPTION, list of differences)
- The child starts with no pending signals. "The child's set of pending signals is initially empty" (DESCRIPTION)
- The child has only one thread, the one that called fork. "The child process is created with a single thread—the one that called fork()." (DESCRIPTION, further points)
- The whole address space is copied, including the state of mutexes held by other threads. "The entire virtual address space of the parent is replicated in the child, including the states of mutexes, condition variables, and other pthreads objects" (DESCRIPTION, further points)
- The child doesn't inherit timers or memory locks. "The child does not inherit timers from its parent" and "The child does not inherit its parent's memory locks" (DESCRIPTION)
- After fork in a multithreaded program, the child may only call async-signal-safe functions until exec. "the child can safely call only async-signal-safe functions (see signal-safety(7)) until such time as it calls execve(2)." (DESCRIPTION, further points)
- The child gets copies of the parent's file descriptors, pointing at the same open files and sharing the file offset. "The child inherits copies of the parent's set of open file descriptors." and "the two file descriptors share open file status flags, file offset" (DESCRIPTION, further points)
- fork returns twice: the child's PID in the parent, 0 in the child. "On success, the PID of the child process is returned in the parent, and 0 is returned in the child." (RETURN VALUE)
- Linux uses copy-on-write, so fork only copies page tables and a task structure up front. "Under Linux, fork() is implemented using copy-on-write pages, so the only penalty that it incurs is the time and memory required to duplicate the parent's page tables, and to create a unique task structure for the child." (NOTES)

## Visuals worth redrawing

None on the page.

## My notes

- The list of what the child does not inherit (locks, timers, pending
  signals, async I/O) is long; the article only needs a few examples.

---
id: man7-pid-namespaces
title: pid_namespaces(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/pid_namespaces.7.html
kind: docs
primary: true
---

## Summary

How PID namespaces work (man-pages 6.19): PIDs start at 1 in a new
namespace, that first process acts as the namespace's init, namespaces
nest, a process has one PID per level, and `/proc` has to be remounted
to show the new view.

## Key claims

- Different PID namespaces can reuse the same PIDs. "PID namespaces isolate the process ID number space, meaning that processes in different PID namespaces can have the same PID." (DESCRIPTION)
- PIDs in a new namespace start at 1. "PIDs in a new PID namespace start at 1, somewhat like a standalone system" (DESCRIPTION)
- The first process is the namespace's init and adopts orphans. "This process becomes the parent of any child processes that are orphaned because a process that resides in this PID namespace terminated" (The namespace init process)
- If init dies, every process in the namespace is killed. "If the "init" process of a PID namespace terminates, the kernel terminates all of the processes in the namespace via a SIGKILL signal." (The namespace init process)
- Init only gets signals it has a handler for, from inside the namespace. "Only signals for which the "init" process has established a signal handler can be sent to the "init" process by other members of the PID namespace." (The namespace init process)
- SIGKILL and SIGSTOP from an ancestor namespace are forced through. "SIGKILL or SIGSTOP are treated exceptionally: these signals are forcibly delivered when sent from an ancestor PID namespace." (The namespace init process)
- Nesting is limited to 32 levels since Linux 3.7. "Since Linux 3.7, the kernel limits the maximum nesting depth for PID namespaces to 32." (Nesting PID namespaces)
- A process sees only its own namespace and descendants. "a process can see (e.g., send signals with kill(2), set nice values with setpriority(2), etc.) only processes contained in its own PID namespace and in descendants of that namespace." (Nesting PID namespaces)
- One PID per level of the hierarchy. "A process has one process ID in each of the layers of the PID namespace hierarchy in which is visible" (Nesting PID namespaces)
- unshare(CLONE_NEWPID) affects children, not the caller. "These calls do not, however, change the PID namespace of the calling process, because doing so would change the caller's idea of its own PID" (setns(2) and unshare(2) semantics)
- /proc shows the PID namespace of whoever mounted it, so remount it. "After creating a new PID namespace, it is useful for the child to change its root directory and mount a new procfs instance at /proc so that tools such as ps(1) work correctly." (/proc and PID namespaces)

## Visuals worth redrawing

Nested PID namespaces with one process holding a PID at each level.

## My notes

- The "init dies, everything dies" and "init ignores signals it has no
  handler for" rules are why PID 1 in a container matters (see the
  signals and graceful-shutdown nodes).

---
id: drepper-molnar-nptl-2005
title: The Native POSIX Thread Library for Linux
author: Ulrich Drepper, Ingo Molnar
url: https://akkadia.org/drepper/nptl-design.pdf
published: 2005-02-21
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

Design paper for NPTL, the thread library Linux still uses, by its
authors. Explains why Linux chose one kernel thread per user thread
(1-on-1) over M-on-N, and the kernel changes made for it. The paper warns
up front that its descriptions of limitations are out of date.

## Key claims

- The paper's description of limitations is out of date. "This document is completely, utterly out of date when it comes to descriptions of the limitations of the current implementation." (title page)
- In 1-on-1, each user-level thread has a kernel thread under it. "the 1-on-1 model of the old implementation where each user-level thread has an underlying kernel thread." (1-on-1 vs. M-on-N)
- M-on-N means two schedulers, which hurt performance if they don't cooperate. "Therefore we have two schedulers at work." (1-on-1 vs. M-on-N)
- Kernel developers agreed M-on-N didn't fit Linux. "The consensus among the kernel developers was that an M-on-N implementation would not fit into the Linux kernel concept." (1-on-1 vs. M-on-N)
- Maintenance cost counted too. "a lot can be said for a clean and slim implementation." (1-on-1 vs. M-on-N)
- A new exit_group call ends the whole process; starting and stopping 100,000 threads went from 15 minutes to 2 seconds. "In one instance starting and stopping 100,000 threads formerly took 15 minutes; this is now takes 2 seconds." (kernel changes list)

## Visuals worth redrawing

None.

## My notes

- Its claim that the scheduler is O(1) is about the 2005 scheduler, which
  CFS (2.6.23) and EEVDF (6.6) have since replaced. Don't use it.

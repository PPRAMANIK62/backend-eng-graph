---
id: kernelnewbies-linux-6-6
title: Linux 6.6
author: Kernel Newbies
url: https://kernelnewbies.org/Linux_6.6
kind: docs
primary: false
---

## Summary

Kernel Newbies' release summary for Linux 6.6 (released in 2023).
Section 1.1 explains that the release replaced the CFS scheduler with
EEVDF and why.

## Key claims

- Linux 6.6 was released in 2023. (top of page)
- The scheduler decides which task runs next. "The task scheduler is the part of the kernel that decides which task should be run next when there are many to pick" (1.1 New task scheduler: EEVDF)
- CFS was merged in 2.6.23 and replaced by EEVDF in 6.6. "The previous algorithm, called CFS, was merged in Linux 2.6.23. In this release, it is replaced by code that uses a new algorithm, called EEVDF" (1.1)
- EEVDF picks tasks that got less than their share and holds back those that got more, algorithmically. "processes that are not getting the attention they should are automatically picked the next time, while processes that got more than they deserved are \"punished\"." (1.1)
- CFS relied on heuristics and tunables; many tunables were removed. "CFS used heuristics and tunable knobs to attempt to guess which processes needed more attention. Many of these tunables have been removed." (1.1)
- Expected effect: better latency for tasks CFS left behind. "this new scheduler should improve the latency of tasks that would be left behind by CFS" (1.1)

## Visuals worth redrawing

None.

## My notes

- Secondary (a volunteer-written summary), but closely follows the merge.

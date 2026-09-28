---
id: kernel-sched-eevdf
title: EEVDF Scheduler
author: Linux kernel documentation
url: https://docs.kernel.org/scheduler/sched-eevdf.html
published: living document (read at 7.3.0-rc5 on docs.kernel.org)
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

Short kernel doc on EEVDF, the scheduler Linux moved to from CFS starting
in 6.6. Explains lag, eligibility, virtual deadlines, how sleeping tasks'
lag decays, and that tasks can ask for their own time slice.

## Key claims

- EEVDF comes from a 1995 paper; Linux began moving to it from CFS in 6.6, using Peter Zijlstra's 2023 version. "The Linux kernel began transitioning to EEVDF in version 6.6 (as a new option in 2024), moving away from the earlier Completely Fair Scheduler (CFS)" (EEVDF Scheduler)
- Like CFS, it aims to share CPU time equally among runnable tasks of the same priority. "EEVDF aims to distribute CPU time equally among all runnable tasks with the same priority." (EEVDF Scheduler)
- Each task has a virtual run time and a lag; positive lag means it's owed CPU time, negative means it has had more than its share. "a task with a positive lag is owed CPU time, while a negative lag means the task has exceeded its portion." (EEVDF Scheduler)
- It picks among tasks with lag >= 0, the one with the earliest virtual deadline. "EEVDF picks tasks with lag greater or equal to zero and calculates a virtual deadline (VD) for each, selecting the task with the earliest VD to execute next." (EEVDF Scheduler)
- Shorter time slices mean earlier deadlines, which favours latency-sensitive tasks. "this allows latency-sensitive tasks with shorter time slices to be prioritized" (EEVDF Scheduler)
- Sleeping tasks stay on the run queue marked for deferred dequeue so their lag decays, which stops tasks from gaming it by sleeping briefly. "This prevents tasks from exploiting the system by sleeping briefly to reset their negative lag" (EEVDF Scheduler)
- Long sleepers eventually get their lag reset. "Hence, long-sleeping tasks eventually have their lag reset." (EEVDF Scheduler)
- A task with an earlier deadline can preempt; tasks can request a time slice with sched_setattr(). "tasks can request specific time slices using the new sched_setattr() system call" (EEVDF Scheduler)

## Visuals worth redrawing

None on the page. The LWN article it references (925371) has a worked lag
example worth redrawing as a timeline.

## My notes

- The "(as a new option in 2024)" wording clashes with 6.6's release date
  (2023-10-29) and with Kernel Newbies saying 6.6 replaced CFS. Treat 6.6
  (2023) as the switch; the lag-on-sleep work came later (LWN 969062, 2024).
- The companion CFS page (sched-design-CFS) says "CFS is making room for
  EEVDF". man-pages 6.19 sched(7) still says CFS is the default (seen
  2026-09-28 during candidate research).

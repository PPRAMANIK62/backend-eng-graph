---
id: man7-getrusage
title: getrusage(2) — Linux manual page
author: Linux man-pages project
url: https://man7.org/linux/man-pages/man2/getrusage.2.html
kind: docs
primary: true
---

## Summary

The system call that returns resource usage for a process, its children,
or a thread, including minor and major page fault counts. Page footer:
"Linux man-pages 6.19 …".

## Key claims

- The struct names them soft and hard faults. "long ru_minflt; /* page reclaims (soft page faults) */" (struct rusage)
- A minor fault is one serviced without I/O. "The number of page faults serviced without any I/O activity" (ru_minflt)
- The definition names one specific no-I/O case: reclaiming a frame from the list awaiting reuse. "here, I/O activity is avoided by “reclaiming” a page frame from the list of pages awaiting reallocation." (ru_minflt)
- A major fault needed I/O. "The number of page faults serviced that required I/O activity." (ru_majflt)
- RUSAGE_SELF sums over all threads; RUSAGE_THREAD (since Linux 2.6.26) gives one thread. "Return resource usage statistics for the calling thread." (RUSAGE_THREAD)
- ru_utime is CPU time in user mode, ru_stime in kernel mode. "This is the total amount of time spent executing in user mode, expressed in a timeval structure (seconds plus microseconds)." (ru_utime)
- Voluntary context switches: the process gave up the CPU early, usually to wait. "The number of times a context switch resulted due to a process voluntarily giving up the processor before its time slice was completed (usually to await availability of a resource)." (ru_nvcsw, since Linux 2.6)
- Involuntary: preempted by a higher-priority task or used up its slice. "The number of times a context switch resulted due to a higher priority process becoming runnable or because the current process exceeded its time slice." (ru_nivcsw, since Linux 2.6)

## Visuals worth redrawing

None.

## My notes

- The ru_minflt text explains the no-I/O case as "reclaiming" a frame from a free list. The kernel docs list lazy allocation and copy-on-write as normal fault causes too, which also need no I/O. The man page wording looks older than the mechanism.

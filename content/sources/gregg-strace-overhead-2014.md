---
id: gregg-strace-overhead-2014
title: strace Wow Much Syscall
author: Brendan Gregg
url: https://www.brendangregg.com/blog/2014-05-11/strace-wow-much-syscall.html
published: 2014-05-11
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

Warns that strace, as implemented with ptrace, can slow the traced
program enormously, shows a 442x slowdown on a syscall-heavy dd, and
lists lower-overhead alternatives (perf trace, sysdig and others). From a
performance engineer, not the strace authors.

## Key claims

- strace uses ptrace, which stops the target at the start and end of every system call. "pausing the target process for each syscall so that the debugger can read state. And doing this twice: when the syscall begins, and when it ends." (intro)
- Each stop is a context switch between the application and strace. "strace pauses your application twice for each syscall, and context-switches each time between the application and strace." (intro)
- `dd if=/dev/zero of=/dev/null bs=1 count=500k` took 0.103851 s alone and 45.9599 s under `strace -eaccept`, 442x slower; worst case because dd makes syscalls as fast as it can. "That's 442x slower." (example)
- The slowdown happened even though the filter (`-eaccept`) traced a call dd doesn't make. (example command)
- Warning: overhead can exceed 100x, and timings under strace can mislead. "any timing information may also be so distorted as to be misleading." (WARNING)
- strace bugs have left processes stuck in the STOP state; kill strace, then `kill -CONT` the process. (section after the warning)
- Alternatives with buffered tracing: perf_events (`perf trace`, Linux 3.7), sysdig, ktap, SystemTap. "Linux 3.7 introduced perf trace, a buffered strace-like subcommand for perf_events" (conclusion)
- Think twice before running it in production. "I wouldn't dare run strace(1) in production without seriously considering the consequences" (intro)

## Visuals worth redrawing

None.

## My notes

- 2014: predates strace's --seccomp-bpf option, which (per the man page)
  lets the kernel stop the process only for traced calls when using -f.
  No source measured the overhead with it; a lab experiment could.

---
id: man7-perf-record
title: perf-record(1), Linux manual page
author: Linux perf developers (rendered by man7.org)
url: https://man7.org/linux/man-pages/man1/perf-record.1.html
kind: docs
primary: true
---

## Summary

The manual page for `perf record`, the Linux perf command that samples a
program or the whole system into `perf.data` for `perf report` to read
later. Used here for the sampling frequency option, call-graph recording
and the stack-unwinding methods (frame pointers, DWARF, LBR).

## Key claims

- What it does. "This command runs a command and gathers a performance counter profile from it, into perf.data - without displaying anything." (DESCRIPTION)
- Sampling frequency. "-F, --freq= Profile at this frequency." (OPTIONS)
- The ceiling comes from a sysctl. "Use max to use the currently maximum allowed frequency, i.e. the value in the kernel.perf_event_max_sample_rate sysctl." (OPTIONS, -F)
- -g records stacks for kernel and user space. "-g Enables call-graph (stack chain/backtrace) recording for both kernel space and user space." (OPTIONS)
- Default user-space unwinding is frame pointers. "Default is "fp" (for user space)." (OPTIONS, --call-graph) [the quote contains inner quotes around fp]
- The three user-space methods. "Valid options are "fp" (frame pointer), "dwarf" (DWARF's CFI - Call Frame Information) or "lbr" (Hardware Last Branch Record facility)." (OPTIONS, --call-graph)
- Without frame pointers, fp gives wrong stacks. "In some systems, where binaries are build with gcc --fomit-frame-pointer, using the "fp" method will produce bogus call graphs" (OPTIONS, --call-graph)
- Whole-system collection is the default when no target is given. "-a, --all-cpus System-wide collection from all CPUs (default if no target is specified)." (OPTIONS)
- -p attaches to an existing process. "-p, --pid= Record events on existing process ID (comma separated list)." (OPTIONS)

## Visuals worth redrawing

None.

## My notes

- The page doesn't state the default sampling frequency; don't give one.

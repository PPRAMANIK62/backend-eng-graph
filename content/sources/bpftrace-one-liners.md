---
id: bpftrace-one-liners
title: bpftrace One-Liner Tutorial
author: Brendan Gregg (bpftrace project)
url: https://bpftrace.org/tutorial-one-liners
kind: docs
primary: true
---

## Summary

The bpftrace project's tutorial: twelve one-liners that introduce probes,
filters, maps, histograms, kernel dynamic tracing, stack sampling and
scheduler tracing. Written by Brendan Gregg (2018), a bpftrace
co-creator, and kept on the project's site.

## Key claims

- A probe is an instrumentation point. "A probe is an instrumentation point for capturing event data." (Lesson 1)
- Tracing file opens as they happen: a program on the `tracepoint:syscalls:sys_enter_openat` probe that prints the process name and file name. (Lesson 3)
- Tracepoints are preferred over kprobes because their interface is stable. "Tracepoints are preferred over kprobes (kernel dynamic tracing, introduced in lesson 6), since tracepoints have stable API." (Lesson 3)
- Maps (@) store and summarise data. "@: This denotes a special variable type called a map, which can store and summarize data in different ways." (Lesson 4)
- Counting syscalls by process: `tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }` (Lesson 4)
- hist() makes a power-of-2 histogram. "hist(): This is a map function which summarizes the argument as a power-of-2 histogram." (Lesson 5)
- kprobes can trace tens of thousands of kernel functions, but aren't stable across kernel versions. "These are powerful probe types, letting you trace tens of thousands of different kernel functions." (Lesson 6)
- Timing a function: store a start time per thread at entry, subtract at return: `kprobe:vfs_read { @start[tid] = nsecs; } kretprobe:vfs_read /@start[tid]/ { @ns[comm] = hist(nsecs - @start[tid]); delete(@start, tid); }` (Lesson 7)
- The thread ID works as a key because a thread runs one syscall at a time. "because kernel threads can only be executing one syscall at a time, we can use the thread ID as the unique identifier" (Lesson 7)
- Sampling kernel stacks at 99 Hz: `profile:hz:99 { @[kstack] = count(); }` (Lesson 9)
- Why 99 and not 100. "But we don't want 100 exactly, as sampling may occur in lockstep with other timed activities, hence 99." (Lesson 9)
- Stack counts are ready for a flame graph. "The output of this is ideal to be visualized as a flame graph." (Lesson 9)
- Tracing the scheduler's context switch with kernel stacks: `tracepoint:sched:sched_switch { @[kstack] = count(); }` (Lesson 10)
- With BTF in the kernel, all kernel structs are available without headers. "If the kernel has BTF data, all kernel structs are always available." (Lesson 12)
- Maps print when bpftrace ends. "Maps are automatically printed when bpftrace ends (eg, via Ctrl-C)." (Lesson 4)
- The block I/O tracepoint. "block_rq_issue: This fires when an I/O is issued to the device." (Lesson 11)

## Visuals worth redrawing

- The ASCII histogram of read() latency by process (Lesson 7); show the
  shape, not the numbers.

## My notes

- The bpftrace README (github.com/bpftrace/bpftrace) says it uses LLVM
  and libbpf and supports kprobes, uprobes, USDT and tracepoints. Opened,
  not given a note.

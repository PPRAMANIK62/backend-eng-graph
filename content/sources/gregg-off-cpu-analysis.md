---
id: gregg-off-cpu-analysis
title: Off-CPU Analysis
author: Brendan Gregg
url: https://www.brendangregg.com/offcpuanalysis.html
kind: blog
primary: true
---

## Summary

Brendan Gregg's page on off-CPU analysis: measuring the time threads
spend blocked (on I/O, locks, timers, paging) along with the stack that
blocked, so that together with CPU profiling you can account for all of a
thread's time. It compares CPU sampling, application tracing, off-CPU
tracing and off-CPU sampling, measures the overhead of doing it with perf
versus eBPF on a MySQL load, and covers the traps: threads idle-waiting
for work, scheduler latency and involuntary context switches.

## Key claims

- Two kinds of time. "On-CPU: where threads are spending time running on-CPU." and "Off-CPU: where time is spent waiting while blocked on I/O, locks, timers, paging/swapping, etc." (intro)
- CPU profiling only sees running threads. "It differs from CPU profiling, which only examines threads if they are executing on-CPU." (intro)
- Together they cover all of a thread's time. "Off-CPU analysis is complementary to CPU analysis, so that 100% of thread time can be understood." (intro)
- How CPU sampling works: snapshots of the program counter or whole stack at an interval, such as 99 Hertz; perf -F 99 on Linux. "This will give counts of either the running function or the stack trace, allowing reasonable estimates to be calculated of where the CPU cycles are being spent." (1. CPU Sampling)
- CPU sampling misses blocked time. "it doesn't gather data when the application has blocked and is waiting off-CPU." (1. CPU Sampling)
- Instrumenting every function costs a lot and changes what you measure. "you either trace all application functions, which can have a significant performance impact (and affect the performance you are trying to measure), or you pick the functions that are likely to block, and hope you didn't miss any." (2. Application Tracing)
- Off-CPU tracing instruments only the kernel's switch-off-CPU path. "only the kernel functions that switch the thread off-CPU are traced, along with timestamps and user-land stack traces." (3. Off-CPU Tracing)
- It catches every kind of wait for any application. "Off-CPU tracing captures all wait events for any application." (3. Off-CPU Tracing)
- A wall-time profiler samples all threads whether running or not. "It can also be accomplished by a wall-time profiler: one that samples all threads all the time, regardless of whether they are on- or off-CPU." (4. Off-CPU Sampling)
- Scheduler events can be very frequent, so overhead adds up. "scheduler events can be very frequent – in extreme cases, millions of events per second" (Overhead)
- In-kernel summaries are what make it practical. "This is why tracers that can do in-kernel summaries, like Linux eBPF, are so important for reducing overhead and making off-CPU analysis practical." (Overhead)
- His test: 8 CPUs, Linux 4.15, MySQL at 102k context switches per second, CPU saturated on purpose. (Overhead)
- perf dumping every scheduler event: 9% throughput drop while tracing, 224 Mbytes for 10 s, 9-13% overhead for 45 s in total. "You could summarize this by saying the 10 second perf trace cost 9-13% overhead for 45 seconds." (Overhead)
- eBPF counting stacks in the kernel: 6% drop, 6-13% for 17 s in total. "So a 10 second trace cost 6-13% overhead for 17 seconds." (Overhead)
- Going from a 10 s to a 60 s trace: eBPF post-processing went from 6 to 7 s, perf's from 35 to 212 s. (Overhead)
- Why eBPF's cost didn't grow with the trace: only distinct stacks are kept. "For eBPF it's only capturing and translating unique stacks, which won't scale linearly with the trace duration." (Overhead)
- offcputime, his bcc tool, records off-CPU time with stacks this way. "This is what my offcputime bcc/eBPF program does" (Off-CPU Analysis)
- Start small when trying a new scheduler tracer. "I'll begin by tracing for one tenth of a second only (0.1s), and then ratchet it up from there" (Overhead)
- time(1) already shows off-CPU time in total: tar took 50.8 s real, 1.0 s user, 11.6 s sys, so about 38 s were blocked. "We are missing 38.2 seconds!" (Off-CPU Time)
- Stacks don't change while a thread is off-CPU, so one stack per wait is enough. "Application stack traces don't change while off-CPU." (Off-CPU Analysis)
- Measured at the end of the context switch, in the next thread's context (finish_task_switch on Linux). (Off-CPU Analysis, pseudocode)
- Idle worker threads flood the output. "often most of the blocking time will be in stacks waiting for work, rather than doing work." (Request-Synchronous Context)
- Off-CPU time includes waiting in the run queue. "If the CPUs are running at saturation, then any time a thread blocks, it may endure additional time waiting its turn on a CPU after being woken up." (Scheduler Latency)
- Involuntary switches show stacks with no reason to block. "If you see user-level stack traces that don't make sense – that show no reason to be blocking and going off-CPU – it could be due to involuntary context switching." (Involuntary Context Switching)
- Stacks need frame pointers or JIT symbol help. "Many applications are compiled with the -fomit-frame-pointer gcc option, breaking frame pointer-based stack walking." (Prerequisites)
- The bcc tools need at least Linux 4.8 for stack traces. "These need at least Linux 4.8 for stack trace support." (Linux: perf, eBPF)
- How the bcc tool cpudist measures off-CPU time with eBPF: a kprobe on finish_task_switch(), helpers for the PID and a timestamp, a map for the histogram. "An eBPF program can instrument this function and argument using kprobes, fetch the current PID (via bpf_get_current_pid_tgid()), and also fetch a high resolution timestamp (bpf_ktime_get_ns())." (Off-CPU Time)
- The histogram lives in a map in the kernel. "which uses an eBPF map to efficiently store the histogram buckets in kernel context." (Off-CPU Time)
- Kprobes vs tracepoints: cpudist uses a kprobe though it should use the sched tracepoint for stability. "It should use the sched tracepoint, for API stability reasons" (Off-CPU Time)
- Without frame pointers, bcc's user stacks come out as [unknown]. "The reason is that the default version of tar is compiled without frame pointers, and this version of bcc/eBPF needs them to walk stack traces." (Off-CPU Analysis)
- Off-CPU flame graphs: width is total blocked time. "the width corresponds to the total time in each stack." (Flame Graphs)
- Why cpudist stayed on a kprobe. "the first attempt wasn't successful and was reverted for now." (Off-CPU Time)
- Most of perf's cost was post-processing: 35 s of the 45. "which cost a 13% performance drop (the loss of 1 CPU) for 35 seconds." (Overhead)

## Visuals worth redrawing

- The four ASCII timelines (CPU sampling, application tracing, off-CPU
  tracing, off-CPU sampling) of A() calling B() which blocks in a syscall.
  Basis for the profiling figure.
- The generic thread-state diagram (on-CPU vs off-CPU states).

## My notes

- The overhead numbers are one run on one machine (Linux 4.15, MySQL,
  saturated on purpose). Use only with that context.

---
id: ebpf
title: eBPF
depth: deep
phase: 9
note: >-
  Small safe programs running inside the kernel, for seeing almost
  anything as it happens.
needs: [system-call]
leads_to: [continuous-profiling]
compare_with: [strace]
---

# eBPF

eBPF lets you load a small program into the running Linux kernel and
have it run every time some event happens: a [[system-call]], a call to
a kernel function, a disk I/O finishing, a timer tick. Before the
program is allowed in, the kernel checks that it can't crash the
machine or run forever. For a backend engineer, that makes it the way
to ask detailed questions of a production machine while it's running,
cheaply, without restarting anything.

## A question strace answers expensively

Say reads on a server have become slow and you want to know how long
`read` calls take, broken down by process.

[[strace]] can show you every `read` with its duration. But it works by
stopping the traced program twice for every system call, at entry and
at exit, and switching to strace each time. In one worst case, a
program making system calls as fast as it could ran 442 times slower
under strace. On a busy production server that's not an option.

With eBPF you can ask the same question as a one-line bpftrace program:

```
bpftrace -e 'kprobe:vfs_read { @start[tid] = nsecs; }
  kretprobe:vfs_read /@start[tid]/ {
    @ns[comm] = hist(nsecs - @start[tid]); delete(@start, tid); }'
```

It says: when the kernel function `vfs_read` is entered, store the
current time in nanoseconds, keyed by thread ID. When it returns, if we
saw it start, take the difference and add it to a [[histograms|histogram]] keyed by
process name, then forget the start time. The thread ID works as a key
because one thread can only be in one system call at a time. When you
press Ctrl-C, bpftrace prints a power-of-2 histogram of read latency per
process.

The program never stops the process doing the reads. It runs inside the
kernel, at the moment of the event, adds one number to a histogram
that also lives in the kernel, and returns. Only the finished histogram
crosses into user space.

## What happens when you run it

![Two lanes, user space above and kernel below. In user space, your program (bpftrace, bcc or C) is compiled by LLVM to bytecode, which is loaded into the kernel with the bpf() system call. In the kernel, the verifier checks every path: if the program is unsafe, the load fails and nothing runs; if it's safe, the JIT turns it into machine code, which is attached to a hook. Each time an event fires at the hook (a syscall, a kernel or user function, a tracepoint, a timer tick), the program runs and updates a map. The tool in user space reads the map and prints the result.](img/ebpf-load-and-run.svg)

*From source to a running eBPF program. Adapted from eBPF.io, "What is eBPF?".*

1. **Compile.** The one-liner, or a tool written with bcc or libbpf, is
   compiled to eBPF bytecode, usually by LLVM.
2. **Load.** The bytecode goes into the kernel through one system call,
   `bpf()`, added in Linux 3.18. The same call creates maps and
   attaches programs.
3. **Verify.** The kernel's verifier checks the program before it's
   allowed to exist. More on this below.
4. **Compile again.** A JIT compiler turns the bytecode into native
   machine code, so it runs about as fast as code built into the
   kernel. x86-64 and arm64 have had an eBPF JIT since Linux 3.18.
5. **Attach and run.** The program is attached to a hook and runs each
   time the event fires.
6. **Share results through maps.** Maps are key-value stores in the
   kernel (hash tables, arrays, LRU hashes, ring buffers, stack traces
   and more). The program writes to them. The user-space tool reads
   them through the same `bpf()` call.

## The verifier is why the kernel lets it in

Before eBPF, changing what the kernel does meant one of two things.
Either you got a change accepted into Linux and waited years for it to
reach the machines you run, or you wrote a kernel module, which could
break with every kernel release and could crash the whole machine if it
had a bug. eBPF adds a third option, and the verifier is what makes it
safe.

The verifier doesn't run the program. It simulates it, following every
possible path from the first instruction and tracking what each
register and stack slot could hold: its type (a pointer to what, or a
plain number) and its range of values. It rejects a program that could:

- read a register or stack slot that was never written;
- read or write memory out of bounds, or through something that isn't a
  valid pointer (add two pointers and you get a number, not a pointer);
- use the result of a map lookup without first checking it isn't NULL;
- call a kernel function it isn't allowed to. Programs can't call
  arbitrary kernel functions, only a fixed set of helpers, and which
  helpers depends on the program type: a socket filter gets a different
  set from a tracing program.

It also has to prove the program ends. Until Linux 5.3 that meant no
loops at all, and people unrolled their loops by hand. Since 5.3 a loop
is accepted if the verifier can show it exits: it simply simulates the
iterations as more states. That became workable after Linux 5.2 raised
the instruction limit for a program from 4,096 to one million. To keep that affordable, it prunes: when a path reaches
a state equivalent to one it has already checked, it stops following
it.

Loading also needs privilege: root, or the `CAP_BPF` capability. Since
Linux 4.4 unprivileged users can load a limited kind of program, and
administrators can turn that off with
`/proc/sys/kernel/unprivileged_bpf_disabled`.

One thing the verifier doesn't do: judge what the program is for. It
checks that a program is safe to run, not what the program does with
what it sees.

## Where programs attach

The hook decides what a program sees:

- **Tracepoints** are fixed points the kernel developers put in the
  code on purpose, like `syscalls:sys_enter_openat` (a process opening a
  file), `sched:sched_switch` (a context switch) or
  `block:block_rq_issue` (a disk I/O being sent). Their arguments are a
  stable interface.
- **kprobes** attach to the entry or return of almost any kernel
  function, tens of thousands of them. `vfs_read` above is one. They're
  powerful but not stable: function names and arguments change between
  kernel versions.
- **uprobes** do the same for functions in user-space programs and
  libraries.
- **Timed sampling.** `profile:hz:99 { @[kstack] = count(); }` samples
  kernel stacks 99 times a second on every CPU and counts them, which is
  a CPU profiler (see [[profiling]]) whose output is ready for a
  [[flame-graphs|flame graph]].
- **Network hooks** run a program on packets. That side of eBPF powers
  load balancers and networking in projects like Cilium. This article
  sticks to observing.

## Why summarizing in the kernel matters

The big win over older tracers is the maps. A tracer that sends every
event to user space pays for each one: copying it, writing it out,
processing it later. A program that updates a count or a histogram in
the kernel sends almost nothing until the end.

A measurement of this: tracing every [[context-switch]] on an 8-CPU machine
(Linux 4.15, a MySQL load doing 102,000 switches a second, CPUs
saturated on purpose). `perf` dumping every event wrote 224 MB for a
10-second trace and cost 9 to 13% of throughput for 45 seconds, most of
it post-processing. An eBPF tool counting stacks in the kernel cost 6 to
13% for 17 seconds. Lengthening the trace from 10 to 60 seconds took
eBPF's post-processing from 6 to 7 seconds, and perf's from 35 to 212,
because eBPF only keeps each distinct stack once. Those numbers are from
one machine and one workload, but they show where the cost comes from.

## The tools you'll actually use

Most people never write eBPF bytecode, or even C. They use:

- **bcc**, a collection of ready-made tools with Python front ends.
  `offcputime` records where threads block and for how long. `cpudist`
  shows off-CPU time as a histogram, and it's a neat example of the
  parts: a kprobe on the scheduler function that switches threads, a
  helper that returns the current PID, a helper that returns a
  timestamp, and a map holding the histogram buckets.
- **bpftrace**, a small language inspired by awk, C, DTrace and
  SystemTap, for one-liners like the one above and short scripts.
- **libbpf** (C) and the eBPF Go library, for building eBPF into your
  own tools.

## Where it gets tricky

**It isn't free.** Each event costs a little, and some events are very
frequent: scheduler events can reach millions a second in extreme cases.
A probe on a hot event can slow the machine noticeably. When trying a
new tracer, run it for a tenth of a second first and watch the cost.

**kprobes break between kernels.** A tool built on a kprobe can stop
working when a kernel function is renamed or changes arguments. Prefer
a tracepoint when one exists. Even bcc's `cpudist` stayed on a kprobe
after its first move to the scheduler tracepoint was reverted.

**It needs a recent kernel.** Features arrived one release at a time:
the bcc tools need Linux 4.8 or newer for stack traces, loops need 5.3,
and access to kernel data structures without installing kernel headers
depends on the kernel being built with BTF type information. Check
what your production kernel has before you count on a tool.

**Stacks still need [[stack-walking|frame pointers]].** eBPF walks user-space stacks the
same way other profilers do. A program built without frame pointers
gives stacks that end in `[unknown]` (see [[profiling]]).

**Old documentation is out of date.** Plenty of material, including a
line on the kernel's own verifier page, says the verifier rejects all
loops. That was true
before Linux 5.3.

**"BPF" means two things.** The original BPF, the Berkeley Packet
Filter, only filtered network packets (see [[packet-capture]]). eBPF grew out of it and now does far more, so the
name no longer stands for anything. Kernel code and many tools still
say BPF for both.

**The verifier can reject correct programs.** It has to be conservative,
so a safe program it can't prove safe is refused. Writing eBPF by hand
often means reshaping code until the verifier accepts it.

## What this means when you build

- When you need to see inside a production machine, reach for bcc and
  bpftrace tools before strace. They summarize in the kernel and don't
  stop your process.
- Ask for summaries (counts, histograms) rather than printing every
  event.
- Prefer tracepoints over kprobes for anything you'll keep.
- Know your production kernel version and whether it has BTF; it
  decides which tools work.
- Loading programs needs root or `CAP_BPF`. Decide ahead of time who
  can run tracing on production machines, and how.

## Further reading

- [What is eBPF?](https://ebpf.io/what-is-ebpf/), eBPF.io. The whole picture from the project's own site: hooks, loading, verifier, JIT, maps, helpers, toolchains.
- [bpf(2)](https://man7.org/linux/man-pages/man2/bpf.2.html), Linux man-pages 6.19. The system call itself: maps, program types, privileges, and which kernel added what.
- [eBPF verifier](https://docs.kernel.org/bpf/verifier.html), Linux kernel docs. How the verifier simulates every path and tracks registers.
- [Bounded loops in BPF for the 5.3 kernel](https://lwn.net/Articles/794934/), Marta Rybczyńska, LWN, 2019. How loops got in, the instruction limit, and state pruning.
- [bpftrace One-Liner Tutorial](https://bpftrace.org/tutorial-one-liners), Brendan Gregg, bpftrace project. Twelve one-liners that teach probes, maps and histograms.
- [Off-CPU Analysis](https://www.brendangregg.com/offcpuanalysis.html), Brendan Gregg. eBPF used for a real job, and measured overhead against perf.
- [strace Wow Much Syscall](https://www.brendangregg.com/blog/2014-05-11/strace-wow-much-syscall.html), Brendan Gregg, 2014. Why ptrace-based tracing is slow, for comparison.

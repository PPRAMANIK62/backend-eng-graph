---
id: profiling
title: Profiling
depth: deep
phase: 9
note: >-
  Sampling where the CPU spends time, and where threads wait (on-CPU vs
  off-CPU).
needs: [system-call]
leads_to: [flame-graphs, continuous-profiling, stack-walking]
compare_with: []
---

# Profiling

A profiler tells you where a program's time goes, broken down by
function and call stack. Most profilers work by sampling: many times a
second they look at what each CPU is running and count what they see.
That shows where the CPU time goes. It doesn't show where threads sit
waiting, and for a slow backend service the waiting is often the
answer, so you need both views.

## Start from a slow program

The Go team has a worked example that shows the whole loop. A benchmark
that finds loops in a large graph ran in about 25 seconds. Nobody had to
guess where the time went. They turned on the CPU profiler, and it said
one function, a hash map lookup, was running in about 12% of the
samples, and that the loop-finding code and the functions it called
accounted for 84%. They replaced that map with a slice, which nearly
halved the run time. The next profile
said more than half the time was now allocating memory and collecting
garbage, so they took a memory profile, found what was allocating, and
fixed that. After a few rounds the program ran about ten times faster.

The point of the story is the method. Each round you measure, fix the
biggest thing the profile shows, and measure again. The profile often
points somewhere you wouldn't have looked, like the garbage collector
(see [[garbage-collection]]).

## How a sampling profiler works

A sampling profiler sets a timer. Every time it fires, the profiler
interrupts the program, records the call stack of whatever was running,
and lets it continue. At the end it counts how often each stack came up.

- Go's CPU profiler stops the program about 100 times a second and
  records the program counters on the running goroutine's stack. So
  2,525 samples means it ran for a bit over 25 seconds.
- Linux `perf record` does the same for any program, including the
  kernel. `-F` sets how many samples per second, `-g` records the whole
  call stack instead of just the current function, `-p` attaches to a
  running process, and with no target it samples every CPU.

Two details in how people pick the rate. It's often an odd number like
99 instead of 100, so the samples don't fall in lockstep with other
activity that runs on a timer and give a skewed picture. And it's kept
modest, because saving the samples costs CPU and disk time of its own. The other way to
find where time goes, recording the entry and exit of every function,
is precise but can cost so much that it changes the thing you're
measuring.

Sampling is statistical. A function that shows up in 12% of samples
used about 12% of the CPU time, give or take. What sampling can't tell
you is how many times a function was called. A function can be hot
because each call is slow or because it's called a lot, and the profile
looks the same either way. When several threads run at once, the total
of their samples can also add up to more than the wall-clock time.

## Reading a profile: flat and cumulative

A profile has two numbers per function, and the difference between them
is where most of the reading happens.

- **Flat:** samples where this function itself was running, at the top
  of the stack.
- **Cumulative:** samples where the function was anywhere on the stack,
  running itself or waiting for a function it called.

In the Go example, the map lookup had a flat share of about 12%: its own
code was hot. The loop-finding function had a small flat share but a
cumulative share of 84%: it wasn't slow itself, it was the caller of
everything that was. A big flat number tells you what to speed up. A
big cumulative number with a small flat one tells you which caller to
look inside.

`go tool pprof` shows these as tables (`top`, `top -cum`), as a
per-line listing of the source with samples next to each line (`list`),
and as a call graph. Reading thousands of stacks is easier as a
picture; that's what [[flame-graphs]] are for.

## Stacks need a way to be walked

To record a call stack, the profiler has to walk from the current
function back up through its callers. That's [[stack-walking]], and on
Linux it often breaks: many libraries were built without frame
pointers, so the walk stops early and the profile fills with
`[unknown]`. Fix it before you trust a profile.

## The CPU profile can't see waiting

Now take a different slow service. Requests take 200 ms, but the CPU
profile is nearly empty. That's not a broken profiler. A CPU profiler
only sees threads that are running. A thread blocked in a
[[system-call]] like `read`, waiting for the disk, a lock or another
service, isn't on a CPU, so no sample ever lands on it. Go's
documentation says it plainly: the CPU profile shows where the program
spends time consuming CPU, not sleeping or waiting for I/O.

You can see the gap with `time`. In one example, `tar` ran for 50.8
seconds of wall-clock time but used only 1.0 second of user CPU and 11.6
seconds of kernel CPU. The other 38.2 seconds it was blocked, reading
files from disk. A CPU profile of that run describes about 12.6 seconds and says
nothing about the other 38.

![A thread's timeline: A() runs, calls B(), B() blocks in read() while waiting for the disk, then B() and A() run again. Below it, a CPU profiler's timer ticks at regular intervals: ticks while the thread runs record a sample (stack A, or A;B), ticks while it's blocked find it asleep and record nothing. Below that, an off-CPU tracer notes the time when the thread is switched off the CPU and, when it's back on, adds the blocked time to the stack A;B;read.](img/profiling-on-off-cpu.svg)

*What a CPU profiler and an off-CPU tracer each see of one thread. Adapted from Brendan Gregg, "Off-CPU Analysis".*

So there are two kinds of time. **On-CPU** time is spent running.
**Off-CPU** time is spent blocked: on I/O, locks, timers, paging, or
waiting for a turn on the CPU. Only both together account for all of a
thread's time.

## Measuring off-CPU time

**Trace the scheduler.** Every time a thread is switched off a CPU and
later back on, that's a [[context-switch]]. An off-CPU tracer hooks that
spot in the kernel. When a thread leaves the CPU it notes the time. When
the thread comes back it takes the difference and adds it to the
thread's current stack. One stack per wait is enough, because a
thread's stack can't change while it isn't running. This catches every
kind of wait, for any program, without knowing anything about the
program.

**Sample every thread.** A wall-clock profiler samples all threads on a
timer, running or not, and you keep the samples of the ones that
weren't running.

**Ask the runtime.** Go has this built in. The block profile records
where goroutines block waiting on synchronization, timer channels
included. The mutex profile records contended locks. Both
are off by default; `runtime.SetBlockProfileRate` and
`runtime.SetMutexProfileFraction` turn them on. The goroutine profile
dumps the stack of every goroutine, which shows where everything is
stuck when a service hangs.

Tracing the scheduler has a cost to watch. Context switches can happen
millions of times a second on a busy machine. In one test on an 8-CPU
machine running Linux 4.15 and a MySQL load doing 102,000 context
switches a second, with the CPUs deliberately saturated, `perf` writing
every scheduler event to a file cost 9 to 13% of throughput for 45
seconds to trace 10 seconds. An [[ebpf]] program that summed the stacks
inside the kernel instead cost 6 to 13% for 17 seconds. Those are
numbers from one machine and one workload. The advice that goes with
them holds generally: trace for a tenth of a second first and watch the
cost before tracing longer.

## Where it gets tricky

**A sampler can be biased.** Most Java profilers can only take a stack
when a thread reaches a safepoint, a spot where the JVM can stop it. In
hot compiled code those spots are only at method exits and some loop
edges, so samples pile up there instead of where the CPU was. Research
has found different Java profilers pointing at different hot spots in
the same program. Profilers that don't have this bias exist (perf with
a Java symbol map, or Honest-Profiler).
The general lesson: if a profile blames code that can't be that
expensive, suspect the profiler.

**Off-CPU profiles are full of idle threads.** A server's worker threads
spend most of their time waiting for work. That waiting is harmless,
but it dominates an off-CPU profile. You have to pick out the stacks
that were blocked in the middle of handling a request.

**Off-CPU time includes waiting for a CPU.** When the CPUs are
saturated, a thread that wakes up still waits in the run queue (see [[cpu-scheduler]]) before it
runs, and that counts as off-CPU time. The kernel can also take a
running thread off the CPU when its time slice ends. Its stack then
shows no reason to block at all. If off-CPU stacks look like nonsense,
check whether the CPUs are saturated (the [[use-method]] will say).

**Profiling production is safe but not free.** Go's advice is that
profiling in production is safe, but a CPU profile slows the program a
bit, so measure the cost first. Profile one random replica for some
seconds at a time rather than all of them, and collect one kind of
profile at a time, because they interfere. Doing that all the time,
across a fleet, is [[continuous-profiling]].

**A profile of a noisy run is noisy.** The Go example pinned the CPU
frequency before measuring. Comparing two profiles from runs with
different load, warmup or clock speed can show differences that aren't
in the code (see [[benchmarking-pitfalls]]).

## What this means when you build

- Profile before optimizing. Take a CPU profile first and fix the
  biggest flat entry or the widest caller.
- If latency is high but CPU use is low, the CPU profile won't help.
  Look off-CPU: Go's block and mutex profiles, or an off-CPU tracer.
- Keep frame pointers in everything you ship. Broken stacks turn a
  profile into guesswork.
- Make profiling available in production ahead of time: in Go,
  `net/http/pprof` endpoints, which you can serve on a separate port.
- After a fix, profile again. The next bottleneck is usually somewhere
  else.

## Further reading

- [Profiling Go Programs](https://go.dev/blog/pprof), Russ Cox, the Go Blog, 2011 (updated 2013). A full worked example with `go tool pprof`: how sampling works, flat vs cumulative, memory profiles.
- [Diagnostics](https://go.dev/doc/diagnostics), the Go team. Go's built-in profiles, which are off by default, and how to profile in production.
- [perf-record(1)](https://man7.org/linux/man-pages/man1/perf-record.1.html), Linux perf developers. Sampling frequency, call-graph recording, and the frame pointer, DWARF and LBR unwinders.
- [CPU Flame Graphs](https://www.brendangregg.com/FlameGraphs/cpuflamegraphs.html), Brendan Gregg. How timed sampling works, why rates like 99 Hz are used, and what sampling can't tell you.
- [Off-CPU Analysis](https://www.brendangregg.com/offcpuanalysis.html), Brendan Gregg. On-CPU vs off-CPU time, how to trace blocking, its overhead, and its traps.
- [The Return of the Frame Pointers](https://www.brendangregg.com/blog/2024-03-17/the-return-of-the-frame-pointers.html), Brendan Gregg, 2024. Why stacks broke on Linux, what it costs to fix, and which distributions fixed it.
- [Why (Most) Sampling Java Profilers Are Terrible](http://psy-lob-saw.blogspot.com/2016/02/why-most-sampling-java-profilers-are.html), Nitsan Wakart, 2016. Safepoint bias, worked through with examples where the hot code is known.

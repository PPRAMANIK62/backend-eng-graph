---
id: go-gc-guide
title: A Guide to the Go Garbage Collector
author: The Go team
url: https://go.dev/doc/gc-guide
kind: docs
primary: true
---

## Summary

The Go team's guide to how Go's GC works and how to tune it: where values
live (stack vs heap, escape analysis), tracing mark-sweep, the GC cycle, a
cost model, GOGC, the memory limit (GOMEMLIMIT), latency, finalizers,
virtual memory, and an optimization guide. It says it describes the GC as
of Go 1.19, so it predates the Green Tea marking change in Go 1.26.

## Key claims

- Version stamp. "This document currently describes the garbage collector as of Go 1.19." (Introduction)
- Values whose lifetime the compiler knows go on the goroutine stack; this is cheaper than the GC. "we refer to allocating memory for Go values this way as "stack allocation," because the space is stored on the goroutine stack." (Where Go Values Live)
- Stack allocation is more efficient because the compiler knows when to free. "the Go compiler is able to predetermine when that memory may be freed and emit machine instructions that clean up." (Where Go Values Live)
- Values whose lifetime can't be determined escape to the heap. "Go values whose memory cannot be allocated this way, because the Go compiler cannot determine its lifetime, are said to escape to the heap ." (Where Go Values Live)
- One reason to escape: a size known only at run time, like a slice sized by a variable. "One reason could be that its size is dynamically determined." (Where Go Values Live)
- Escaping is transitive. "if a reference to a Go value is written into another Go value that has already been determined to escape, that value must also escape." (Where Go Values Live)
- Escape rules are not fixed; the analysis changes between releases. "the algorithm itself is fairly sophisticated and changes between Go releases." (Where Go Values Live)
- The GC finds live memory by walking the object graph from roots (locals, globals). "To identify live memory, the GC walks the object graph starting at the program's roots" (Tracing Garbage Collection)
- Strings, slices, maps, channels and interfaces hold pointers the GC must trace. "Strings, slices, channels, maps, and interface values all contain memory addresses that the GC must trace." (Tracing Garbage Collection)
- Go uses mark-sweep: mark live values, then sweep unmarked memory for reuse. "Go's GC uses the mark-sweep technique" (Tracing Garbage Collection)
- Go's GC does not move objects. "Go has a non-moving GC." (Tracing Garbage Collection)
- The cycle rotates through sweeping, off, and marking. "The GC continuously rotates through these three phases of sweeping, off, and marking" (The GC Cycle)
- GC costs only memory and CPU time. "The GC involves only two resources: physical memory, and CPU time." (Understanding Costs)
- CPU cost per cycle scales with the live heap. "GC CPU time for cycle N = Fixed CPU time cost per cycle + average CPU time cost per byte * live heap memory found in cycle N" (Understanding Costs)
- The GC walks only the live heap. "Recall that the GC only needs to walk the live heap, not the whole heap." (Understanding Costs)
- GOGC sets the target heap: live heap plus roots times GOGC/100. "Target heap memory = Live heap + (Live heap + GC roots) * GOGC / 100" (GOGC)
- Example: 8 MiB live heap, 1 MiB stacks, 1 MiB globals, GOGC=100 gives 10 MiB of new allocation before the next cycle; GOGC=50 gives 5 MiB; 200 gives 20 MiB. "With a GOGC value of 200, it'll be 200%, or 20 MiB." (GOGC)
- Doubling GOGC doubles heap overhead and roughly halves GC CPU. "doubling GOGC will double heap memory overheads and roughly halve GC CPU cost" (GOGC)
- GOGC=off or SetGCPercent(-1) turns the GC off. "GOGC=off or calling SetGCPercent(-1)" (GOGC)
- Minimum total heap is 4 MiB. "the Go GC has a minimum total heap size of 4 MiB" (GOGC, note)
- Until Go 1.19 GOGC was the only knob; the memory limit came then, via GOMEMLIMIT or SetMemoryLimit. "The memory limit may be configured either via the GOMEMLIMIT" (Memory limit)
- Constant GC cycles near the limit are called thrashing. "constant GC cycles, is called thrashing ." (Memory limit)
- The GC caps its own CPU at roughly 50% over a window to avoid thrashing. "This limit is currently set at roughly 50%, with a 2 * GOMAXPROCS CPU-second window." (Memory limit)
- Do use the memory limit when the Go program has the resources to itself, like a web service in a container with fixed memory; leave 5-10% headroom. "A good example is the deployment of a web service into containers with a fixed amount of available memory." (Memory limit, suggested uses)
- Near the limit the GC runs more often to stay under it. "the GC runs more frequently to" (Memory limit, example)
- Don't use the memory limit to dodge OOM when already near the environment's limit; it trades OOM for slowdown. "This effectively replaces an out-of-memory risk with a risk of severe application slowdown" (Memory limit, suggested uses)
- Go's GC is mostly concurrent to cut latency. "The Go GC, however, is not fully stop-the-world and does most of its work concurrently with the application." (Latency)
- Global pauses are not proportional to heap size. "the Go GC avoids making the length of any global application pauses proportional to the size of the heap" (Latency)
- Concurrent collection often costs throughput. "in practice it often leads to a design with lower throughput than an equivalent stop-the-world garbage collector." (Latency)
- Most GC cost is during mark, so fewer cycles means better latency. "reducing GC frequency may also lead to latency improvements ." (Latency)
- Latency sources: brief STW pauses at phase changes, the GC taking 25% of CPU during mark, goroutines assisting under high allocation rate, extra work on pointer writes, suspending goroutines to scan their roots. "Scheduling delays because the GC takes 25% of CPU resources when in the mark phase," (Latency)
- Assists: goroutines pay GC work when allocating fast. "User goroutines assisting the GC in response to a high allocation rate," (Latency)
- The runtime never unmaps virtual memory; it releases the physical memory behind it. "The Go runtime never deletes virtual memory that it maps." (A Note About Virtual Memory)
- On 64-bit, runtime structures reserve about 700 MiB of virtual memory. "these typically have a minimum virtual memory footprint of about 700 MiB." (A Note About Virtual Memory)
- In CPU profiles, runtime.mallocgc over 15% means lots of allocation; runtime.gcAssistAlloc over 5% means allocation is outpacing the GC. "A large amount of cumulative time spent here (>5%) indicates that the application is likely out-pacing the GC" (Optimization Guide, CPU profiles)
- In a heap profile, alloc_space shows allocation hot spots. "`alloc_space` is typically the most useful view as it directly corresponds to the allocation rate." (Optimization Guide, Heap profiles)
- Once memory is unreachable it stays unreachable (one exception, covered under finalizers and weak pointers). "once memory becomes unreachable, it stays unreachable." (Tracing Garbage Collection)
- runtime.gcBgMarkWorker in a CPU profile is the baseline cost of marking. "It represents a baseline for how much time the application spends marking and scanning." (Optimization Guide, CPU profiles)
- Removing pointers from data structures that don't need them cuts the GC's work. "it may be advantageous to eliminate pointers from data structures that do not strictly need them" (Optimization Guide, Implementation-specific optimizations)
- Allocation rate is a major driver of GC frequency. "the allocation rate of a Go program is a major factor in GC frequency" (Eliminating heap allocations)
- `go build -gcflags=-m=3` prints escape analysis decisions. "$ go build -gcflags=-m=3 [package]" (Escape analysis)

## Visuals worth redrawing

- The interactive GOGC and memory-limit graphs (heap size over time vs GC CPU). Redraw one static frame.

## My notes

- The guide doesn't mention the forced 2-minute GC that Discord hit.
- Check against the Green Tea post: GOGC/GOMEMLIMIT still apply; marking internals changed in 1.26.

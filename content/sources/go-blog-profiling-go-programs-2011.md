---
id: go-blog-profiling-go-programs-2011
title: Profiling Go Programs
author: Russ Cox (updated by Shenghou Ma), the Go Blog
url: https://go.dev/blog/pprof
kind: blog
primary: true
---

## Summary

The Go team's worked example of profiling (written 2011, updated 2013):
a slow loop-finding benchmark is made about ten times faster by reading
CPU and memory profiles with `go tool pprof`. It explains how Go's CPU
profiler samples, what the flat and cumulative columns mean, and how
following the profile leads from a hot map lookup to the garbage
collector to the code that allocates.

## Key claims

- How Go's CPU profiler samples. "When CPU profiling is enabled, the Go program stops about 100 times per second and records a sample consisting of the program counters on the currently executing goroutine’s stack." (after the first top10 listing)
- Sample count tells you run time: 2525 samples means a bit over 25 seconds. "The profile has 2525 samples, so it was running for a bit over 25 seconds." (same place)
- Flat columns: samples where the function itself was running. "The first two columns show the number of samples in which the function was running (as opposed to waiting for a called function to return), as a raw count and as a percentage of total samples." (same place)
- Cumulative columns: samples where the function was running or waiting for a callee. "The fourth and fifth columns show the number of samples in which the function appeared (either running or waiting for a called function to return)" (same place)
- In the example, `runtime.mapaccess1_fast64` was running in 298 samples (11.8%), and `main.FindLoops` appeared in 84.1% of samples cumulatively. (first top10 listing)
- Result of following the profiles: an order of magnitude faster. "we can make the Go loop finding program run an order of magnitude faster and use 6x less memory." (intro)
- Starting point: the Go version ran in 25.20 s. "The Go program runs in 25.20 seconds and uses 1302 MB of memory." (setup)
- First fix: the profile pointed at map lookups, so a map was replaced with a slice, nearly halving run time. "Changing number from a map to a slice requires editing seven lines in the program and cut its run time by nearly a factor of two" (after the list DFS output)
- After fixing the hot spot, most time was allocating and collecting garbage. "runtime.mallocgc, which both allocates and runs periodic garbage collections, accounts for 54.2% of the time" (second profile)
- Heap profiles sample too: about one block per half megabyte allocated. "the memory profiler only records information for approximately one block per half megabyte allocated" (memory profile section)
- The profile needs StopCPUProfile to flush before exit. "The profiler requires a final call to StopCPUProfile to flush any pending writes to the file before the program exits" (enabling profiling)
- `list` shows samples per source line, flat and cumulative. "The first three columns are the number of samples taken while running that line, the number of samples taken while running that line or in code called from that line, and the line number in the file." (list command)
- They pinned the CPU frequency for measurement. (setup: scaling governor set to performance)
- Sort by cumulative with -cum. "To sort by the fourth and fifth columns, use the -cum (for cumulative) flag" (first profile)
- The web command draws the call graph. "The web command writes a graph of the profile data in SVG format and opens it in a web browser." (call graph)

## Visuals worth redrawing

- The call graph from the `web` command (boxes sized by samples). Not
  needed; flame graphs cover this.

## My notes

- The sample counts are from the blog's 2013 machine and Go build; use
  them only as an illustration of how to read pprof, with that context.

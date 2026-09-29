---
id: go-diagnostics
title: Diagnostics (Go documentation)
author: The Go team
url: https://go.dev/doc/diagnostics
kind: docs
primary: true
---

## Summary

The Go documentation page on diagnosing Go programs: profiling, tracing,
debugging and runtime statistics. The profiling part lists the built-in
profiles (cpu, heap, threadcreate, goroutine, block, mutex), says which
are off by default, and gives advice on profiling in production.

## Key claims

- The CPU profile only sees time spent running. "cpu: CPU profile determines where a program spends its time while actively consuming CPU cycles (as opposed to while sleeping or waiting for I/O)." (Profiling)
- Block profile: where goroutines wait on synchronization; off by default. "block: Block profile shows where goroutines block waiting on synchronization primitives (including timer channels)." (Profiling)
- Turning it on. "Block profile is not enabled by default; use runtime.SetBlockProfileRate to enable it." (Profiling)
- Mutex profile: lock contention; off by default. "Mutex profile is not enabled by default, see runtime.SetMutexProfileFraction to enable it." (Profiling)
- Goroutine profile: stacks of all current goroutines. "goroutine: Goroutine profile reports the stack traces of all current goroutines." (Profiling)
- Heap profile: allocation samples. "heap: Heap profile reports memory allocation samples; used to monitor current and historical memory usage, and to check for memory leaks." (Profiling)
- Profiles are collected in tests or from `net/http/pprof` endpoints. "The profiling data can be collected during testing via go test or endpoints made available from the net/http/pprof package." (Profiling)
- Linux perf works on Go programs and sees cgo and kernel code too. "Perf can profile and unwind cgo/SWIG code and kernel, so it can be useful to get insights into native/kernel performance bottlenecks." (What other profilers can I use)
- Profiling production is safe but not free. "It is safe to profile programs in production, but enabling some profiles (e.g. the CPU profile) adds cost." (Can I profile my production services?)
- Profile a random replica periodically. "Especially in a system with many replicas of a single process, selecting a random replica periodically is a safe option." (Can I profile my production services?)
- One profile at a time. "Collection of profiles can interfere with each other, so it is recommended to collect only a single profile at a time." (Can I profile my production services?)
- pprof supports flame graphs. "The upstream pprof has support for flame graphs." (What are the best ways to visualize)
- The pprof handlers can be served on another path and port. "Can I serve the profiler handlers (/debug/pprof/...) on a different path and port? Yes." (Profiling)

## Visuals worth redrawing

None.

## My notes

- Doesn't give a number for CPU profiling overhead; says to measure it.

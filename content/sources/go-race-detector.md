---
id: go-race-detector
title: Data Race Detector
author: The Go Authors
url: https://go.dev/doc/articles/race_detector
kind: docs
primary: true
---

## Summary

Go's guide to its built-in race detector: what a data race is, the
`-race` flag, how to read a report, the `GORACE` options, typical races
it catches, which platforms it runs on and what it costs. Read on
go.dev when Go 1.27 was current.

## Key claims

- A data race is two goroutines touching one variable at the same time, at least one writing. "A data race occurs when two goroutines access the same variable concurrently and at least one of the accesses is a write." (Introduction)
- The first example, two unsynchronized writes to one map, is a race that "can lead to crashes and memory corruption". "Here is an example of a data race that can lead to crashes and memory corruption:" (Introduction)
- It's turned on with a flag on the go command. "To use it, add the -race flag to the go command" (Usage)
- A report has stacks for both conflicting accesses and where the goroutines were created. "The report contains stack traces for conflicting accesses, as well as stacks where the involved goroutines were created." (Report Format)
- The example report shows a read by one goroutine and the "Previous write" by another. "Previous write by goroutine 184" (Report Format, example)
- Default exit code after a race is 66. "exitcode (default 66): The exit status to use when exiting after a detected race." (Options)
- By default it keeps running after the first race; halt_on_error changes that. "halt_on_error (default 0): Controls whether the program exits after reporting first data race." (Options)
- Per-goroutine history is limited; a too-small history gives "failed to restore the stack". "The per-goroutine memory access history is 32K * 2**history_size elements." (Options, history_size)
- Building with -race sets the `race` build tag, used to exclude tests. "When you build with -race flag, the go command defines additional build tag race." (Excluding Tests)
- It only finds races that happen while the program runs. "The race detector only finds races that happen at runtime, so it can't find races in code paths that are not executed." (How To Use)
- So run a -race binary under realistic load too. "If your tests have incomplete coverage, you may find more races by running a binary built with -race under a realistic workload." (How To Use)
- Races on plain ints and bools matter too. "Even such \"innocent\" data races can lead to hard-to-debug problems caused by non-atomicity of the memory accesses, interference with compiler optimizations, or reordering issues accessing processor memory ." (Primitive unprotected variable)
- It reasons in happens-before terms; an unsynchronized send and close on a channel is a race. "The race detector cannot derive the happens before relation // for the following send and close operations." (Unsynchronized send and close operations, code comment; `//` are comment markers)
- A channel send happens before the matching receive completes, which is what orders the accesses around it. "According to the Go memory model, a send on a channel happens before the corresponding receive from that channel completes." (Unsynchronized send and close operations)
- Fixes for a racy plain variable: a channel, a mutex, or sync/atomic. "A typical fix for this race is to use a channel or a mutex." (Primitive unprotected variable)
- The loop-counter example: goroutines reading the shared i "typically" print 55555, not 01234. "(This program typically prints 55555, not 01234.)" (Race on loop counter)
- Concurrent map reads and writes are unsafe. "Concurrent reads and writes of the same map are not safe" (Unprotected global variable)
- It needs cgo, and a C compiler outside Darwin. "The race detector requires cgo to be enabled, and on non-Darwin systems requires an installed C compiler." (Requirements)
- Supported platforms include linux/amd64 and linux/arm64. (Requirements)
- Cost: memory 5-10x, time 2-20x. "for a typical program, memory usage may increase by 5-10x and execution time by 2-20x." (Runtime Overhead)

## Visuals worth redrawing

None.

## My notes

- The page doesn't say how it works inside or name ThreadSanitizer.
  That link is in go-runtime-race-readme.

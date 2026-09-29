---
id: race-detector
title: Race detectors
depth: short
phase: 4
note: >-
  Tools like Go's -race and ThreadSanitizer that watch a running program
  for data races. They only see races that happen in the run. The phase
  4 build's harness.
needs: [race-condition, memory-model]
leads_to: []
compare_with: [history-checking, model-based-testing]
---

# Race detectors

A race detector watches a running program and reports when two [[thread|threads]]
touch the same memory at the same time without anything ordering them,
and at least one of them writes. Go has one built in (`go test -race`);
C and C++ get the same engine as ThreadSanitizer. It's the cheapest way
to find a [[race-condition|data race]] before production does, with one
big limit: it only sees races in code that actually ran.

## Turning it on

In Go you add a flag: `go test -race`, `go run -race`, `go build
-race`. In C or C++ you compile and link with `-fsanitize=thread`.
Either way, the program runs as usual until two accesses conflict, and
then it prints a report: the stack of the access that just happened,
the stack of the earlier conflicting one ("Previous write by goroutine
184"), and where each goroutine was created.

Take the classic Go example. A goroutine writes `m["1"]` while `main`
writes `m["2"]` to the same map. Nothing orders the two writes, so the
detector reports a race, even on runs where the program happens to
print the right answer.

## How it knows two accesses weren't ordered

The detector doesn't look for accesses that were "close in time". It
asks whether one access **happens before** the other, in the sense of
the [[memory-model]]: whether some synchronization (a lock handed over,
a channel send and receive, an atomic) forces an order between them.

![Two panels. Left: goroutine A writes x = 1, goroutine B later prints x, with nothing between them; the detector reports a data race. Right: A writes x = 1 then sends on channel c; B receives from c then prints x; the send happens before the receive completes, so the write is ordered before the read and nothing is reported.](img/race-detector-happens-before.svg)

*The same write and read, reported on the left and quiet on the right, because the channel orders them.*

It does this in two parts:

1. **Instrumentation.** The compiler puts a call in front of every
   memory access that it can't prove is safe, something like
   `__tsan_read4(addr)`. Atomic operations get their own calls, and
   the runtime also tracks synchronization such as channel operations,
   so it can tell what happens before what.
2. **Shadow memory.** For each aligned 8-byte word of your program's
   memory, the runtime keeps a few "shadow words" (2, 4 or 8), each
   recording one recent access: which thread, that thread's logical
   clock, and whether it was a read or a write. On every access it
   compares the new one against the stored ones. Different threads,
   overlapping bytes, and no happens-before between them: that's a
   race, and it prints the report.

Go's race runtime is ThreadSanitizer: the Go source tree ships
prebuilt copies of it, built from LLVM.

## What it costs

A lot, which is why nobody ships it. For a typical Go program, memory
goes up 5 to 10 times and run time 2 to 20 times. For C and C++ it's
about 5 to 15 times slower with 5 to 10 times the memory, and the
runtime isn't meant to be linked into production binaries. Go's
`-race` also needs cgo, and a C compiler everywhere but macOS.

## Where it gets tricky

**No report doesn't mean no race.** The detector only checks accesses
that happen during the run. A race in a code path your tests never
take, or between two goroutines that never overlap in your test, stays
invisible. So run a `-race` build under realistic load as well as the
tests. Clang's ThreadSanitizer has an opt-in
"adaptive delay" mode that adds small delays at synchronization points
to shake out more interleavings.

**But what it reports is real.** Because it tracks happens-before
rather than guessing from timing, a report means the two accesses
really weren't ordered in that run. The exceptions come from code it
can't see: in C and C++, a library built without `-fsanitize=thread`
can make it miss races or report false ones.

**It can forget.** Each 8-byte word only has room for a few recorded
accesses. When they're full, a random one is thrown out, so there's a
small chance of missing a race. Go's `history_size` option controls how
much per-goroutine history is kept for the stack traces in reports.

**"Harmless" races aren't.** A race on a plain `int` or `bool` looks
innocent, but the compiler may optimize the access away or reorder it,
and the processor may reorder it too. Fix it with a [[mutex]], a
[[message-passing|channel]] or `sync/atomic`. A race on a map can corrupt it or crash the program.

**It finds data races, not logic races.** Two goroutines that each
lock correctly but check-then-act across two separate critical
sections have a [[race-condition]] the detector can't see: every
access is ordered, the result is still wrong.

## What this means when you build

- Run every test with `-race` in CI. It's the phase 4 lab's harness:
  every test run of the server goes through the race detector.
- Tests with real concurrency find more. A test where the goroutines
  never overlap proves nothing.
- Also run a `-race` build under load for a while, with the load
  generator checking replies.
- Treat every report as a bug. Don't silence one because the output
  looked right.

## Further reading

- [Data Race Detector](https://go.dev/doc/articles/race_detector), The Go Authors. How to use `-race`, read a report, and the typical races it catches, with its cost.
- [ThreadSanitizer](https://clang.llvm.org/docs/ThreadSanitizer.html), LLVM/Clang docs. The C and C++ side: flags, overhead, limits and adaptive delay.
- [ThreadSanitizerAlgorithm](https://github.com/google/sanitizers/wiki/ThreadSanitizerAlgorithm), Google sanitizers wiki. How instrumentation and shadow words find a race.
- [src/runtime/race/README](https://github.com/golang/go/blob/master/src/runtime/race/README), The Go Authors. Shows Go's race runtime is ThreadSanitizer from LLVM.

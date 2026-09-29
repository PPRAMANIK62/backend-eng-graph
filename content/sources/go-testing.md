---
id: go-testing
title: testing package documentation (benchmarks)
author: The Go Authors
url: https://pkg.go.dev/testing
kind: docs
primary: true
---

## Summary

Go's standard testing package. Read for its benchmark support: the
B.Loop loop added in Go 1.24, what is timed, and how the loop stops the
compiler from optimizing away the code being measured.

## Key claims

- B.Loop exists since Go 1.24. "func (*B) Loop ¶ added in go1.24.0" (func (*B) Loop)
- Only the loop body is timed. "Only the body of the loop is timed, so benchmarks may do expensive setup before calling b.Loop, which will not be counted toward the benchmark measurement" (Benchmarks)
- Loop keeps results alive so the compiler can't delete the work. "arguments to and results from function calls and assigned variables within the loop are kept alive, preventing the compiler from fully optimizing away the loop body." (func (*B) Loop)
- Implemented as a compiler transformation. "Currently, this is implemented as a compiler transformation that wraps such variables with a runtime.KeepAlive intrinsic call." (func (*B) Loop)
- The old b.N style needs manual timer resets. "If a benchmark needs some expensive setup before running, the timer should be explicitly reset" (b.N-style benchmarks)
- Prefer Loop. "New benchmarks should prefer using B.Loop, which is more robust and more efficient." (b.N-style benchmarks)
- Output meaning. "means that the body of the loop ran 68453040 times at a speed of 17.8 ns per loop." (Benchmarks)
- benchstat for comparisons. "golang.org/x/perf/cmd/benchstat performs statistically robust A/B comparisons." (Benchmarks)

## Visuals worth redrawing

None.

## My notes

- Pinned to the go1.24+ docs.

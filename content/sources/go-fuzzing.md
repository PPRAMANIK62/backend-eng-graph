---
id: go-fuzzing
title: Go Fuzzing
author: The Go Authors
url: https://go.dev/doc/security/fuzz/
kind: docs
primary: true
---

## Summary

The Go documentation for native fuzz tests, part of the toolchain since
Go 1.18. How to write a fuzz test, how coverage guidance decides
which inputs to keep, what counts as a failure, and how failing inputs
become regression tests.

## Key claims

- Native fuzzing since Go 1.18. "Go supports fuzzing in its standard toolchain beginning in Go 1.18." (top)
- What fuzzing is. "Fuzzing is a type of automated testing which continuously manipulates inputs to a program to find bugs." (Overview)
- Go's fuzzer is coverage-guided. "Go fuzzing uses coverage guidance to intelligently walk through the code being fuzzed to find and report failures to the user." (Overview)
- An input is kept ("interesting") when it reaches code the corpus didn't. "For an input to be “interesting”, it must expand the code coverage beyond what the existing generated corpus can reach." (Command line output)
- The seed corpus is `f.Add` calls plus files in `testdata/fuzz/<Name>`, and runs on every plain `go test`. (Glossary, seed corpus)
- The docs' example run with 8 workers shows about 108,000 to 120,000 executions a second. "execs: 325017 (108336/sec)" (Command line output, example)
- Coverage keeps growing, then tapers. "You should expect to see the “new interesting” number taper off over time" (Command line output)
- Failures: a panic, `t.Fail`/`t.Error`/`t.Fatal`, `os.Exit` or stack overflow, or an input taking too long. "Currently, the timeout for an execution of a fuzz target is 1 second." (Failing input)
- Failing inputs are minimized. "the fuzzing engine will attempt to minimize the input to the smallest possible and most human readable value which will still produce an error." (Failing input)
- The failing input is written to the seed corpus and becomes a regression test. (Failing input)
- Targets should be fast, deterministic and free of global state. "Fuzz targets should be fast and deterministic so the fuzzing engine can work efficiently, and new failures and code coverage can be easily reproduced." (Suggestions)
- Fuzzing runs until it fails or you stop it; `-fuzztime` bounds it. "It is very possible that an execution of fuzzing could run indefinitely if it doesn’t find any errors." (Running fuzz tests)
- Coverage instrumentation only on AMD64 and ARM64. "(currently AMD64 and ARM64)" (Running fuzz tests, note)
- Fuzzing arguments are limited to strings, byte slices, integers, floats and bools. (Requirements)

Added for `fuzzing` audit:

- Targets run in parallel and in no fixed order, so no state between calls. "Since the fuzz target is invoked in parallel across multiple workers and in nondeterministic order, the state of a fuzz target should not persist past the end of each call" (Suggestions)

## Visuals worth redrawing

None.

## My notes

- The docs don't cover differential fuzzing; that's a pattern you write
  inside the target (call two implementations, compare).

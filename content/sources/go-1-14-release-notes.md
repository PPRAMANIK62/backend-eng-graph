---
id: go-1-14-release-notes
title: Go 1.14 Release Notes
author: The Go Authors
url: https://go.dev/doc/go1.14
kind: docs
primary: true
---

## Summary

Release notes for Go 1.14 (2020). The runtime section announces
asynchronous preemption of goroutines, the change that stopped tight
loops without function calls from hogging a thread.

## Key claims

- Goroutines became asynchronously preemptible in Go 1.14. "Goroutines are now asynchronously preemptible." (Runtime)
- Before that, loops without function calls could deadlock the scheduler or delay GC. "As a result, loops without function calls no longer potentially deadlock the scheduler or significantly delay garbage collection." (Runtime)
- Not every platform got it. "This is supported on all platforms except windows/arm, darwin/arm, js/wasm, and plan9/*." (Runtime)
- It's done with signals, so programs see more of them and more slow syscalls fail with EINTR. "programs built with Go 1.14 will receive more signals than programs built with earlier releases." (Runtime)
- Code making raw syscalls must retry on EINTR. "will see more slow system calls fail with EINTR errors." (Runtime)

## Visuals worth redrawing

None.

## My notes

- The mechanism (signal, check for an async safe point, inject a call
  to asyncPreempt) is described in runtime/preempt.go (go-runtime-source).

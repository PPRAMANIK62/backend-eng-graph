---
id: clang-threadsanitizer
title: ThreadSanitizer (Clang documentation)
author: The Clang Team (LLVM Project)
url: https://clang.llvm.org/docs/ThreadSanitizer.html
kind: docs
primary: true
---

## Summary

Clang's page for ThreadSanitizer (TSan), the data race detector for C
and C++: how to turn it on, its cost, its limits, and an optional
"adaptive delay" mode that perturbs scheduling to expose more races.
Read from the in-progress (main branch) docs when this was written.

## Key claims

- TSan is compiler instrumentation plus a runtime library. "It consists of a compiler instrumentation module and a run-time library." (Introduction)
- Typical cost. "Typical slowdown introduced by ThreadSanitizer is about 5x-15x. Typical memory overhead introduced by ThreadSanitizer is about 5x-10x." (Introduction)
- Turned on with a compiler flag. "Simply compile and link your program with -fsanitize=thread." (Usage)
- All code should be instrumented; uninstrumented libraries cause misses or false reports. "If some code (such as pre-compiled dynamic libraries) is not compiled with the flag, TSan may fail to detect races or may report false positives." (Limitations)
- Memory at default settings is 5x plus 1 MB per thread. "At the default settings the memory overhead is 5x plus 1Mb per each thread." (Limitations)
- Not for production binaries. "ThreadSanitizer is a bug detection tool and its runtime is not meant to be linked against production executables." (Security Considerations)
- Still labelled beta. "ThreadSanitizer is in beta stage." (Current Status)
- Adaptive delay injects delays at synchronization points to try more interleavings. "Adaptive Delay is an optional ThreadSanitizer feature that injects delays at synchronization points to explore novel thread interleavings and increase the likelihood of exposing data races." (Adaptive Delay)
- It's off by default. "Adaptive delay is disabled by default." (Enabling Adaptive Delay)
- Races between atomic and plain accesses are reported by default (report_atomic_races, default true). (Runtime flags)

## Visuals worth redrawing

None.

## My notes

- Supported on Linux aarch64 and x86_64 among others.

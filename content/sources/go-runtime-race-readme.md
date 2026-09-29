---
id: go-runtime-race-readme
title: src/runtime/race/README
author: The Go Authors
url: https://github.com/golang/go/blob/master/src/runtime/race/README
kind: code
primary: true
---

## Summary

The README in the Go source tree for the race detector's runtime. It
says the runtime is ThreadSanitizer from LLVM, shipped as prebuilt
`.syso` object files per platform, each built from a pinned LLVM
commit. Read on the master branch (raw file) when Go 1.27 was current.

## Key claims

- Go's race runtime is based on ThreadSanitizer. "It is based on ThreadSanitizer race detector, that is currently a part of the LLVM project" (first lines)
- The package holds the runtime library. "runtime/race package contains the data race detector runtime library." (first line)
- It ships as prebuilt .syso files per OS and architecture, each "built with LLVM" at a named commit, some with Go-side patches. (list of .syso files)

## Visuals worth redrawing

None.

## My notes

- So Go's -race and Clang's -fsanitize=thread share one runtime; the
  compilers differ in how they insert the instrumentation calls.
  (The second half is our inference.)

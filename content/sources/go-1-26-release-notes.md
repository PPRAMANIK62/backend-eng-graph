---
id: go-1-26-release-notes
title: Go 1.26 Release Notes
author: The Go team
url: https://go.dev/doc/go1.26
kind: docs
primary: true
---

## Summary

Release notes for Go 1.26 (2026). The Runtime section makes
Green Tea the default GC. Release year 2026 from go.dev/doc/devel/release.

## Key claims

- Go 1.26 arrived in 2026. "The latest Go release, version 1.26, arrives in …" (Introduction)
- Green Tea is on by default in 1.26. "is now enabled by default after incorporating feedback." (Runtime, New garbage collector)
- It improves marking and scanning of small objects through locality and CPU scalability. "improves the performance of marking and scanning small objects through better locality and CPU scalability." (Runtime)
- Expected 10–40% less GC overhead in GC-heavy programs. "we expect somewhere between a 10–40% reduction in garbage collection overhead" (Runtime)
- About 10% more on Intel Ice Lake / AMD Zen 4 and newer, using vector instructions. "the garbage collector now leverages vector instructions for scanning small objects when possible." (Runtime)
- Opt out at build time; the opt-out is expected to go away in 1.27. "The new garbage collector may be disabled by setting GOEXPERIMENT=nogreenteagc at build time." (Runtime)

## Visuals worth redrawing

None.

## My notes

- go.dev/doc/devel/release lists go1.27.0 as released in 2026; didn't check whether 1.27 removed the opt-out.

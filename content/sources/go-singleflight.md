---
id: go-singleflight
title: singleflight package (golang.org/x/sync/singleflight)
author: The Go Authors
url: https://pkg.go.dev/golang.org/x/sync/singleflight
kind: code
primary: true
---

## Summary

Go's package for request coalescing inside one process: concurrent
calls with the same key share one execution and its result. Read at
golang.org/x/sync v0.23.0.

## Key claims

- What it is. "Package singleflight provides a duplicate function call suppression mechanism." (Overview)
- Do runs one call per key at a time; duplicates wait and share the result. "Do executes and returns the results of the given function, making sure that only one execution is in-flight for a given key at a time." (func (*Group) Do)
- Duplicates get the same result, flagged as shared. "If a duplicate comes in, the duplicate caller waits for the original to complete and receives the same results." (func (*Group) Do)
- Forget makes later calls run fresh instead of waiting. "Forget tells the singleflight to forget about a key." (func (*Group) Forget)

## Visuals worth redrawing

None.

## My notes

- Works only within one process; a fleet of N servers still sends up
  to N loads for the same key.

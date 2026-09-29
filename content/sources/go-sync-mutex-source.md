---
id: go-sync-mutex-source
title: "src/internal/sync/mutex.go (Go's Mutex implementation)"
author: The Go Authors
url: https://raw.githubusercontent.com/golang/go/master/src/internal/sync/mutex.go
kind: code
primary: true
---

## Summary

The implementation behind sync.Mutex (in internal/sync, a file with a
2024 copyright line, read on the master branch). A 32-bit state word plus a semaphore. The
fast path is one compare-and-swap; the slow path spins briefly, then
queues. A comment explains the two modes, normal and starvation.

## Key claims

- The struct is a state word and a semaphore: `state int32`, `sema uint32`. (type Mutex)
- Fast path: grab an unlocked mutex with one CAS. "Fast path: grab unlocked mutex." followed by `atomic.CompareAndSwapInt32(&m.state, 0, mutexLocked)` (Lock)
- Normal mode: waiters queue FIFO, but a woken waiter competes with new arrivals and often loses. "New arriving goroutines have an advantage -- they are already running on CPU and there can be lots of them, so a woken up waiter has good chances of losing." (comment "Mutex fairness")
- After 1 ms without the lock, a waiter switches the mutex to starvation mode. "If a waiter fails to acquire the mutex for more than 1ms, it switches mutex to the starvation mode." (comment "Mutex fairness")
- Starvation mode hands the mutex straight to the waiter at the front. "In starvation mode ownership of the mutex is directly handed off from the unlocking goroutine to the waiter at the front of the queue." (comment "Mutex fairness")
- Why both. "Normal mode has considerably better performance as a goroutine can acquire a mutex several times in a row even if there are blocked waiters." and "Starvation mode is important to prevent pathological cases of tail latency." (comment "Mutex fairness")
- The slow path spins while the mutex is locked in normal mode and runtime_canSpin allows it. "Active spinning makes sense." (lockSlow)
- `starvationThresholdNs = 1e6` (constants)

## Visuals worth redrawing

None.

## My notes

- The spin-then-sleep shape is OSTEP's "two-phase lock" (ostep-locks 28.16).

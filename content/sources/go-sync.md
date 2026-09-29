---
id: go-sync
title: "sync package documentation"
author: The Go Authors
url: https://pkg.go.dev/sync
kind: docs
primary: true
---

## Summary

Docs for Go's sync package (read at go1.27.1): Mutex, RWMutex, Once,
WaitGroup, Cond, Map, Pool. Each type states its guarantees in terms of
the Go memory model.

## Key claims

- Most of sync is low level; prefer channels for higher-level work. "Higher-level synchronization is better done via channels and communication." (package overview)
- Don't copy them. "Values containing the types defined in this package should not be copied." (package overview)
- Zero value is unlocked. "A Mutex is a mutual exclusion lock. The zero value for a Mutex is an unlocked mutex." (type Mutex)
- A Mutex can't be copied once used. "A Mutex must not be copied after first use." (type Mutex)
- Memory model: "the n'th call to Mutex.Unlock “synchronizes before” the m'th call to Mutex.Lock for any n < m." (type Mutex)
- Lock blocks until free. "If the lock is already in use, the calling goroutine blocks until the mutex is available." (Mutex.Lock)
- TryLock exists (Go 1.18) but is rarely right. "use of TryLock is often a sign of a deeper problem in a particular use of mutexes." (Mutex.TryLock)
- Unlocking an unlocked mutex is a run-time error. "It is a run-time error if m is not locked on entry to Unlock." (Mutex.Unlock)
- Not tied to a goroutine. "A locked Mutex is not associated with a particular goroutine." (Mutex.Unlock)
- RWMutex: many readers or one writer. "The lock can be held by an arbitrary number of readers or a single writer." (type RWMutex)
- A waiting writer blocks new readers, so the writer gets its turn. "concurrent calls to RWMutex.RLock will block until the writer has acquired (and released) the lock, to ensure that the lock eventually becomes available to the writer." (type RWMutex)
- That rules out recursive read-locking. "Note that this prohibits recursive read-locking." (type RWMutex)
- No upgrade from read lock to write lock, or downgrade. (type RWMutex)
- Cond: for simple cases channels are better. "For many simple use cases, users will be better off using channels than a Cond" (type Cond)

## Visuals worth redrawing

None.

## My notes

- The implementation (fast path, spinning, starvation mode) is in
  go-sync-mutex-source.

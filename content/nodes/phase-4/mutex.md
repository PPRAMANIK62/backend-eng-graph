---
id: mutex
title: Mutexes
depth: short
phase: 4
note: >-
  A lock only one thread can hold at a time.
needs: [race-condition]
leads_to: [deadlock, latches]
compare_with: [message-passing, lock-free-structures, atomics]
---

# Mutexes

A mutex (short for mutual exclusion) is a lock that only one [[thread]] can
hold at a time. You put `Lock` and `Unlock` around the code that touches
shared data, the critical section, and that code then behaves as if it
were a single [[atomics|atomic]] step. It's the everyday fix for a
[[race-condition]].

## Lock, do the work, unlock

Take the shared counter that loses increments. With a mutex, in Go:

```go
mu.Lock()
counter = counter + 1
mu.Unlock()
```

A lock is just a variable with two states, free or held. `Lock` on a
free mutex takes it and returns. `Lock` on a held mutex doesn't return
until the holder calls `Unlock`. So at most one thread is ever between
the two calls, and the load, add and store can't interleave with
another thread's.

A mutex also makes the protected writes visible. Everything a thread
wrote before `Unlock` is seen by the next thread that gets through
`Lock`. That ordering guarantee is part of the [[memory-model]], and
it's why data guarded by a mutex needs no other synchronization.

One lock can guard everything (coarse-grained), or each data structure
can have its own (fine-grained). More locks let more threads work at
once, at the price of more locks to get right.

## Why a plain flag doesn't work

The obvious first try is a boolean: wait while `locked` is true, then
set it to true. That's a check-then-act race of its own. Two threads
can both see `false`, both set `true`, and both walk in.

A real lock needs help from the hardware: an instruction that reads and
writes a memory location in one indivisible step. Test-and-set does
that (write 1, return the old value), and so does compare-and-swap
(write the new value only if the old one is what you expected). A lock
built on one of these is a **spin lock**: a thread that wants the lock
loops, retrying the instruction until it succeeds.

## What happens while you wait

Spinning is fine if the holder will let go in a moment. It's wasteful if
the holder has been switched off its core: every waiter burns its time
slice checking a value that can't change until the holder runs again.
It can even hang a system. If a high-priority thread spins on a lock
held by a low-priority one, and the [[cpu-scheduler|scheduler]] always
prefers the high-priority thread, the holder never runs to release it.

So real locks combine two things: a hardware atomic for the fast case,
and help from the kernel to sleep in the slow case. On Linux that help
is the futex: "put me to sleep if this word still holds the value I
expect", and "wake one thread waiting on this word". When there's no
contention, locking and unlocking are one atomic operation each and the
kernel isn't involved. When there is, a common design spins briefly,
hoping the lock frees up, then sleeps. That's called a two-phase lock.

Go's `sync.Mutex` follows that shape. It's a state word and a
semaphore. `Lock` first tries one compare-and-swap from "unlocked" to
"locked". If that fails, it may spin for a short while, then queue and
sleep until woken.

## Where it gets tricky

**Fair or fast.** A thread that was just woken has to get back onto a
core, while a new arrival is already running and can grab the lock
first. Letting newcomers win is faster, because the lock stays busy,
but a waiter can lose over and over. Go handles this with two modes. In
normal mode newcomers compete with woken waiters. If a waiter fails to
get the lock for more than 1 ms, the mutex switches to starvation mode
and hands the lock directly to the goroutine at the front of the queue.
The Go source is blunt about the trade: normal mode performs better,
starvation mode prevents bad [[tail-latency]]. Simple spin locks make no
fairness promise at all.

**The lock has to cover the whole decision.** Locking the check and
then separately locking the action removes the data race and keeps the
bug. Hold one lock across both.

**Go-specific rules.** A zero `sync.Mutex` is unlocked and ready to use.
Don't copy one after first use. Unlocking a mutex that isn't locked is
a run-time error. A Go mutex isn't tied to a goroutine, so one
goroutine may lock it and another unlock it. `TryLock` exists (Go
1.18), and its docs say that using it is often a sign of a deeper
problem.

**Readers and writers.** `sync.RWMutex` lets many readers or one writer
hold the lock. Once a writer is waiting, new readers block, so the
writer isn't starved. That means a goroutine that takes the read lock
twice can deadlock against a writer waiting in between: recursive read
locking isn't allowed.

**Two locks invite a [[deadlock]].** As soon as code holds one mutex
while taking another, the order matters.

## What this means when you build

- Keep each mutex next to the data it guards, and write down which
  fields it covers.
- Lock around the whole read-decide-write sequence, not each step.
- Keep the work inside the lock small: every waiter pays for it.
- If you need two locks, pick an order and always take them in it.
- A mutex isn't the only option. Handing data to one owner
  ([[message-passing]]) or a single atomic operation
  ([[lock-free-structures]]) can remove the lock entirely.

## Further reading

- [Locks (Operating Systems: Three Easy Pieces, ch. 28)](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf), Remzi and Andrea Arpaci-Dusseau, version 1.10. How locks are built, from test-and-set to futexes, and why spinning hurts.
- [sync package documentation](https://pkg.go.dev/sync), The Go Authors, go1.27. The rules for `Mutex` and `RWMutex`, in memory-model terms.
- [src/internal/sync/mutex.go](https://raw.githubusercontent.com/golang/go/master/src/internal/sync/mutex.go), The Go Authors. Go's mutex implementation, with the comment explaining normal and starvation mode.

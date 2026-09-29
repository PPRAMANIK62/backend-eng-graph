---
id: ostep-locks
title: "Locks (Operating Systems: Three Easy Pieces, ch. 28)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf
kind: book
primary: false
---

## Summary

How a lock works and how to build one (version 1.10). A lock is a
variable that is free or held; lock() and unlock() around a critical
section. Why a plain flag fails, spin locks from test-and-set and
compare-and-swap, why spinning wastes CPU, and how real locks spin
briefly then sleep in the kernel (futex on Linux).

## Key claims

- Locks make a critical section act like one atomic instruction. "Programmers annotate source code with locks, putting them around critical sections, and thus ensure that any such critical section executes as if it were a single atomic instruction." (intro)
- A lock is a variable with two states. "A lock is just a variable, and thus to use one, you must declare a lock variable of some kind" (28.1)
- Only one thread holds it. "exactly one thread holds the lock and presumably is in a critical section." (28.1)
- POSIX calls it a mutex, for mutual exclusion. "The name that the POSIX library uses for a lock is a mutex, as it is used to provide mutual exclusion between threads" (28.2)
- Coarse vs fine-grained: one big lock vs a lock per data structure, allowing more threads in locked code at once. (28.2)
- Three criteria: mutual exclusion, fairness (does anyone starve), performance (uncontended, contended on one CPU, contended on many). (28.4)
- A lock built from a plain flag with ordinary loads and stores fails: two threads can both see the flag clear and both enter (Figure 28.2). (28.6)
- Spin-waiting wastes time. "Spin-waiting wastes time waiting for another thread to release a lock." (28.6)
- Hardware support: test-and-set (atomic exchange) and compare-and-swap make a working spin lock. (28.7, 28.9)
- Test-and-set returns the old value and writes the new one in one atomic step. "It returns the old value pointed to by the old_ptr, and simultaneously updates said value to new." (28.7)
- Compare-and-swap writes the new value only if the location holds the expected one. (28.9)
- Simple spin locks aren't fair. "spin locks don’t provide any fairness guarantees." (28.8)
- On one CPU, a thread holding a lock can be preempted and waiters spin for whole time slices. (28.12)
- Priority inversion: a high-priority thread spinning on a lock held by a low-priority thread can hang the system. (aside on priority inversion, in 28.14)
- Linux futex: sleep in the kernel if the value at an address is still what you expect; wake one waiter. "The call to futex_wait(address, expected) puts the calling thread to sleep, assuming the value at the address address is equal to expected." (28.15)
- glibc's lock does almost no work without contention: one atomic operation to lock, one to unlock. (28.15)
- Two-phase locks spin for a while, then sleep. "So in the first phase, the lock spins for a while, hoping that it can acquire the lock." (28.16)
- Real locks are hardware atomics plus OS sleep/wake support. "some hardware support (in the form of a more powerful instruction) plus some operating system support" (28.17)

## Visuals worth redrawing

- Figure 28.2, the trace where two threads both take a flag "lock".

## My notes

- Complements ostep-concurrency-intro (the race) and
  ostep-concurrency-bugs (deadlock).

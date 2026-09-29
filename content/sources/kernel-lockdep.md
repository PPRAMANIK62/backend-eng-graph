---
id: kernel-lockdep
title: Runtime locking correctness validator (lockdep)
author: Ingo Molnar, Arjan van de Ven and Linux kernel developers
url: https://docs.kernel.org/locking/lockdep-design.html
kind: docs
primary: true
---

## Summary

The Linux kernel's lock validator. It groups locks into classes,
records every order in which classes are taken (L1 held while taking
L2), and reports a possible deadlock the first time an order could form
a cycle, even if the deadlock never happened in that run.

## Key claims

- It works on classes of locks, not single locks. "A class of locks is a group of locks that are logically the same with respect to locking rules, even if the locks may have multiple (possibly tens of thousands of) instantiations." (Lock-class)
- A dependency is just an order that happened. "lock dependency can be understood as lock order, where L1 -> L2 suggests that a task is attempting to acquire L2 while holding L1." (Lock-class)
- Taking the same class twice can deadlock. "The same lock-class must not be acquired twice, because this could lead to lock recursion deadlocks." (Multi-lock dependency rules)
- Two orders L1 -> L2 and L2 -> L1 are an inversion. "two locks can not be taken in inverse order" (Multi-lock dependency rules)
- It finds cycles of any length. "The validator will find such dependency circle in arbitrary complexity" (Multi-lock dependency rules)
- Interrupts: a lock used in an interrupt handler must never be taken with interrupts enabled, or the handler can deadlock against the code it interrupted. (Single-lock state rules)
- Deadlocks don't have to happen to be found. "complex multi-CPU and multi-task locking scenarios do not have to occur in practice to prove a deadlock: only the simple ‘component’ locking chains have to occur at least once" (Proof of 100% correctness)
- Orders are collected over the whole run of the kernel, and each only has to happen once, anywhere. "every simple, standalone single-task locking sequence that occurred at least once during the lifetime of the kernel" and "only the simple ‘component’ locking chains have to occur at least once (anytime, in any task/context)" (Proof of 100% correctness)
- Checks are cached per lock chain with a 64-bit hash so each chain is validated once. (Performance)
- Recursive read locks: a waiting writer can block a second non-recursive read lock in the same task, a self-deadlock. (Recursive read locks)

## Visuals worth redrawing

None.

## My notes

- Go has no lockdep equivalent in the standard toolchain that I opened.
  Go's runtime only reports when every goroutine is blocked
  (tu-go-concurrency-bugs-2019).

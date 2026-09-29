---
id: preshing-lock-free-2012
title: An Introduction to Lock-Free Programming
author: Jeff Preshing
url: https://preshing.com/20120612/an-introduction-to-lock-free-programming/
kind: blog
primary: false
---

## Summary

A practical introduction to what "lock-free" means (a progress
guarantee, not just "no mutexes"), and the techniques it forces on you:
atomic read-modify-write operations, compare-and-swap loops, the ABA
problem, and memory ordering, with the C++11 atomics of the time.

## Key claims

- Lock-free is a property of code, not just the absence of mutexes. "At its essence, lock-free is a property used to describe some code, without saying too much about how that code was actually written." (What Is It?)
- The lock in lock-free means locking up the whole program. "the lock in lock-free does not refer directly to mutexes, but rather to the possibility of “locking up” the entire application in some way, whether it’s deadlock, livelock – or even due to hypothetical thread scheduling decisions made by your worst enemy." (What Is It?)
- Code with no mutex can still fail to be lock-free: while (X == 0) { X = 1 - X; } can livelock two threads. (What Is It?)
- Herlihy and Shavit's definition. "In an infinite execution, infinitely often some method call finishes." (What Is It?)
- A suspended thread can't stop the others. "if you suspend a single thread, it will never prevent other threads from making progress, as a group, through their own lock-free operations." (What Is It?)
- Read-modify-write operations on one address line up and run one at a time. "when multiple threads attempt an RMW on the same address, they’ll effectively line up in a row and execute those operations one-at-a-time." (Atomic Read-Modify-Write Operations)
- The CAS loop: copy shared value to a local, do speculative work, publish with CAS, retry on failure. (Compare-And-Swap Loops)
- A failed CAS means another thread succeeded. "if the test fails for one thread, it means it must have succeeded for another" (Compare-And-Swap Loops)
- CAS loops need care about ABA. "Whenever implementing a CAS loop, special care must be taken to avoid the ABA problem." (Compare-And-Swap Loops)
- Code tested only on x86 often fails elsewhere. "it’s been common in the past to write lock-free code which works on x86/64, but fails on other processors." (Different Processors Have Different Memory Models)
- C++11 atomics are not guaranteed to be lock-free on every platform; check is_lock_free. (Atomic Read-Modify-Write Operations)

## Visuals worth redrawing

- The flowchart "are you programming with multiple threads, do threads
  access shared memory, can threads block each other" that decides
  whether code is lock-free.

## My notes

- 2012, written around C++11. The ideas are stable; API names aren't Go's.

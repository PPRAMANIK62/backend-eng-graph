---
id: preshing-atomic-vs-non-atomic-2013
title: Atomic vs. Non-Atomic Operations
author: Jeff Preshing
url: https://preshing.com/20130618/atomic-vs-non-atomic-operations/
kind: blog
primary: false
---

## Summary

What makes a load or store atomic, at the processor level and in C/C++.
Shows how a plain 64-bit assignment on 32-bit x86 compiles to two
instructions and can be torn, how even one instruction can be non-atomic
(unaligned access, ARMv7 strd), and that relaxed atomics fix tearing
without promising any ordering.

## Key claims

- Definition. "An operation acting on shared memory is atomic if it completes in a single step relative to other threads." (intro)
- An atomic load sees one moment. "When an atomic load is performed on a shared variable, it reads the entire value as it appeared at a single moment in time." (intro)
- The rule for shared variables. "Any time two threads operate on a shared variable concurrently, and one of those operations performs a write, both threads must use atomic operations." (intro)
- Why data races hurt: tearing. "They result in torn reads and torn writes." (intro)
- A 64-bit store on 32-bit x86 compiles to two mov instructions, so another core can see half of it. "any thread executing on a different core could read sharedValue at a moment when only half the change is visible." (Non-Atomic Due to Multiple CPU Instructions)
- Alignment matters even for one instruction. "a 32-bit mov instruction is atomic if the memory operand is naturally aligned, but non-atomic otherwise." (Non-Atomic CPU Instructions)
- C and C++ promise nothing about plain operations. "In C and C++, every operation is presumed non-atomic unless otherwise specified by the compiler or hardware vendor – even plain 32-bit integer assignment." (All C/C++ Operations Are Presumed Non-Atomic)
- Relaxed atomics are still atomic but may be reordered. "it is still legal for the memory effects of a relaxed atomic operation to be reordered with respect to instructions which follow or precede it in program order" (Relaxed Atomic Operations)
- Read-modify-write operations are the famous kind, but atomic loads and stores matter as much. "There are also atomic loads and stores, which are equally important." (intro)

## Visuals worth redrawing

- The two-instruction 64-bit store, with another core reading between
  them (Non-Atomic Due to Multiple CPU Instructions).

## My notes

- Examples are C/C++ and x86/ARMv7; the article is from 2013 and uses
  the author's Mintomic library for its own examples.

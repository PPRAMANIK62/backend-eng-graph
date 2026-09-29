---
id: cox-programming-language-memory-models-2021
title: Programming Language Memory Models (Memory Models, Part 2)
author: Russ Cox
url: https://research.swtch.com/plmm
kind: blog
primary: false
---

## Summary

How languages (Java, C++, C, Rust, Swift, JavaScript, Go) promise
programmers what a multithreaded program can see, once the compiler is
also allowed to reorder code. Covers atomics as synchronizing
operations, DRF-SC, sequentially consistent vs acquire/release vs
relaxed atomics, "DRF-SC or catch fire" in C/C++, and the unsolved
out-of-thin-air problem.

## Key claims

- With plain variables, a spin loop may never stop, because the compiler can keep the flag in a register. "If thread 2 copies done into a register before thread 1 executes, it may keep using that register for the entire loop, never noticing that thread 1 later modifies done." (intro)
- Even if the loop stops, the reader may still see the old x, because compilers reorder reads and writes. (intro)
- Atomics fix it. "If we make done an atomic variable (or manipulate it using atomic operations, in languages that take that approach), then our program is guaranteed to finish and to print 1." (intro)
- Modern languages give DRF-SC. "In general, modern languages guarantee that data-race-free programs always execute in a sequentially consistent way" (intro)
- Atomics are really "synchronizing atomics": their main job is ordering the rest of the program. "But it’s even more important that the atomics synchronize the rest of the program, providing a way to eliminate races on the non-atomic data." (intro)
- No major architecture gives sequential consistency today. "no significant architecture provides it today, because of the performance gains enabled by weaker guarantees." (Hardware, Litmus Tests, Happens Before, and DRF-SC)
- Compilers reorder ordinary reads and writes freely if single-threaded behavior is unchanged. "It is generally accepted that a compiler can reorder ordinary reads from and writes to memory almost arbitrarily, provided the reordering cannot change the observed single-threaded execution of the code." (Compilers and Optimizations)
- So compiled languages with plain variables are weaker than any hardware, not even coherent. "In this sense, programming language memory models are all weaker than the most relaxed hardware memory models." (Compilers and Optimizations)
- Compilers must not introduce races into race-free code (Boehm's "Threads Cannot Be Implemented As a Library", 2004). (Compilers and Optimizations)
- Java's new memory model (JSR-133) came with Java 5.0 in 2004 and follows DRF-SC. (Java section)
- The original Java memory model (Java Language Specification, first edition, 1996) was both too weak and too strong. "In this sense, the original Java memory model was too weak." and "The orginal Java memory model was also too strong" (Original Java Memory Model (1996))
- C++11: no guarantees for racy programs, and three kinds of atomics. "C++ provides three kinds of atomics: strong synchronization (“sequentially consistent”), weak synchronization (“acquire/release”, coherence-only), and no synchronization (“relaxed”, for hiding races)." (C++11 Memory Model)
- "DRF-SC or Catch Fire": a racy C++ program is undefined behavior. "Any program with a race anywhere in it falls into “undefined behavior.”" (DRF-SC or Catch Fire)
- Acquire/release mirrors unlock/lock. "release is like unlocking a mutex, and acquire is like locking that same mutex." (Acquire/release atomics)
- Why acquire/release exists. "These probably exist only because they are free on x86." (Acquire/release atomics)
- Acquire/release allows r1 = 0, r2 = 0 in store buffering; seq_cst atomics and Java volatiles don't. "On C++11 (acquire/release atomics): yes!" (Acquire/release atomics)
- Relaxed atomics create no happens-before edges. "These atomics have no synchronizing effect at all—they create no happens-before edges—and they have no ordering guarantees at all either." (Relaxed atomics)
- Out-of-thin-air values: no language has managed to rule them out formally. "None of the languages have found a way to formally disallow paradoxes like out-of-thin-air values, but all informally disallow them." (Conclusions)
- Rust and Swift adopted the C/C++ model. "Rust 1.0.0 in 2015 and Swift 5.3 in 2020 both adopted the C/C++ memory model in its entirety" (C, Rust and Swift Memory Models)
- ARMv8 added ldar/stlr for sequentially consistent atomics; ARMv8 and RISC-V support them directly. (Hardware Digression; Conclusions)
- All these languages provide sequentially consistent synchronizing atomics. "They all provide sequentially consistent synchronizing atomics for coordinating the non-atomic parts of a parallel program." (Conclusions)

## Visuals worth redrawing

- Litmus tables with a row per language (store buffering: SC no, x86
  yes, C++ acq/rel yes).

## My notes

- The follow-up post "Updating the Go Memory Model" led to the 2022
  revision of go-memory-model; not opened.

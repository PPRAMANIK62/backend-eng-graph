---
id: ostep-concurrency-intro
title: "Concurrency: An Introduction (Operating Systems: Three Easy Pieces, ch. 26)"
author: Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau
url: https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf
kind: book
primary: false
---

## Summary

Introduces threads as several points of execution inside one process,
sharing its address space but each with its own registers and stack.
Gives the two reasons to use them (parallelism, not blocking on I/O) and
shows the classic shared-counter race. Version 1.10.

## Key claims

- A thread is like a separate process except it shares the address space. "each thread is very much like a separate process, except for one difference: they share the same address space and thus can access the same data." (intro)
- Each thread has its own program counter and registers. "Each thread has its own private set of registers it uses for computation" (intro)
- Switching between threads of one process doesn't change the page table. "the address space remains the same (i.e., there is no need to switch which page table we are using)." (intro)
- Each thread has its own stack in the shared address space. (intro, Figure 26.1 "Single-Threaded And Multi-Threaded Address Spaces")
- Reason one: parallelism across CPUs. "using a thread per CPU to do this work is a natural way to make programs run faster on modern hardware." (26.1)
- Reason two: keep working while one thread waits on I/O. "while one thread in your program waits (i.e., is blocked waiting for I/O), the CPU scheduler can switch to other threads" (26.1)
- Servers such as web servers and databases use threads for this reason. "many modern server-based applications (web servers, database management systems, and the like) make use of threads in their implementations." (26.1)
- Processes fit better when little data is shared. "Processes are a more sound choice for logically separate tasks where little sharing of data structures in memory is needed." (26.1)
- Two threads each adding 1 to a shared counter 10 million times can end below 20,000,000 (one run printed 19,345,221). (26.3)
- The increment is three instructions (load, add, store); an interrupt between them lets another thread's update get lost. (26.4)
- This is a race condition; the code touching shared data is a critical section; the fix is mutual exclusion. "What we have demonstrated here is called a race condition" (26.4)

## Visuals worth redrawing

- Figure 26.1, single-threaded vs multi-threaded address space (one stack
  vs two stacks).
- The interleaving trace of the counter update in 26.4 (Thread 1 / Thread 2
  / OS columns).

## My notes

- Locks and atomics are later phases; the thread article should stop at
  "you need mutual exclusion".

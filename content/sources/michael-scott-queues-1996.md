---
id: michael-scott-queues-1996
title: Simple, Fast, and Practical Non-Blocking and Blocking Concurrent Queue Algorithms
author: Maged M. Michael, Michael L. Scott
url: https://www.cs.rochester.edu/u/scott/papers/1996_PODC_queues.pdf
kind: paper
primary: true
---

## Summary

PODC 1996. Presents the lock-free linked-list FIFO queue built on
compare-and-swap (the "Michael-Scott queue") and a two-lock queue.
Explains blocking vs non-blocking, the ABA problem and its usual fix, and
finds race conditions in several earlier published lock-free queues.

## Key claims

- Blocking vs non-blocking. "Blocking algorithms allow a slow or delayed process to prevent faster processes from completing operations on the shared data structure indefinitely." (1 Introduction)
- Non-blocking guarantees system progress. "Non-blocking algorithms guarantee that if there are one or more active processes trying to perform operations on a shared data structure, some operation will complete within a finite number of time steps." (1 Introduction)
- Delays that hurt blocking algorithms: preemption, page faults, cache misses. "Possible sources of delay include processor scheduling preemption, page faults, and cache misses." (1 Introduction)
- Wait-free is stronger: every process makes progress in bounded steps. (footnote 2)
- CAS definition: address, expected value, new value; replaced atomically only if it holds the expected value. (footnote 1)
- The authors found races in earlier published lock-free queues where an enqueued item could be lost. "Our experiments also revealed a race condition in which a certain interleaving of a slow dequeue with faster enqueues and dequeues by other process(es) can cause an enqueued item to be lost permanently." (1 Introduction)
- ABA. "if a process reads a value A in a shared location, computes a new value, and then attempts a compare and swap operation, the compare and swap may succeed when it should not, if between the read and the compare and swap some other process(es) change the A to a B and then back to an A again." (1 Introduction)
- The usual fix is a modification counter next to the pointer, which makes ABA "extremely unlikely", not impossible; needs a double-word CAS or array indices. (1 Introduction)
- Freeing memory is the hard part: a delayed process holding a pointer stops nodes from being freed; one earlier scheme ran out of memory on a 12-item queue. (1 Introduction)
- Conclusion: the non-blocking queue is the algorithm of choice where CAS or LL/SC exists; the two-lock queue for machines with only test-and-set; "For a queue that is usually accessed by only one or two processors, a single lock will run a little faster." (5 Conclusions)

## Visuals worth redrawing

- The queue with a dummy head node, Head and Tail pointers.

## My notes

- Experiments are on a 12-node SGI Challenge (1996); timings are not
  relevant to current machines and aren't used.

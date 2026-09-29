---
id: cox-hardware-memory-models-2021
title: Hardware Memory Models (Memory Models, Part 1)
author: Russ Cox
url: https://research.swtch.com/hwmm
kind: blog
primary: false
---

## Summary

Explains what a CPU guarantees about the order in which one core's
memory writes become visible to others. Uses litmus tests to compare
sequential consistency, x86's total store order (TSO) and the weaker
ARM/POWER model, tells how x86's model was pinned down, and ends with
Adve and Hill's data-race-free contract (DRF-SC). Written by Go's tech
lead as background for Go's memory model.

## Key claims

- The example: thread 1 sets x = 1 then done = 1; thread 2 waits for done, prints x. Line-for-line on x86 it prints 1; on ARM or POWER it can print 0; compiler optimizations can break it anywhere. "A direct line-for-line translation to assembly run on an x86 multiprocessor will always print 1." (Introduction)
- On ARM/POWER it can print 0. "But a direct line-for-line translation to assembly run on an ARM or POWER multiprocessor can print 0." (Introduction)
- Name for the contract. "that contract is called the memory consistency model or just memory model." (Introduction)
- Lamport's 1979 definition of sequential consistency (quoted in the post): "the result of any execution is the same as if the operations of all the processors were executed in some sequential order, and the operations of each individual processor appear in this sequence in the order specified by its program." (Sequential Consistency)
- Litmus test definition: a small program with a yes/no question about whether an outcome is possible. (Sequential Consistency)
- Modern hardware isn't sequentially consistent, for speed. "all modern hardware deviates in various ways from sequential consistency." (Sequential Consistency)
- x86-TSO: each processor has a FIFO write queue; reads check the local queue first; all processors agree on the order stores reach memory. "each processor queues writes to that memory in a local write queue." (x86 Total Store Order)
- Store buffering: x = 1; r1 = y in one thread, y = 1; r2 = x in the other, can end r1 = 0, r2 = 0 on x86. "On x86 (or other TSO): yes!" (Litmus Test: Write Queue)
- Barriers restore order. "non-sequentially-consistent hardware supplies explicit instructions called memory barriers (or fences) that can be used to control the ordering." (x86-TSO)
- Dekker's and Peterson's algorithms break without barriers on TSO. (x86-TSO, after the store buffer test)
- Intel only committed to a model in a 2007 white paper and later manuals; x86-TSO (Owens et al.) became the adopted model. (The Path to x86-TSO)
- Real chips broke Intel's first written model; specs were revised later. "Even worse, researchers observed actual Intel x86 hardware violating the TLO+CC model." (The Path to x86-TSO)
- A barrier in each thread makes store buffering's two zeros impossible again. "With the addition of the barriers, r1 = 0 , r2 = 0 is again impossible" (x86 Total Store Order, after the store buffering test)
- ARM/POWER: each processor has its own copy of memory, writes propagate independently and can be reordered. "each write propagates to the other processors independently, with reordering allowed as the writes propagate." (ARM/POWER Relaxed Memory Model)
- Message passing (x = 1; y = 1 vs r1 = y; r2 = x) can see r1 = 1, r2 = 0 on ARM/POWER. (ARM/POWER, Litmus Test: Message Passing)
- Coherence holds even on ARM/POWER: all threads agree on the order of writes to one location. "threads must agree which writes overwrite other writes. This property is called called coherence." (ARM/POWER, Litmus Test: Coherence)
- ARMv8 strengthened its model ("multicopy atomic"). (ARM/POWER)
- Hardware that is stronger than its spec invites code that breaks on future chips. "the gap between what is allowed and what is observed makes for unfortunate future surprises." (ARM/POWER)
- Adve and Hill (1990): data-race-free programs see sequential consistency. "if software avoids data races, then hardware acts as if it is sequentially consistent" (Weak Ordering and DRF-SC)
- A race needs at least one write; two reads don't race. "Every race involves at least one write: two uncoordinated reads do not race with each other." (Weak Ordering and DRF-SC)

## Visuals worth redrawing

- The three hardware diagrams: one shared memory (SC), shared memory
  with per-core write queues (x86-TSO), per-core memory copies with
  propagation (ARM/POWER). Adapted by Cox from Maranget et al.
- Litmus test tables (store buffering, message passing).

## My notes

- The post is from 2021; ARMv8 and x86 details may move, but the
  models it describes are architectural and long-lived.

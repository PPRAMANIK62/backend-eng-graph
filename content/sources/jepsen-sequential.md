---
id: jepsen-sequential
title: "Sequential Consistency"
author: Jepsen
url: https://jepsen.io/consistency/models/sequential
kind: docs
primary: false
---

## Summary

Jepsen's reference page on sequential consistency: one total order that
respects each process's own order, but no real-time bound, so a process
can lag far behind.

## Key claims

- The informal definition. "Informally, sequential consistency implies that operations appear to take place in some total order, and that that order is consistent with the order of operations on each individual process." (top)
- It can't stay available through a partition. "Sequential consistency cannot be totally or sticky available; in the event of a network partition, some or all nodes will be unable to make progress." (top)
- A process may read very stale state. "A process in a sequentially consistent system may be far ahead of, or behind, other processes. For instance, they may read arbitrarily stale state." (top)
- But it never goes back once it has seen something. "However, once a process A has observed some operation from process B, it can never observe a state prior to B." (top)
- Side channels need linearizability. "When you need real-time constraints (e.g. you want to tell some other process about an event via a side channel, and have that process observe that event), try linearizability." (top)
- Lamport defined it in 1979. "Leslie Lamport defined sequential consistency in his 1979 paper How to Make a Multiprocessor Computer That Correctly Executes Multiprocess Programs." (Formally)

## Visuals worth redrawing

None.

## My notes

- No author is named on the page, so the author field says Jepsen.

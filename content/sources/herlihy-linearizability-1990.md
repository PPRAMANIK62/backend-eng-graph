---
id: herlihy-linearizability-1990
title: "Linearizability: A Correctness Condition for Concurrent Objects"
author: Maurice P. Herlihy, Jeannette M. Wing
url: https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf
kind: paper
primary: true
---

## Summary

The paper that defined linearizability (ACM TOPLAS, 1990). A concurrent
history is linearizable if it is equivalent to a legal sequential one
that keeps the real-time order of operations that didn't overlap. Shows
that linearizability is local (each object on its own) and nonblocking,
and compares it with sequential consistency and serializability, using
FIFO-queue and register histories.

## Key claims

- The core illusion. "Linearizability provides the illusion that each operation applied by concurrent processes takes effect instantaneously at some point between its invocation and its response" (abstract)
- The first intuitive requirement; the second is that non-overlapping operations keep their order. "First, each operation should appear to “take effect” instantaneously" (1.2)
- It is local: each object on its own. "a system is linearizable if each individual object is linearizable." (1.1)
- Locality helps modularity. "Locality enhances modularity and concurrency, since objects can be implemented and verified independently, and run-time scheduling can be completely decentralized." (1.1)
- Queue example H1 is fine: concurrent enqueues could have taken effect in either order. "In fact, their enqueues were concurrent, thus they could indeed have taken effect in that order." (1.2)
- Queue example H2 is not: x was clearly first. "Here, it is clear to an external observer that x was enqueued before y, yet y is dequeued without x having been dequeued." (1.2)
- Sequential consistency lacks locality. "Sequential consistency is not a local property." (3)
- Relation to strict serializability. "Linearizability can be viewed as a special case of strict serializability where transactions are restricted to consist of a single operation applied to a single object." (3)
- Linearizability respects real-time precedence. "L2 states that this apparent sequential interleaving respects the real-time precedence ordering of operations." (2)

## Visuals worth redrawing

- Figure 1: four FIFO-queue histories drawn as intervals on a time
  axis, two acceptable and two not. Figure 2: the same for registers.

## My notes

- The PDF is a scan; the text layer is messy around figures. Quotes
  above were checked against the extracted text.

---
id: kleppmann-critique-cap-2015
title: "A Critique of the CAP Theorem"
author: Martin Kleppmann
url: https://arxiv.org/pdf/1509.05393
kind: paper
primary: true
---

## Summary

A paper (arXiv, 2015) that lists the ambiguities in CAP's definitions
and proof and proposes a replacement: classify each operation by
whether its latency must grow with network delay (O(d)) or not (O(1)),
using known lower bounds for linearizability, sequential and causal
consistency.

## Key claims

- The paper's aim. "In this paper we survey some of the confusion about the meaning of CAP, including inconsistencies and ambiguities in its definitions, and we highlight some problems in its formalization." (abstract)
- Strong consistency costs performance and fault tolerance. "However, this guarantee comes at the cost of reduced performance [6] and fault tolerance [22] compared to weaker consistency models." (1)
- The trade-off was known long before CAP. "This trade-off was already known in the 1970s [22, 23, 32, 40], but it was rediscovered in the early 2000s" (1)
- Linearizable register operations have a latency floor tied to network delay. "Attiya and Welch [6] show that any algorithm implementing a linearizable read-write register must have an operation latency of at least u/2, where u is the uncertainty of delay in the network between replicas." (4.2.1)
- Simplified: linearizable reads and writes are O(d). "we can simplify the result to say that linearizability requires the latency of read and write operations to be proportional to the network delay d." (4.2.1)
- Sequential consistency: reads plus writes at least d. "Lipton and Sandberg [42] show that any algorithm implementing a sequentially consistent read-write register must have |r| + |w| ≥ d, where |r| is the latency of a read operation, |w| is the latency of a write operation, and d is the network delay." (4.2.2)
- Delay-sensitive operations can stall for as long as the network does. "In a delay-sensitive O(d) algorithm, operation latency may increase to be as large as the duration of the network interruption (i.e. minutes or even hours), whereas a delay-independent O(1) algorithm remains unaffected." (4.4)
- Partitions can be modelled as very long delays. "On the assumption that lost messages are retransmitted an unbounded number of times, we can model network faults (including partitions) as periods of greatly increased delay." (5, conclusion)

- If tolerance of network delay is all you care about, causal is the best you can get. "causal consistency is the optimal consistency level." (4.2.3)
- Eventual consistency gives no safety property at all. "which provides no safety property [9]" (4.2.3)
- CAP should be retired. "we believe that CAP has now reached the end of its usefulness; we recommend that it should be relegated to the history of distributed systems, and no longer be used for justifying design decisions." (conclusion; the two-column extraction splits the sentence)
- The proposed replacement framework. "delay-sensitivity, which provides tools for reasoning about trade-offs between consistency and robustness to network faults." (3)

## Visuals worth redrawing

- Table 1: lowest possible read and write latency for linearizability,
  sequential and causal consistency. Causal gets O(1) for both.

## My notes

- Table 1's text doesn't extract cleanly; from the table and the
  sections around it: linearizability O(d) reads and writes;
  sequential O(d) for one of reads or writes and O(1) for the other;
  causal O(1) for both.

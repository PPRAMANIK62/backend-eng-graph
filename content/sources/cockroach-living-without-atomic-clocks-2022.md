---
id: cockroach-living-without-atomic-clocks-2022
title: "Living without atomic clocks: Where CockroachDB and Spanner diverge"
author: Spencer Kimball and Irfan Sharif (Cockroach Labs)
url: https://www.cockroachlabs.com/blog/living-without-atomic-clocks/
kind: blog
primary: true
---

## Summary

Cockroach Labs' post (2022) comparing how Spanner and CockroachDB pick
transaction timestamps. Spanner waits out a small, hardware-backed
clock uncertainty on every commit; CockroachDB, on commodity clocks,
uses an uncertainty interval and restarts reads that land inside it.
Explains "causal reverse", why CockroachDB claims serializability but
not linearizability, and the node self-termination rule.

## Key claims

- CockroachDB is based on Spanner. "The design of CockroachDB is based on Google’s Spanner data storage system." (Introduction)
- TrueTime bounds clock offset; it doesn't remove it. "TrueTime does not guarantee perfectly synchronized clocks. Rather, TrueTime gives an upper bound for clock offsets between nodes in a cluster." (How does TrueTime provide linearizability?)
- Spanner's bound vs NTP, as the authors put it. "In Spanner’s case, Google mentions an upper bound of 7ms. That’s pretty tight; by contrast, using NTP for clock synchronization is likely to give somewhere between 100ms and 250ms." (How does TrueTime provide linearizability?)
- Spanner waits out the bound before reporting a commit. "Before a node is allowed to report that a transaction has committed, it must wait 7ms." (How does TrueTime provide linearizability?)
- Waiting out the offset works with any clocks, but would be slow with NTP. "One could very well wait out the maximum clock offset in any system and achieve linearizability." (How does TrueTime provide linearizability?)
- The anomaly without it: causal reverse. "The “anomaly” described above, and shown in Figure 1, is something we call “causal reverse”." (Serializability)
- What CockroachDB claims. "While Spanner provides linearizability, CockroachDB only goes as far as to claim serializability, though with some features to help bridge the gap in practice." (Serializability)
- Causal reverse needs disjoint keys and an outside channel between clients. "this can only happen if (a) there’s no overlap between the keys read or written during the transactions, and (b) there’s an external low-latency communication channel between clients that could potentially impact activity on the DBMS." (How important is linearizability?)
- The uncertainty interval. "It also establishes an upper bound on the selected wall time by adding the maximum clock offset for the cluster [commit timestamp, commit timestamp + maximum clock offset]." (How does CockroachDB choose transaction timestamps?)
- The difference in one line. "While Spanner always waits after writes, CockroachDB sometimes retries reads." (How does CockroachDB choose transaction timestamps?)
- Uncertainty restarts are bounded. "Transactions reading constantly updated data from many nodes may be forced to restart multiple times, though never for longer than the uncertainty interval, nor more than once per node." (How does CockroachDB choose transaction timestamps?)
- A node past the max offset kills itself. "If the configured maximum offset is exceeded by any node, it self-terminates." (How does CockroachDB choose transaction timestamps?)
- The causality token for chains of dependent transactions. "CockroachDB makes use of a “causality token”, which is just the maximum timestamp encountered during a transaction." (How important is linearizability?)

## Visuals worth redrawing

- Figure 1: two nodes, one clock 100 ms behind, T2 committing "in the
  past" of T1. Not redrawn.

## My notes

- The 7 ms and the 100 to 250 ms NTP range are the authors' round
  figures, not measurements in this post. The Spanner paper's own
  numbers (bound about 1 to 7 ms, commit wait about 5 ms in their
  benchmark) are in corbett-spanner-2012.

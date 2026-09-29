---
id: foundationdb-simulation-testing
title: Simulation and Testing (FoundationDB documentation)
author: FoundationDB project (Apple)
url: https://apple.github.io/foundationdb/testing.html
kind: docs
primary: true
---

## Summary

FoundationDB's short docs page on how it's tested: deterministic
simulation of a whole cluster in one thread, the kinds of failures
simulated, the "swizzle-clogging" fault pattern, and the nightly
performance suite.

## Key claims

- A whole cluster in one thread. "Simulation is able to conduct a deterministic simulation of an entire FoundationDB cluster within a single-threaded process." (Simulation)
- Determinism gives perfect repeatability. "Determinism is crucial in that it allows perfect repeatability of a simulated run, facilitating controlled experiments to home in on issues." (Simulation)
- Scale of the nightly runs. "Simulation runs tens of thousands of simulations every night, each one simulating large numbers of component failures." (Simulation)
- Their estimate of total simulation run. "we estimate that we have run the equivalent of roughly one trillion CPU-hours of simulation on FoundationDB." (Simulation)
- Time ratio. "In practice, our simulations usually have about a 10-1 factor of real-to-simulated time" (Simulation)
- The cycle test checks isolation with a ring of keys. "we run a cycle test that uses key-values pairs arranged in a ring that executes transactions to change the values in a manner designed to maintain the ring’s integrity, allowing a clear test of transactional isolation." (Simulation)
- Failures simulated. "including connection failures, degradation of machine performance, machine shutdowns or reboots, machines coming back from the dead, etc." (Simulation)
- Swizzle-clogging. "To swizzle-clog, you first pick a random subset of nodes in the cluster. Then, you “clog” (stop) each of their network connections one by one over a few seconds. Finally, you unclog them in a random order, again one by one, until they are all up." (Simulation)
- They doubt they'd have built it without simulation. "It seems unlikely that we would have been able to build FoundationDB without this technology." (Simulation)
- Simulation is one of three kinds of testing, alongside live performance tests and hardware failure tests. "we use a combined regime of robust simulation, live performance testing, and hardware-based failure testing." (Correctness and performance)

## Visuals worth redrawing

None.

## My notes

- "about a 10-1 factor of real-to-simulated time" is ambiguous about
  direction; read with the sentence before it, simulated time runs
  ahead of wall-clock time. Not used as a number in articles.

---
id: zhou-foundationdb-2021
title: "FoundationDB: A Distributed Unbundled Transactional Key Value Store"
author: Jingyu Zhou, Meng Xu, Alexander Shraer, Bala Namasivayam, Alex Miller, Evan Tschannen, Steve Atherton, Andrew J. Beamon, Rusty Sears, John Leach, Dave Rosenthal, Xin Dong, and others
url: https://www.foundationdb.org/files/fdb-paper.pdf
kind: paper
primary: true
---

## Summary

The SIGMOD 2021 paper on FoundationDB by its builders at Apple and
Snowflake. Section 4 describes the deterministic simulator the database
was built around: the real code running with simulated network, disk
and time in one discrete-event simulation, randomized workloads, fault
injection, "buggification", swarm testing, and coverage macros. Section
6.2 reports what it bought them.

## Key claims

- The approach in one sentence. "the real database software is run, together with randomized synthetic workloads and fault injection, in a deterministic discrete-event simulation." (4)
- Determinism makes every bug found reproducible. "determinism guarantees that every bug found this way can be reproduced, diagnosed, and fixed." (4)
- Database code avoids threads to stay deterministic. "All database code is deterministic; accordingly multithreaded concurrency is avoided (instead, one database node is deployed per core)." (4, Deterministic simulator)
- Every source of nondeterminism is behind an interface. "all sources of nondeterminism and communication are abstracted, including network, disk, time, and pseudo random number generator." (4, Deterministic simulator)
- Many servers in one process. "The simulator process is able to spawn multiple FDB servers that communicate with each other through a simulated network in a single discrete-event simulation." (4, Deterministic simulator)
- In production the same interfaces are thin. "The production implementation is a simple shim to the relevant system calls." (4, Deterministic simulator)
- Workloads check invariants that only hold if transactions are atomic and isolated. "by checking invariants in their data that can only be maintained through transaction atomicity and isolation" (4, Test oracles)
- Recoverability is checked by healing the simulated hardware and waiting. "verifying that the cluster eventually recovers." (4, Test oracles)
- What gets injected. "The FDB simulator injects machine, rack, and data-center level fail-stop failures and reboots, a variety of network faults, partitions, and latency problems, disk behavior (e.g. the corruption of unsynchronized writes when machines reboot), and randomizes event times." (4, Fault injection)
- Too many faults shrink the explored state space. "Fault injection distributions are carefully tuned to avoid driving the system into a small state-space caused by an excessive fault rate." (4, Fault injection)
- Buggification: the code itself offers places to misbehave. "the simulation is given the opportunity to inject some unusual (but not contract-breaking) behavior such as unnecessarily returning an error from an operation that usually succeeds, injecting a delay in an operation that is usually fast, choosing an unusual value for a tuning parameter, etc." (4, Fault injection)
- Swarm testing randomizes the whole configuration per run. "Each run uses a random cluster size and configuration, random workloads, random fault injection parameters, random tuning parameters, and enables and disables a different random subset of buggification points." (4)
- Coverage macros show whether a rare condition was ever reached. "analysis of simulation results will tell them how many distinct simulation runs achieved that condition." (4)
- Simulated time can run faster than real time. "Discrete-event simulation can run arbitrarily faster than real-time if CPU utilization within the simulation is low, as the simulator can fast-forward clock to the next event." (4, Latency to bug discovery)
- It parallelizes trivially. "Randomized testing is embarrassingly parallel" (4, Latency to bug discovery)
- Limits: no performance bugs, no code outside Flow, and wrong beliefs about the OS stay wrong. "Simulation is not able to reliably detect performance issues, such as an imperfect load balancing algorithm." (4, Limitations)
- It can't test third-party dependencies, so they avoided them. "It is also unable to test third-party libraries or dependencies, or even first-party code not implemented in Flow." (4, Limitations)
- Bugs from a weaker OS contract than believed. "several bugs have resulted from the true operating system contract being weaker than it was believed to be." (4, Limitations)
- Extra logging doesn't change the replay. "Adding additional logging, for instance, generally does not affect the deterministic ordering of events, so an exact reproduction is guaranteed." (6.2)
- Bugs found in production were first reproduced in simulation. "the debugging process was almost always first to improve the capabilities or the fidelity of the simulation until the issue could be reproduced there, and only then to begin the normal debugging process." (6.2)
- ZooKeeper was replaced after real-world fault injection found bugs in it. "early versions of FDB depended on Apache Zookeeper for coordination, which was deleted after real-world fault injection found two independent bugs in Zookeeper (circa 2010)" (6.2)
- Production record they report. "CloudKit [59] has deployed FDB for more than 0.5M disk years without a single data corruption event." (6.2)

## Visuals worth redrawing

- Figure 6 (4): the simulator process. Workloads and many FDB servers
  on top of simulated network, disk, time and random number
  interfaces. The node's main figure is adapted from it.

## My notes

- Flow is FoundationDB's C++ extension with actor-style async/await;
  the simulator depends on everything going through it.

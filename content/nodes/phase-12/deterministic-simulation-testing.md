---
id: deterministic-simulation-testing
title: Deterministic simulation testing
depth: deep
phase: 12
note: >-
  Running a whole cluster in one process on a seeded scheduler, so any
  failure replays exactly. FoundationDB, TigerBeetle. The phase 12
  harness.
needs: [fault-injection]
leads_to: []
compare_with: [fuzzing, chaos-engineering, model-based-testing, linearizability-checking, workflow-determinism]
---

# Deterministic simulation testing

Deterministic simulation testing (DST) runs a whole distributed system,
every node, the network between them and their disks, inside one
process on one thread, with every source of randomness driven by a
single seed. You throw faults at it over and over, and when one
run breaks, you rerun that seed and get the exact same failure, event
for event. It's how FoundationDB and TigerBeetle test their
consensus and recovery code, and it's the harness this phase's Raft
build is checked with.

## The bug you can't reproduce

Say you've built a three-node key-value store on [[raft]]. You run it
under [[fault-injection]] for a night: kill nodes, cut links, delay
packets. Once, around 3 a.m., the history checker reports a lost
write. You look at the logs, rerun the test, and it passes. And the next
hundred times.

The bug depended on an exact interleaving: which message arrived first,
when a timer fired, which node crashed just after writing but before
syncing. Real threads, real sockets and real clocks never produce the
same interleaving twice. Distributed bugs are slow to find and, once
found, may never show up again.

DST attacks exactly that. If the program can't tell the simulation
from the real world, and the simulation is deterministic, every
interleaving it explores can be replayed on demand.

## Take away everything that isn't deterministic

A program is deterministic if the same inputs always produce the same
steps. Four things usually break that in a server: the network, the
disk, the clock, and random numbers. Threads are a fifth.

DST puts each of them behind an interface that the program receives
instead of calling the OS directly:

- **Network.** Messages go through a simulated network the test
  controls. It can deliver them in any order, drop them, delay them or
  cut a partition.
- **Disk.** Reads and writes go to an in-memory fake that can fail,
  return corrupt data, or corrupt writes that weren't synced when a
  node "reboots".
- **Clock.** Code never reads the system time. It asks the simulator,
  which jumps time straight to the next scheduled event.
- **Random numbers.** Everything random, including retry jitter and
  election timeouts, comes from one generator seeded by the test.

In production each interface is a thin shim over the real system call.
In the test it's the simulator. The code in between is the real code,
not a model of it.

Threads are handled by not having them. The whole system runs on one
thread, with an event loop that picks the next ready event. FoundationDB
avoids multithreading in its database code entirely and runs one node
per core instead. That's why DST fits code written around
[[async-await]] and an [[event-loop]]: the concurrency is already
cooperative, so a simulated scheduler can decide what runs next.

![A dashed frame labelled "one OS process, one thread" holds a workload of simulated clients, a checker of assertions, invariants and history checks, and three nodes running real production code. Below them, every nondeterministic thing goes through interfaces the simulator owns: network (drop, delay, partition), disk (errors, corruption), clock (jumps to the next event) and random numbers (one seeded source). At the bottom, an event loop runs one event at a time in an order picked by the seed, and also crashes and restarts nodes and injects faults. Under the frame: one seed per run; the same seed and the same code give the same run, event for event.](img/deterministic-simulation-testing-process.svg)

*A cluster inside a deterministic simulator. Adapted from Zhou et al., "FoundationDB: A Distributed Unbundled Transactional Key Value Store", figure 6 (2021).*

## One run, then millions

A single simulation run goes like this:

1. Pick a seed. The seed decides the cluster size, the workload, which
   faults to inject and how often, and every tie the scheduler has to
   break.
2. Start the nodes and the simulated clients, all in one process.
3. Run events until the workload finishes, injecting crashes,
   partitions, slow disks and corrupted reads as the seed dictates.
4. Check the result. Assertions inside the code fire on broken
   invariants. The workload checks properties that only hold if the
   system is correct, like a ring of keys that stays a ring only if
   transactions are atomic and isolated. For a store like the lab's, a
   [[linearizability-checking|linearizability checker]] reads the
   history of operations.
5. If anything fails, print the seed.

Then run it again with another seed, and again. Because simulated time
jumps from event to event, a run can cover minutes or hours of cluster
time in much less wall time when the cluster is mostly idle. And runs
don't share anything, so you can spread them across as many cores as
you have. FoundationDB runs tens of thousands of simulations every
night. TigerBeetle runs its simulator, the VOPR, around the clock on
1,024 cores and says it runs about 1,000 times faster than real time.

When a run fails, the seed plus the exact code version replays it
exactly. You can add logging and rerun: extra logging doesn't change
the order of events, so the bug comes back in the same place.
FoundationDB's team found this so much more productive than debugging
production that when a bug did show up in the wild, their first step
was usually to improve the simulator until it reproduced the bug there.

## Making the rare cases common

Random faults at a random rate mostly find shallow bugs. The systems
that get the most out of DST push the simulation toward the corners on
purpose.

- **Tune the fault rate.** Too many faults and the cluster never makes
  progress, so you only test the "everything is broken" state.
  FoundationDB tunes its fault distributions to avoid exactly that.
- **Buggify the code.** FoundationDB's code has marked spots where the
  simulator may make an operation misbehave in a legal way: return an
  error that normally never happens, add a delay to a fast path, pick
  an odd value for a tuning parameter.
- **Swarm testing.** Each run picks a random configuration: cluster
  size, workload, fault parameters, which buggify points are on. Many
  different small experiments beat one big one.
- **Nasty fault patterns.** FoundationDB's favourite, "swizzle-clogging",
  stops the network links of a random set of nodes one by one, then
  restores them in a random order.
- **Measure what you reach.** A coverage macro on a rare condition
  (say, a buffer that's full) tells you how many runs actually hit it.
  If the answer is zero, the simulator needs work, not the code.

TigerBeetle adds one more habit: thousands of assertions in the code,
kept on in production. In a simulation, every assertion is a free
oracle.

## Where it gets tricky

**You only test what you simulate.** The simulated disk and network
are your model of the real ones. If the real OS gives weaker
guarantees than you believed, the simulator will happily confirm your
wrong belief. FoundationDB reports several bugs of exactly that kind.
It also can't test third-party libraries that don't go through the
simulator's interfaces, which is why FoundationDB avoided dependencies,
and even replaced ZooKeeper with its own Paxos after real-world fault
injection found bugs in ZooKeeper.

**Your language may fight you.** DST needs the whole system on one
thread with asynchronous I/O. Go's runtime schedules goroutines in a
random order on purpose, even on a single thread, so doing DST in Go
has meant compiling to WebAssembly and patching the runtime. A system
built from your service plus Kafka plus Postgres can't be squeezed into
one process at all. DST fits best when the system is self-contained
and designed for it from the start.

**It's easy to look busy and test little.** A simulator can run for
months and never reach the interesting states. Branch coverage is a
poor guide, because the bugs are in combinations of timing and faults,
not in unvisited lines. FoundationDB's former engineers describe most
of the work on their simulator as hunting for what it wasn't covering.

**Seeds rot.** A seed replays a failure only against the same code.
Change one line and the same seed takes a different path. Turn each
failing seed into a targeted test that describes the scenario, and
keep running new seeds after every change.

**Not for performance.** Simulated time says nothing about real speed.
FoundationDB notes its simulator can't reliably find performance
problems, such as a poor load-balancing algorithm.

**How it relates to its neighbours.** [[fuzzing]] generates inputs;
DST generates timing and faults, and makes them replayable. Jepsen-style
[[fault-injection]] tests the real binaries on real machines, which
catches what the simulation's model misses, but can't replay what it
finds. [[chaos-engineering]] runs experiments in production-like
environments to learn how the whole system behaves. They're
complements: FoundationDB ran both simulation and real hardware
failure testing.

## What this means when you build

- Decide early. Retrofitting DST means finding every clock read, random
  call, thread and socket; designing for it means passing a clock, a
  random source, a network and a disk into your code from day one.
- Keep the deterministic core big and the edges thin. Everything behind
  an interface is tested; the shims are not.
- Give every run a seed, log it, and make "rerun this seed" a single
  command.
- Write a checker first: assertions, invariants, a history checker.
  Simulation without an oracle only finds crashes.
- Tune the faults and measure coverage of rare conditions, or the
  simulator will quietly test the easy path.
- Still run real fault injection on real machines. The simulator only
  knows the world you taught it.

## Further reading

- [FoundationDB: A Distributed Unbundled Transactional Key Value Store](https://www.foundationdb.org/files/fdb-paper.pdf), Zhou et al., 2021. Section 4 is the best short description of a production DST system: the simulator, oracles, fault injection, buggification, swarm testing, and its limits.
- [Simulation and Testing](https://apple.github.io/foundationdb/testing.html), FoundationDB docs. How much they simulate, the cycle test, and swizzle-clogging.
- [Deterministic Simulation Testing (VOPR)](https://raw.githubusercontent.com/tigerbeetle/tigerbeetle/main/docs/internals/vopr.md), TigerBeetle docs. Seed plus commit replay, what's stubbed out, and assertions as oracles.
- [Safety](https://docs.tigerbeetle.com/concepts/safety/), TigerBeetle docs. Where the VOPR sits in their testing, and how big it runs.
- [We Put a Distributed Database In the Browser](https://tigerbeetle.com/blog/2023-07-11-we-put-a-distributed-database-in-the-browser/), Phil Eaton and Joran Dirk Greef, TigerBeetle, 2023. The VOPR's origins and what its fault levels look like.
- [What's the big deal about Deterministic Simulation Testing?](https://notes.eatonphil.com/2024-08-20-deterministic-simulation-testing.html), Phil Eaton, 2024. How to make code simulatable, and an honest list of limits.

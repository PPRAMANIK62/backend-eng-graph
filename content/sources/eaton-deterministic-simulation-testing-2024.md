---
id: eaton-deterministic-simulation-testing-2024
title: What's the big deal about Deterministic Simulation Testing?
author: Phil Eaton
url: https://notes.eatonphil.com/2024-08-20-deterministic-simulation-testing.html
kind: blog
primary: false
---

## Summary

A 2024 explainer on DST, reviewed by Alex Miller and Will Wilson (both
ex-FoundationDB). How to make randomness and time injectable, why the
system must collapse to one thread with async I/O, what it looks like
for a multi-node system, and a frank list of limits: the mocked edges,
workload quality, knowing what you mocked, seeds that stop reproducing
when code changes, and compute cost.

## Key claims

- DST doesn't forbid randomness; it needs one controlled seed. "DST merely assumes that you have a global seed for all randomness in your program and that the simulator controls the seed." (Randomness and time)
- Time must be controllable too. "DST means you must be able to control the clock during the simulation." (Randomness and time)
- Control means dependency injection. "Rather than referring to a global clock or a global seed, you need to be able to receive a clock or a seed from someone." (Randomness and time)
- You write the workload. "the simulation workload must be written by the user." (Converting an existing function)
- Single thread and async I/O are the price. "So we must limit ourselves to writing code that can be collapsed into a single thread." (A single thread and asynchronous IO)
- Go's runtime schedules goroutines randomly, which makes DST hard; Polar Signals forked the runtime. "Even on a single thread, the Go runtime intentionally schedules goroutines randomly." (A single thread and asynchronous IO)
- Polar Signals ran Go single-threaded by compiling to WASM, then forked the runtime. "Polar Signals solved this for DST by compiling their application to WASM where it would run on a single thread." (A single thread and asynchronous IO)
- Nodes of a self-contained system can run in one process; a system of app plus Kafka plus Postgres can't. "This would be basically impossible if you wanted to test a system that involved your application plus Kafka plus Postgres plus Redis." (A distributed system)
- Determinism is a spectrum. "determinism, even among DST practitioners, remains a spectrum." (Other sources of non-determinism)
- You don't test the edges you swapped out. "because you must swap out non-deterministic parts of your code, you are not actually testing the entirety of your code." (Consideration 1)
- A DST setup can look busy and explore little (Will Wilson, quoted). "it's terrifyingly easy to build a DST system that appears to be doing a ton of testing, but actually never explores very much of the state space of your system." (Consideration 2)
- Branch coverage is a weak signal for DST (Will Wilson, quoted). "mere branch coverage in your code is usually a pretty poor signal for the kinds of systems you want to test with DST." (Consideration 2)
- The mocks are only as good as your model of the real world. "the benefits of DST are tied to your understanding of the spectrum of behavior that may happen in the real world." (Consideration 3)
- Seeds stop reproducing once the code changes. "As soon as your code changes, the seed may no longer even get you to the state where the bug was exhibited." (Consideration 4)
- Jepsen finds bugs but can't replay them. "Jepsen has nothing to do with deterministic execution." (What about Jepsen?)
- At FoundationDB, most simulator work was hunting for gaps in coverage (Will Wilson, quoted). "At FoundationDB, the vast majority of the work we put into the simulator was an iterative process of hunting for what wasn't being covered by our tests and then figuring out how to make the tests better." (Consideration 2)

## Visuals worth redrawing

None.

## My notes

- The Will Wilson quotes are his words quoted in the post; treat them
  as an experienced practitioner's view, not measurement.

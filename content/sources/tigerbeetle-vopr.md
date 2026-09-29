---
id: tigerbeetle-vopr
title: Deterministic Simulation Testing (TigerBeetle docs, internals)
author: TigerBeetle
url: https://raw.githubusercontent.com/tigerbeetle/tigerbeetle/main/docs/internals/vopr.md
kind: docs
primary: true
---

## Summary

TigerBeetle's internal docs page on the VOPR, its deterministic
simulator, read from the main branch. What is stubbed out, how a seed
plus a Git commit replays a failure, and how assertions and checkers
serve as the test oracle.

## Key claims

- Seed plus commit reproduces a run. "Because our simulator is deterministic based on a _seed_ number and the Git commit, we can perfectly reproduce any bugs discovered in testing for easy local debugging." (Intro)
- Time runs faster in simulation. "Crucially, VOPR can speed up time arbitrarily." (Intro)
- It targets safety and liveness of consensus and recovery. "The key purpose of the VOPR is to test TigerBeetle's safety and liveness, and it focuses on consensus and the cluster's recovery mechanisms." (The VOPR)
- What's stubbed. "In the simulator, all non-deterministic parts of the system are stubbed out. This includes the clock, network, and disk operations." (The VOPR)
- The seed also picks the faults. "The VOPR uses a random seed to tune parameters for injecting different types of faults into the simulation." (The VOPR)
- Kinds of faults. "it may drop and reorder packets, partition the network, or corrupt reads and writes" to the simulated disk (The VOPR)
- Replay. "When a simulation causes any type of failure, the seed and Git commit hash can be used to replay back the exact simulation and bug." (The VOPR)
- Assertions stay on in production. "TigerBeetle is somewhat unique in that it keeps these assertions on, even in production." (Assertions and checkers)
- Assertions multiply the value of simulation. "Assertions are a force multiplier when used with simulation testing and fuzzing." (Assertions and checkers)
- A checker: caught-up replicas must be byte-identical. "TigerBeetle replicas' data files are designed to be byte-for-byte identical across caught-up nodes in the cluster." (Assertions and checkers)
- Inspired by FoundationDB and Antithesis. "TigerBeetle's approach to DST was heavily inspired by the work of" FoundationDB and Antithesis (Inspiration)
- Thousands of assertions in the code. "Throughout the code base there are thousands of assertions checking that all manner of invariants hold true." (Assertions and checkers)

## Visuals worth redrawing

None.

## My notes

- The page is Markdown on GitHub; the raw file was read.

---
id: athalye-linearizability-testing-2017
title: "Testing Distributed Systems for Linearizability"
author: Anish Athalye
url: https://anishathalye.com/testing-distributed-systems-for-linearizability/
kind: blog
primary: true
---

## Summary

The author of Porcupine explains how to test a distributed key-value
store for linearizability: write a sequential spec as code, record a
concurrent history under faults, and have a checker search for a legal
order. Covers why hand-written asserts miss bugs, why checking is
NP-complete, and why he wrote Porcupine when Knossos couldn't handle
his histories.

## Key claims

- A spec as executable code pins down the details. "The code is short, but it nails down all the important details: the start state, how the internal state is modified as a result of operations, and what values are returned as a result of calls on the key-value store." (Sequential Specifications)
- The sequential spec says nothing about concurrent operations. "Note that the sequential specification does not tell us what happens under concurrent operation." (Linearizability)
- The definition. "In a linearizable system, every operation appears to execute atomically and instantaneously at some point between the invocation and response." (Linearizability)
- A history is shown linearizable by finding linearization points. "We can show this by explicitly finding linearization points for all operations" (Linearizability)
- Random tests with faults. "The general approach is to test for correct operation while randomly injecting faults such as machine failures and network partitions." (Testing)
- Per-client asserts miss bugs. "However, this test is not that thorough: there are non-linearizable key-value stores that would always pass this test." (Ad-hoc testing)
- With shared keys there's no single right answer, so record and check. "we can test for correctness by recording an entire history of operations on the system and then checking if the history is linearizable with respect to the sequential specification." (Linearizability)
- What a checker takes. "A linearizability checker takes as input a sequential specification and a concurrent history, and it runs a decision procedure to check whether the history is linearizable with respect to the spec." (Linearizability Checking)
- It's NP-complete. "Unfortunately, linearizability checking is NP-complete." (NP-Completeness)
- Proof by reduction from subset sum. "To show that linearizability checking is NP-hard, we can reduce the subset sum problem to linearizability checking." (NP-Completeness)
- In practice it works on small histories. "Even though linearizability checking is NP-complete, in practice, it can work pretty well on small histories." (Implementation)
- Checkers search for a linearization and prune. "they run a search procedure to try to construct a linearization, using tricks to constrain the size of the search space." (Implementation)
- Knossos handled about a hundred events for him, not thousands. "It seemed to work okay on histories with a couple concurrent clients, with about a hundred history events in total, but in my tests, I had tens of clients generating histories of thousands of events." (Implementation)
- Porcupine checks thousands of events in seconds. "I was able to use it to test my key-value store because it is capable of checking histories of thousands of events in a couple seconds." (Implementation)
- Planted bugs: ad-hoc tests caught the obvious ones, the checker caught all of them. "In contrast, I couldn’t introduce a single correctness bug that the linearizability test couldn’t catch." (Effectiveness)
- The reduction: an adder object, one Add per set element and one Get of the target. "This history is linearizable if and only if the answer to the subset sum problem is “yes”." (NP-Completeness)

## Visuals worth redrawing

- The key-value histories drawn as bars per client, with orange
  linearization points on the linearizable one.

## My notes

- Written in 2017. Porcupine's README has later numbers.

---
id: jepsen-knossos
title: "Knossos (README)"
author: Kyle Kingsbury
url: https://github.com/jepsen-io/knossos
kind: code
primary: true
---

## Summary

The README of Knossos, Jepsen's original linearizability checker, in
Clojure. Explains how a history is written (invoke, then ok, fail or
info), what a crashed operation means, and the three possible answers.

## Key claims

- What it does, and a caution. "Given a history of operations by a set of clients, and some singlethreaded model, attempts to show that the history is not linearizable with respect to that model." (top)
- Each operation is an invocation plus a completion of one of three kinds. "an invoke, when the op begins, and a completion: either ok if the operation took place, fail if the operation did not take place, or info if you're not sure what happened, e.g. the operation timed out." (Concepts)
- A process does one thing at a time. "A process can only do one thing at a time." (Concepts)
- A timed-out process is crashed for good. "If a process times out after invoking an operation, it is said to be *crashed* and cannot perform another operation ever again." (Concepts)
- A crashed write may still have happened. "we can infer that this history is linearizable: the crashed operation did in fact take place, and linearized prior to the read of 3." (Concepts)
- Built-in models. "Knossos defines some built-in models like a register, a register with compare-and-set, and a mutex" (Concepts)
- The answer can be unknown. "`:unknown`  means knossos was unable to complete the analysis; e.g. it ran out of memory." (At the command line)
- It runs a graph search and a tree search in parallel. "which runs both a graph search (`knossos.linear`) and a tree search (`knossos.wgl`) in parallel." (As a library)

## Visuals worth redrawing

None.

## My notes

- The README says "I am not certain the algorithm is correct yet; you
  should treat its results as plausible but verify by hand." That line
  may be old; worth rechecking against current Jepsen practice.

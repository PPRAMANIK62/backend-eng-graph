---
id: pgregory-rapid
title: rapid (Go package documentation)
author: Gregory Petrosyan and contributors
url: https://pkg.go.dev/pgregory.net/rapid
kind: docs
primary: true
---

## Summary

Docs for rapid, a property-based testing library for Go, v1.3.0 when
this was read. It generates inputs, minimizes failing cases automatically,
and supports state machine ("model-based") tests through `T.Repeat` and
the `StateMachine` interface. Its example tests a fixed-size queue
against a slice used as the model.

## Key claims

- What it does. "Rapid checks that properties you define hold for a large number of automatically generated test cases. If a failure is found, rapid automatically minimizes the failing test case before presenting it." (README)
- Supports model-based tests. "Support for state machine (\"stateful\" or \"model-based\") testing" (README, Features)
- Biased toward small values and edge cases. "Data generation biased to explore \"small\" values and edge cases more thoroughly" (README, Features)
- Keeps and reruns minimized failures. "Persistence and automatic re-running of minimized failing test cases" (README, Features)
- Compared with Go's built-in fuzzing: better at structured data and state machines, no coverage feedback. "Compared to testing.F.Fuzz, rapid shines in generating complex structured data, including state machine tests, but lacks coverage-guided feedback and mutations." (README, Comparison)
- Any rapid test can become a native fuzz target. "Note that with MakeFuzz, any rapid test can be used as a fuzz target for the standard fuzzer." (README, Comparison)
- T.Repeat runs a random sequence of actions; the "" action runs around every other action and holds invariant checks. "actions[\"\"], if set, is executed before/after every other action invocation and should only contain invariant checking code." (func (*T) Repeat)
- StateMachine's Check runs after every action. "Check is ran after every action and should contain invariant checks." (type StateMachine)
- Example: a queue tested against `var state []int // model of the queue`, with get, put and a size check after every step. (Example (Queue))

## Visuals worth redrawing

None.

## My notes

- The docs don't mention crash testing; that part comes from
  `bornholt-shardstore-2021`.

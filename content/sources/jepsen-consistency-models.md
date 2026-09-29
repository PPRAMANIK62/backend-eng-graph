---
id: jepsen-consistency-models
title: "Consistency Models"
author: Jepsen
url: https://jepsen.io/consistency/models
kind: docs
primary: false
---

## Summary

Jepsen's overview of consistency models. It defines the basic terms
(process, operation, invocation and completion time, concurrency,
history), says a consistency model is a set of allowed histories, and
shows a map of common models ordered by strength and coloured by how
available each can be.

## Key claims

- The map's arrows mean one model implies another. "Arrows show the relationship between consistency models." (top, map)
- Colours show availability on an asynchronous network. "Colors show how available each model is, for a distributed system on an asynchronous network." (top, map)
- The single-object chain. "For single-object models, strict serializable implies linearizable, which implies sequential, which implies causal." (top)
- Below causal. "Causal implies writes follow reads and PRAM. PRAM implies monotonic reads, monotonic writes,and read your writes." (top)
- Strict serializable joins the transactional and single-object families. "Strict serializable unifies two disjoint families of consistency models: those over multi-object transactions, and those for single object operations." (top)
- Which models can't be totally available. "All models at or stronger than cursor stability, snapshot isolation, and sequential cannot be totally available in asynchronous networks." (top)
- Sticky availability. "All models at or stronger than read your writes can be at most sticky available." (top)
- The weakest ones can be totally available. "Weaker models (of those listed here) can be totally available." (top)
- A process is logically single-threaded. "is a logically single-threaded program which performs computation and runs operations." (Processes)
- Operations have an invocation and, if they finish, a later completion time on an imagined perfect clock. "each operation has an invocation time and, should it complete, a strictly greater completion time, both given by an imaginary², perfectly synchronized, globally accessible clock." (Invocation & Completion Times)
- Concurrent means overlapping in time. "We say that two operations A and B are concurrent if there is some time during which A and B are both executing." (Concurrency)
- An operation that never completes may or may not have happened. "that operation has no completion time, and must, in general, be considered concurrent with every operation after its invocation. It may or may not execute." (Crashes)
- A consistency model is a set of histories. "A consistency model is a set of histories." (Consistency Models)
- Stronger means a subset. "We say that consistency model A implies model B if A is a subset of B." (Consistency Models)
- Smaller sets are called stronger. "Speaking informally, we refer to smaller, more restrictive consistency models as “stronger”, and larger, more permissive consistency models as “weaker”." (Consistency Models)
- Some models can't be compared. "Not all consistency models are directly comparable." (Consistency Models)
- Snapshot isolation and repeatable read are incomparable. "Neither model is strictly stronger than the other; we say Snapshot Isolation and Repeatable Read are incomparable." (Consistency Models)

## Visuals worth redrawing

- The clickable map of models at the top of the page (itself adapted
  from Bailis et al. and Viotti and Vukolić): arrows for "implies",
  colours for total, sticky or no availability.

## My notes

- No author is named on the page, so the author field says Jepsen.

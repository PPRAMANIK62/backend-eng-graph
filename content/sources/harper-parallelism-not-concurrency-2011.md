---
id: harper-parallelism-not-concurrency-2011
title: Parallelism Is Not Concurrency
author: Robert Harper
url: https://existentialtype.wordpress.com/2011/03/17/parallelism-is-not-concurrency/
kind: blog
primary: false
---

## Summary

A Carnegie Mellon programming-languages professor argues the two ideas
are unrelated: concurrency is about composing programs whose events
arrive in an order you don't control, parallelism is about running a
deterministic computation faster. Uses Quicksort's work and depth to
show parallelism as a property of the dependencies in a program.

## Key claims

- The two are separate ideas. "The first thing to understand is parallelism has nothing to do with concurrency." (para 3)
- Concurrency is about nondeterministic composition. "Concurrency is concerned with nondeterministic composition of programs (or their components)." (para 3)
- Parallelism is about efficiency of deterministic programs. "Parallelism is concerned with asymptotic efficiency of programs with deterministic behavior." (para 3)
- Concurrency means reacting to events you don't control, like a mouse click. "Concurrency is all about managing the unmanageable: events arrive for reasons beyond our control, and we must respond to them." (para 3)
- In parallelism the answer is fixed; only the speed varies. "The result is not in doubt, but there are many means of achieving it, some more efficient than others." (para 3)
- Work and depth: depth (the longest chain of dependencies) is a floor no number of processors can beat. "No matter how much parallelism we may have available, we can never run faster than the depth" (Quicksort section)
- Brent's principle: work w, depth d on p processors runs in O(max(w/p, d)). (theorem after the Quicksort section)

## Visuals worth redrawing

None.

## My notes

- Comments under the post push back: some say efficient parallel
  systems are almost always nondeterministic in practice. Not cited.
- Pike's framing (structure vs execution) and Harper's (nondeterminism
  vs determinism) agree that the two differ, but not on what the
  difference is.

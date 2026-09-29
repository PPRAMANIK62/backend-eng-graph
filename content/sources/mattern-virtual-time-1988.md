---
id: mattern-virtual-time-1988
title: Virtual Time and Global States of Distributed Systems
author: Friedemann Mattern
url: https://www.vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf
kind: paper
primary: true
---

## Summary

One of the two papers (with Fidge's) that introduced vector clocks, in
1988; this is the author's edited version of the workshop paper. Each
process keeps a vector with one entry per process; comparing two
vectors tells you whether two events are causally related or
concurrent, which a single Lamport counter can't.

## Key claims

- A single counter can't show that events are unrelated (the defect vector time fixes). "This is an important defect" (6)
- One entry per process. "we equip each process Pi with a clock Ci consisting of a vector of length n, where n is the total number of processes." (7)
- A process only ticks its own entry. "A process Pi ticks by incrementing its own component of its clock:" (7)
- Messages carry the whole vector, and the receiver takes the entry-by-entry maximum. "sup is the componentwise maximum operation" (7)
- The test for causality compares vectors both ways. "If the test succeeds, the events are causally related. Otherwise they are causally independent." (8)
- Version vectors, for replicated files, count updates per site. "version vector whose i-th component counts the" (9)
- Version vectors come from earlier work on detecting conflicting copies of replicated files. "Parker et al. show how vectors can be used to detect situations in which copies of a" (9)
- Only process i advances entry i, so it knows its own entry best. "Notice that since only process Pi can advance the i-th component of global time, it always has the most" (7)

## Visuals worth redrawing

- Figure 13: vector timestamps propagating along messages. Redrawn in
  vector-clocks with three processes.

## My notes

- The PDF text layer drops the "fi" and "fl" ligatures and some
  symbols, so quotes are kept to stretches without them.
- Parker et al.'s rule (section 9, words lost to ligatures in the text
  layer): if two version vectors are concurrent, a version conflict is
  signalled; if not, the copies can be reconciled and get the
  component-wise maximum.
- Theorem 10 is the key result: e happened before e' exactly when
  C(e) < C(e'), and they are concurrent exactly when neither vector is
  smaller.

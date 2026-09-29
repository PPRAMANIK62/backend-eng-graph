---
id: chandra-unreliable-failure-detectors-1996
title: Unreliable Failure Detectors for Reliable Distributed Systems
author: Tushar Deepak Chandra and Sam Toueg
url: https://www.cs.utexas.edu/~lorenzo/corsi/cs380d/papers/p225-chandra.pdf
kind: paper
primary: true
---

## Summary

The Journal of the ACM paper (1996) that turned failure detection into an
abstraction. A failure detector is a module on each process that keeps a
list of suspects and may be wrong. Classes of detectors are defined by
completeness (crashed processes get suspected) and accuracy (limits on
wrong suspicions). The paper shows which classes let you solve consensus,
that the eventual classes need a majority of correct processes, and that
consensus and atomic broadcast are equivalent. Read: abstract,
introduction, section 5 (the consensus problem), 6.3 and A.3. The scan's
text has OCR errors (◇ comes out as "O" or "0").

## Key claims

- Consensus and atomic broadcast can't be solved deterministically in an asynchronous system with one crash; the root cause is telling crashed from slow. "Essentially, the impossibility results for Consensus and Atomic Broadcast stem from the inherent difficulty of determining whether a process has actually crashed or is only “very slow.”" (1)
- Asynchronous means no timing assumptions at all. "Informally, a distributed system is asynchronous if there is no bound on message delay, clock drift, or the time necessary to execute a step." (1)
- Each process has a local failure detector module that keeps a suspect list and can make mistakes. "We assume that each failure detector module can make mistakes by erroneously adding processes to its list of suspects" (1)
- Modules at different processes may disagree. "at any given time the failure detector modules at two different processes may have different lists of suspects." (1)
- Detectors are defined by two properties. "completeness requires that a failure detector eventually suspects every process that actually crashes" and "accuracy restricts the mistakes that a failure detector can make." (1)
- The weakest class considered can make infinitely many mistakes and still suffice for consensus. "Such a failure detector can make an infinite number of mistakes" (1)
- If the detector misbehaves, a consensus algorithm built on it loses liveness, not safety. "the application may lose liveness but not safe(y." (1; OCR of "safety")
- A practical implementation: time out, and when a suspicion turns out wrong, lengthen the timeout for that process. "p removes q from its list of suspects, and increases the length of its timeout period for q in an attempt to prevent a similar mistake in the future." (1)
- Reason about the abstract properties, not a timeout mechanism. "the reader should refrain from thinking of failure detectors in terms of specific time-out mechanisms." (1)
- An alternative, from Isis: a process wrongly suspected is forced to crash. "a correct process that is wrongly suspected to have crashed, is forced to crash itself." (1, footnote 2)
- The consensus problem: every correct process eventually decides, decides at most once, no two correct processes decide differently, and the decided value was proposed. "Agreement. No two correct processes decide differently." (5)
- With detectors that are only eventually accurate, consensus needs a majority of correct processes. "Consensus can be solved if and only if a majority of the processes are correct." (A.3)
- Consensus and atomic broadcast reduce to each other. "We prove that Consensus and Atomic Broadcast are redueible to each other in asynchronous systems with crash failures" (Abstract; "redueible" is OCR for "reducible")
- Partial synchrony can be seen as a way to build such a detector. "we argue that partial synchrony assumptions can be encapsulated in the unreliability of failure detectors." (1)

## Visuals worth redrawing

- Figure 1: the eight classes of failure detectors, by completeness and accuracy.

## My notes

- The companion paper (Chandra, Hadzilacos, Toueg) proves ◇W is the
  weakest detector for consensus; not opened, only cited here through
  this paper's introduction.

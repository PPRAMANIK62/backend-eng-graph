---
id: shapiro-crdts-sss-2011
title: Conflict-free Replicated Data Types
author: Marc Shapiro, Nuno Preguiça, Carlos Baquero, Marek Zawirski
url: https://inria.hal.science/hal-00932836/document
kind: paper
primary: true
---

## Summary

The SSS 2011 conference paper that defines strong eventual consistency
(SEC) formally and shows state-based and op-based CRDTs both give it.
Shorter than the INRIA report; its value here is the SEC definition,
the CAP discussion, and the proof that SEC and sequential consistency
don't contain each other.

## Key claims

- Eventual consistency as usually built may apply an update, find a conflict and roll back. "Several EC systems will execute an update immediately, only to discover later that it conflicts with another, and to roll back to resolve this conflict [20]." (2.2)
- Rolling back consistently needs consensus. "This constitutes a waste of resources, and in general requires a consensus to ensure that all replicas arbitrate conflicts in the same way." (2.2)
- Eventual consistency, informally: agree once clients stop writing. "Informally, eventual consistency means that replicas eventually reach the same final value if clients stop submitting updates." (2.2)
- SEC adds strong convergence: same updates delivered, same state. "Correct replicas that have delivered the same updates have equivalent state" (Definition 3)
- A SEC replica stays available for reads and writes. "A SEC replica is always available for both reads and writes, independently of network conditions." (3.1)
- Any connected group of replicas converges even while partitioned. "Any communicating subset of replicas of a SEC object eventually converges, even if partitioned from the rest of the network." (3.1)
- SEC needs no consensus. "Remarkably, SEC does not require to solve consensus." (3.1)
- An add-wins set can reach a state no sequential execution allows: p0 does add(e); remove(e′), p1 does add(e′); remove(e), and after merging both are in. "Such a state would never occur in a sequentially-consistent execution, in which either remove(e) or remove(e′ ) must be last." (3.3)
- Concurrent add and remove of one element has several valid rules. "the add could win, or the remove could win, or the update of the replica with the highest IP address could win" (3.3)

## Visuals worth redrawing

- Figures 1 and 2: state-based and op-based replication timelines.

## My notes

- The companion INRIA report (shapiro-comprehensive-crdts-2011) has the full catalogue of types.

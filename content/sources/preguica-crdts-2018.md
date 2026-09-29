---
id: preguica-crdts-2018
title: Conflict-free Replicated Data Types
author: Nuno Preguiça, Carlos Baquero, Marc Shapiro
url: https://arxiv.org/pdf/1805.06358
kind: paper
primary: true
---

## Summary

A short encyclopedia entry (arXiv 1805.06358, 2018) by three of the
people who defined CRDTs. It separates what a developer cares about
(the concurrency semantics: what happens when two updates race) from
what a system builder cares about (the synchronization model: state,
operations or deltas), then lists what CRDTs can't do and where
research is going.

## Key claims

- Definition: any replica can be modified without coordinating, and replicas with the same updates reach the same state. "(i) any replica can be modified without coordinating with another replicas; (ii) when any two replicas have received the same set of updates, they reach the same state, deterministically" (Definition)
- For an assignment, there's no single right answer under concurrency. "If the initial value is 0, the correct outcome for concurrently assigning 1 and 2 is not well defined." (Concurrency semantics)
- Add-wins set: a concurrent add and remove leaves the element in. "in the presence of two operations that do not commute, a concurrent add and remove of the same element, the add wins leading to a state where the element belongs to the set." (Concurrency semantics)
- Remove-wins is the opposite choice. "in the presence of a concurrent add and remove of the same element, the remove wins leading to a state where the element is not in the set." (Concurrency semantics)
- Clock timestamps with a site id give a total order, but with skew it may not respect happens-before. "Due to the clock skew among multiple nodes, although these timestamps approximate an ideal global physical time, they do not necessarily respect the happens-before relation." (Concurrency semantics)
- Hybrid logical clocks are one fix. "This can be achieved by combining physical and logical clocks, as shown by Hybrid Logical Clocks (Kulkarni et al 2014)" (Concurrency semantics)
- Multi-value register keeps all concurrent writes; LWW register keeps one. "In the multi-value register, all concurrently written values are kept." (Register)
- State-based convergence needs a semilattice, updates that only inflate, and merge as the join. "producing a new state that is larger or equal to the original state" (Synchronization Model)
- Op-based needs reliable delivery, usually causal. "Most operation-based CRDT design require causal delivery." (Synchronization Model)
- Delta-state CRDTs ship only recent changes; the first contact needs the full state. "The first time a replica communicates with some other replica, the full state needs to be propagated." (Synchronization Model, Alternative models)
- 2P-Set breaks the normal meaning of a set because you can't re-add. "The two-phase set CRDT (2PSet), does not allow re-adding an element that was removed, and thus it breaks the common sequential semantics." (Preservation of sequential semantics)
- Some CRDT states can't be explained by any sequential order. "Not all CRDTs need or can be explained by sequential executions." (Extended behaviour under concurrency, figure 2)
- In CAP terms, CRDTs choose availability. "the CRDT conflict-free approach favors availability over consistency when facing communication disruptions." (Guaranties and limitations)
- Reads don't show remote writes that haven't arrived yet. "reads will not reflect operations accepted in remote replicas that have not yet been propagated to the local replica." (Guaranties and limitations)
- Per object, CRDTs give causal consistency. "Both state based CRDTs, and operation based CRDTs when supported by reliable causal delivery, provide per-object causal consistency." (Guaranties and limitations)
- Some operations need global agreement, like closing an auction. "However, closing the auction and selecting a single winning bid will require global agreement." (Guaranties and limitations)
- Escrow: a bounded counter gives each replica a quota of decrements. "the Bounded Counter CRDT (Balegas et al 2015b) defines a counter that never goes negative, by assigning to each replica a number of allowed decrements" (Guaranties and limitations)
- When the quota runs out, the replica fails or synchronizes. "After a replica exhaust its allowed decrements, a new decrement will either fail or require synchronizing with some replica that still can decrement." (Guaranties and limitations)
- Commercial systems using CRDTs when written: Riak, Redis and Akka. "The following commercial systems use CRDT" (Examples of applications)
- Causality metadata grows with the number of replicas and limits scale past a few hundred. "the metadata cost from causality tracking can limit the scalability of CRDTs when aiming for more than a few hundred replicas." (Future directions, Scalability)
- Any replica with access can wreck shared state. "For instance, delete operations can remove all existing state." (Future directions, Security)

- Wall-clock time plus a site id gives unique, totally ordered timestamps. "When combining the clock time with a site identifier, we have unique timestamps that are totally ordered." (Concurrency semantics)
- A later write replaces all the concurrent values of a multi-value register. "We also note that a follow up write can overwrite both a single value and multiple values." (Extended behaviour under concurrency)
- Why no sequential order explains the add-wins result of figure 2. "in any sequential extension of the causal order a remove operation would always be the last operation, and consequently the removed element could not belong to the set." (Extended behaviour under concurrency)

## Visuals worth redrawing

- Figure 1: add-wins set run on two replicas.
- Figure 2: add-wins run with a final state no sequential order explains ({a, b} after each replica removed one).

## My notes

- Dated 2018; the list of commercial users is from then.

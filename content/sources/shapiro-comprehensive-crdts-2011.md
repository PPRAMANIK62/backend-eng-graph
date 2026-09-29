---
id: shapiro-comprehensive-crdts-2011
title: A comprehensive study of Convergent and Commutative Replicated Data Types
author: Marc Shapiro, Nuno Preguiça, Carlos Baquero, Marek Zawirski
url: https://inria.hal.science/inria-00555588/document
kind: paper
primary: true
---

## Summary

The INRIA research report (RR-7506, 2011) that named CRDTs and laid out
the catalogue. It defines state-based (convergent, CvRDT) and op-based
(commutative, CmRDT) replication, gives a sufficient condition for each
to converge, and specifies counters, registers, sets, graphs and
sequences, with the anomalies of the simpler designs. Section 4 covers
the garbage (tombstones) CRDTs pile up.

## Key claims

- The idea: pick data types whose maths guarantees convergence, instead of ad-hoc reconciliation. "We propose the concept of a convergent or commutative replicated data type (CRDT), for which some simple mathematical properties ensure eventual consistency." (1 Introduction)
- An update runs locally, with no waiting. "As a CRDT requires no synchronisation, an update executes immediately, unaffected by network latency, faults, or disconnection." (1)
- No consensus means real limits. "Since, by design, a CRDT does not use consensus, the approach has strong limitations" (1)
- Some designs grow without bound, and cleaning up needs a weak form of synchronisation. "Some of our designs suffer from unbounded growth; collecting the garbage requires a weak form of synchronisation" (1)
- State-based: the update happens at the source, then whole states are shipped and merged. "In state-based (or passive) replication, an update occurs entirely at the source, then propagates by transmitting the modified payload between replicas" (2.2.1)
- Op-based: operations are shipped, and need reliable broadcast in a delivery order. "we assume an underlying system reliable broadcast that delivers every update to every replica in an order <d (called delivery order) where the downstream precondition is true." (2.2.2)
- The merge (least upper bound) is commutative, idempotent and associative. "It follows from the definition that ⊔v is: commutative: x ⊔v y =v y ⊔v x; idempotent: x ⊔v x =v x; and associative" (2.3.1)
- Because merge is idempotent and commutative, the network can lose, reorder or duplicate messages. "Since merge is idempotent and commutative (by the properties of ⊔v ), messages may be lost, received out of order, or multiple times, as long as new state eventually reaches all replicas, either directly or indirectly via successive merges." (2.3.1)
- Op-based: if concurrent operations commute, every replica converges. "If all concurrent operations commute, then all execution orders consistent with delivery order are equivalent, and all replicas converge to the same state." (2.3.2)
- Causal delivery is enough for the types in the paper and needs no consensus. "causal delivery <→ (which is readily implementable in static distributed systems and does not require consensus) satisfies delivery order <d" (2.3.2)
- Trade-off: state-based is simple and tolerates weak channels but ships big states; op-based needs reliable broadcast. "However, sending state may be inefficient for large objects; this can be tackled by shipping deltas" (2.4) and "Op-based replication is more demanding of the channel, since it requires reliable broadcast, which in general requires tracking group membership." (2.4)
- Each style can emulate the other. "Interestingly, it is always possible to emulate a state-based object using the operation-based approach, and vice-versa." (2.4.1)
- A single integer merged with max loses concurrent increments. "They converge to 1 instead of the expected 2." (3.1.2)
- Merging by adding isn't a CRDT because it isn't idempotent. "Suppose instead the payload is an integer and merge adds the two values. This is not a CvRDT, as merge is not idempotent." (3.1.2)
- G-Counter: one entry per replica, merge by per-entry max, value is the sum. "The payload is vector of integers; each source replica is assigned an entry. To increment, add 1 to the entry of the source replica. The value is the sum of all entries." (3.1.2) and "Merge takes the maximum of each entry." (3.1.2)
- It assumes no overflow and a known set of replicas. "This version makes two important assumptions: the payload does not overflow, and the set of replicas is well-known." (3.1.2)
- PN-Counter is two G-Counters, one for increments and one for decrements. "Its payload consists of two vectors: P to register increments, and N for decrements." (3.1.3)
- A non-negative counter can't be kept by local checks: two replicas at 1 can both decrement. "two replicas at value 1 might still concurrently decrement, and the value converges to −1." (3.1.4)
- The fallback is to synchronise, for example by reserving decrements in advance (escrow). "Sadly, the remaining alternative is to synchronise." (3.1.4)
- Concurrent assigns to a register don't commute; either one wins or both are kept. "two major approaches are that one takes precedence over the other (LWW-Register, Section 3.2.1), or that both are retained (MV-Register, Section 3.2.2)." (3.2)
- LWW timestamps are assumed unique, totally ordered and consistent with causality. "Timestamps are assumed unique, totally ordered, and consistent with causal order" (3.2.1)
- The multi-value register keeps concurrent values, tagged with version vectors. "To detect concurrency, a scalar timestamp (as above) is insufficient. Therefore the state-based payload is a set of (X, versionVector) pairs" (3.2.2)
- Amazon's shopping cart anomaly: a removed item can come back. "As noted in the Dynamo article [10], Amazon's shopping cart presents an anomaly, whereby a removed book may re-appear." (3.2.2)
- Add and remove don't commute, so a CRDT set can only approximate a sequential set. "Therefore, a Set cannot both be a CRDT and conform to the sequential specification of a set." (3.3)
- A naive replicated set diverges even with causal delivery. "Both Replica 1 and Replica 3 have applied all operations in causal order, yet they diverge." (3.3)
- 2P-Set: the remove set is a tombstone set, and a removed element can't come back. "In 2P-Set (Section 3.3.2), a removed element can never be added again" (3.3.5)
- LWW-element-Set: each add and remove carries a timestamp, and an element is in the set unless a remove has a higher timestamp. "attaches a timestamp to each element (rather than to the whole set, as in Figure 8)." (3.3.3)
- OR-Set: tag each add uniquely; a remove deletes only the tags it saw. "When removing an element, all associated unique tags observed at the source replica are removed, and only those." (3.3.5)
- So a concurrent add wins over a remove. "When add(e) is concurrent with remove(e), the add takes precedence, as the unique tag generated by add cannot be observed by remove." (3.3.5)
- Tombstones pile up in practice. "Our practical experience with CRDTs shows that they tend to become inefficient over time, as tombstones accumulate and internal data structures become unbalanced" (4)
- Cleaning them up needs a known set of replicas that don't crash for good. "Liveness of Φ requires that the set of replicas be known and that they not crash permanently (undetectably)." (4.1)

- The G-Counter design came from vector clocks. "We propose instead the construct of Specification 6 (inspired by vector clocks)." (3.1.2)
- The op-based counter is just an integer, because add and subtract commute. "Its payload is an integer." (3.1.1)
- A multi-value register can merge concurrent assigns by union, as Amazon's cart did, and a later assign collapses them. "Clients can later reduce multiple values to a single one, by a new assignment." (3.2.2) and "for instance taking their union, as in file systems such as Coda [19] or in Amazon's shopping cart [10]." (3.2.2)
- Ad-hoc reconciliation has a poor record (footnote: the Amazon cart). "There is little theoretical guidance on how to design a correct optimistic system, and ad-hoc approaches have proven brittle and error-prone." (1)

## Visuals worth redrawing

- Figure 11: the naive op-based set that diverges under concurrent add and remove.
- Figure 14: the OR-Set with unique tags α and β, where the concurrent add survives.
- Figure 5: an integer with max as merge (the simplest CvRDT).

## My notes

- Section 2 says linearisability "requires consensus in general", so CRDTs settle for something weaker.
- The later SSS 2011 paper (hal-00932836) names the model "strong eventual consistency"; its definition also appears in preguica-crdts-2018 and kleppmann-interleaving-anomalies-2019.

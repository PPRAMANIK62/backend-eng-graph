---
id: sun-ot-crdt-2020
title: Real Differences between OT and CRDT under a General Transformation Framework for Consistency Maintenance in Co-Editors
author: Chengzheng Sun, David Sun, Agustina Ng, Weiwei Cai, Bryden Cho
url: https://arxiv.org/pdf/1905.01518
kind: paper
primary: false
---

## Summary

A paper (PACMHCI, GROUP 2020) by long-time OT researchers arguing that
CRDTs for text editing are not the clean break they're sold as: they
also transform operations, just indirectly, by turning positions into
identifiers and back. It is one side of an open argument, and says so
openly: it sets out to refute CRDT claims.

## Key claims

- OT is older and widely deployed. "OT (Operational Transformation) was invented for supporting real-time co-editors in the late 1980s and has evolved to become a collection of core techniques widely used in today's working co-editors and adopted in major industrial products." (Abstract)
- Text CRDTs date from WOOT. "CRDT (Commutative Replicated Data Type) for co-editors was first proposed around 2006, under the name of WOOT (WithOut Operational Transformation)." (Abstract)
- Their observation of practice. "Over one decade later, however, CRDT is rarely found in working co-editors, and OT remains the choice for building the vast majority of today's co-editors." (Abstract)
- Their central claim: CRDTs transform too, indirectly. "we reveal that CRDT is like OT in following a general transformation approach, but achieves the same transformation indirectly, in contrast to OT direct transformation approach" (Abstract)
- WOOT gives every character an immutable identifier and keeps deleted ones as tombstones. "The first is a sequence of data objects, each of which is assigned with an immutable identifier and associated with either an existing character in the external document (visible to the user) or a deleted character (this internal object is then called a tombstone" (3.2.1)
- A text CRDT turns a position into an identifier locally, and back into a position at the other end. "The CRDT solution converts the external position-based input operation into an internal identifier-based operation, applies the identifier-based operation to the internal object sequence, and propagates the identifier-based operation, to remote sites via a suitable external communication service." (3.2.1)
- OT operations are kept only until nothing concurrent can still arrive. "As soon as there is no future operation that could possibly be concurrent with the operations in the buffer (a general garbage collection condition for OT) [56,68,85], those operations can be garbage collected and the buffer can be reset" (3.1)
- Their stance is explicit. "revealed facts and evidences that refute CRDT claims over OT on all accounts." (Abstract)
- How CRDT work has described OT. "CRDT solutions have made broad claims of superiority over OT solutions, and routinely portrayed OT as an incorrect, complex and inefficient technique." (Abstract)
- CRDTs get commutativity indirectly, at a cost. "CRDT is not natively commutative for concurrent co-editing operations, but has to achieve the same OT commutativity indirectly as well, with consequential correctness and complexity issues." (Abstract)

## Visuals worth redrawing

- Figure 1: WOOT's object sequence with tombstones. Not redrawn.

## My notes

- Marked primary: no. It's an analysis by OT authors, not by the people
  who built the CRDTs it discusses. Use only to show the disagreement.

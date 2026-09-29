---
id: jepsen-snapshot-isolation
title: Snapshot Isolation (Jepsen consistency models)
author: Kyle Kingsbury (Jepsen)
url: https://jepsen.io/consistency/models/snapshot-isolation
kind: docs
primary: false
---

## Summary

Jepsen's reference page for snapshot isolation: what it guarantees, what
it allows (write skew, a read-only anomaly), how it relates to read
committed and serializability, and why papers define it differently.

## Key claims

- The definition in one paragraph. "In a snapshot isolated system, each transaction appears to operate on an independent, consistent snapshot of the database." (intro)
- Commit makes all changes visible at once to later transactions. "Its changes are visible only to that transaction until commit time, when all changes become visible atomically to any transaction which begins at a later time." (intro)
- The write conflict rule. "If transaction T₁ has modified an object x, and another transaction T₂ committed a write to x after T₁’s snapshot began, and before T₁’s commit, then T₁ must abort." (intro)
- Main anomalies: write skew and a read-only anomaly. "The most notable phenomena allowed by snapshot isolation are write skews, which allow transactions to read overlapping state, modify disjoint sets of objects, then commit; and a read-only transaction anomaly, involving partially disjoint write sets." (intro)
- SI implies read committed. "Snapshot isolation implies read committed." (intro)
- No real-time promise: a later transaction may not see a finished write. "However, it does not impose any real-time constraints." (intro)
- A process can fail to see its own earlier writes in a later transaction. "In fact, a process can fail to observe its own prior writes, if those writes occurred in different transactions." (intro)
- Papers disagree on how strict SI is. "Papers vary in how strictly they constrain snapshot isolation’s allowed histories." (Formally)
- Jepsen's reading: cycles with two adjacent rw edges are allowed. "Cycles involving two adjacent read-write dependencies are allowed." (Formally)
- Berenson et al. defined SI first. "Berenson et al. first defined snapshot isolation in terms of an abstract algorithm:" (Formally)
- A finished write may not be seen by a read that starts after it. "If process A completes write w, then process B begins a read r, r is not necessarily guaranteed to observe w." (intro)

## Visuals worth redrawing

None.

## My notes

- The real-time point matters for distributed databases with SI more
  than for a single Postgres server.

---
id: almeida-delta-state-crdts-2016
title: Delta State Replicated Data Types
author: Paulo Sérgio Almeida, Ali Shoker, Carlos Baquero
url: https://arxiv.org/pdf/1603.01529
kind: paper
primary: true
---

## Summary

The paper (arXiv 1603.01529v1, 2016) that defines delta-state CRDTs:
state-based CRDTs whose mutators return a small delta instead of the
whole new state. Deltas are joined like states, so they keep the
state-based tolerance of lost, duplicated and reordered messages while
sending messages about as small as op-based ones.

## Key claims

- The two classic styles and their costs: full state, or ops over exactly-once delivery. "state-based CRDTs ensure convergence through disseminating the entire state, that may be large, and merging it to other replicas; whereas operation-based CRDTs disseminate operations (i.e., small states) assuming an exactly-once reliable dissemination layer." (Abstract)
- Delta-CRDTs get small messages over unreliable channels. "small messages with an incremental nature, as in operation-based CRDTs, disseminated over unreliable communication channels, as in traditional state-based CRDTs." (Abstract)
- Op-based needs reliable exactly-once causal broadcast, which is hard even over TCP. "they assume a message dissemination layer that guarantees reliable exactly-once causal broadcast; these guarantees are hard to maintain since large logs must be retained to prevent duplication even if TCP is used" (1 Introduction)
- State size grows: a counter's vector grows with replicas, a set with its elements. "the state size of a counter CRDT (a vector of integer counters, one per replica) increases with the number of replicas; whereas in a grow-only Set, the state size depends on the set size" (1)
- So full-state shipping only suits small types. "This communication overhead limits the use of state-based CRDTs to data-types with small state size (e.g., counters are reasonable while large sets are not)." (1)
- Deltas keep join idempotent, so convergence survives unreliable delivery. "Our aim is to ship a representation of the effect of recent update operations on the state, rather than the whole state, while preserving the idempotent nature of join." (1)
- Deltas are state fragments and often must be merged in causal order to keep the semantics. "The challenge in δ-CRDT is that individual deltas are now “state fragments” and usually must be causally merged to maintain the desired semantics." (1)
- Network model: messages may be lost, duplicated or reordered. "The network is unreliable: messages can be lost, duplicated or reordered (but are not corrupted)." (2 System Model)
- CRDTs were deployed at scale when written. "Though CRDTs are deployed in practice and support millions of users worldwide [6,7,8], more work is still required to improve their design and performance." (1)

## Visuals worth redrawing

None needed; the counter example in section 4 is easy to redraw as a delta beside a full state.

## My notes

- The paper mentions Riak DT Maps as a motivating large-state type.

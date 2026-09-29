---
id: jepsen-strict-serializable
title: Strict Serializability (Jepsen consistency models)
author: Kyle Kingsbury (Jepsen)
url: https://jepsen.io/consistency/models/strict-serializable
kind: docs
primary: false
---

## Summary

Jepsen's reference page for strict serializability: serializability's
single order of whole transactions, plus linearizability's rule that
the order respects real time.

## Key claims

- Other names. "Strong Serializability (a.k.a. Strict Serializability, Strict PL-SS, Strong 1SR, etc.)" (Informally)
- The real-time rule. "if operation A completes before operation B begins, then A should appear to precede B in the serialization order." (Informally)
- It's transactional and atomic. "Strict serializability guarantees that operations take place atomically: a transaction’s sub-operations do not appear to interleave with sub-operations from other transactions." (Informally)
- It covers the whole system, predicates included. "strict serializability applies not only to the particular objects involved in a transaction, but to the system as a whole–operations may act on predicates" (Informally)
- It can't stay available in a partition. "Strict serializability cannot be totally or sticky available; in the event of a network partition, some or all nodes will be unable to make progress." (Informally)
- It implies both parents. "Strict serializability implies serializability and linearizability." (Informally)
- Another way to see it. "you can think of a strict serializable database as a linearizable object in which the object’s state is the entire database." (Informally)
- The formal definition dates from Herlihy and Wing. "When Herlihy and Wing introduced linearizability, they defined strict serializability in terms of a serializable system which is compatible with real-time order." (Formally)

## Visuals worth redrawing

None.

## My notes

- Secondary: Jepsen's summary of the literature, not the original
  definition.

---
id: helland-life-beyond-distributed-transactions-2007
title: "Life beyond Distributed Transactions: an Apostate's Opinion"
author: Pat Helland
url: https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf
kind: paper
primary: false
---

## Summary

A CIDR 2007 position paper by a long-time builder of transaction
systems, written while at Amazon. It argues that very large
applications don't use distributed transactions, and names what they
do instead: entities that are updated atomically one at a time, and
workflow built from tentative operations that are later confirmed or
cancelled.

## Key claims

- Helland was long an advocate of transactions. "Personally, I have invested a nontrivial portion of my career as a strong advocate for the implementation and use of platforms providing guarantees of global serializability." (1)
- Large apps avoid distributed transactions because of cost and fragility. "When they attempt to use distributed transactions, the projects founder because the performance costs and fragility make them impractical." (Abstract)
- 2PC can block when nodes are down. "This includes 2PC (two phase commit) which can easily block when nodes are unavailable" (1, Scopes of transactional serializability)
- Atomic transactions stop at the edge of one machine or cluster. "You cannot perform atomic transactions across these disjoint scopes of transactional serializability." (1)
- Without distributed transactions, uncertainty moves into business logic. "The uncertainty of the outcome is held in the business semantics rather than in the record lock. This is simply workflow." (6, Uncertainty at a distance)
- A tentative operation asks for a commitment that can still be cancelled. "This is done by sending a message which requests a commitment but leaves open the possibility of cancellation." (6, Performing tentative business operations)
- Every tentative operation ends one way or the other. "Every tentative operation eventually confirms or cancels." (6, Tentative operations, confirmation, and cancellation)
- The warehouse example: reserving inventory is accepting uncertainty. "If an ordering system reserves inventory from a warehouse, the warehouse allocates the inventory without knowing if it will be used." (6, Activities and the management of uncertainty)
- The escrow company in a house purchase is an example of managed uncertainty. "Consider a house purchase and the relationships with the escrow company." (6)
- Workflow is harder than distributed transactions but matches how businesses work. "While more complicated to implement than simply using distributed transactions, it is how the real world works" (6)
- Messages arrive at least once, so processing must be idempotent. "the application must tolerate message retries and the out-of-order arrival of some messages." (1, Most applications use at-least-once messaging)

## Visuals worth redrawing

None.

## My notes

- A position paper: opinions, stated as such. The author says the views
  are his own, not his employer's.
- It doesn't use the word saga; tentative, confirm and cancel are the
  same idea from the business side.

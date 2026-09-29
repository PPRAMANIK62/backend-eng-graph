---
id: haerder-transaction-recovery-1983
title: "Principles of Transaction-Oriented Database Recovery"
author: Theo Haerder, Andreas Reuter
url: https://cs-people.bu.edu/mathan/reading-groups/papers-classics/recovery.pdf
kind: paper
primary: true
---

## Summary

A 1983 ACM Computing Surveys paper (vol. 15, no. 4) that sets out
terms for database recovery. Its first section defines the four
properties of a transaction and gives them the name ACID. Read from a
copy hosted by a Boston University reading group.

## Key claims

- The name ACID comes from here. "These four properties, atomicity, consistency, isolation, and durability (ACID), describe the major highlights of the transaction paradigm" (1.1)
- They meant it as a test for a system. "We therefore consider the question of whether the transaction is supported by a particular system to be the ACID test of the system's quality." (1.1)
- Atomicity: all or nothing, and the user knows which. "It must be of the all-or-nothing type described above, and the user must, whatever happens, know which state he or she is in." (1.1, Atomicity)
- Consistency: a transaction that commits leaves the database consistent; correctness is by definition. "In other words, each successful transaction by definition commits only legal results." (1.1, Consistency)
- Isolation: a transaction's events are hidden from concurrent ones, so it can be reset. "Events within a transaction must be hidden from other transactions running concurrently." (1.1, Isolation)
- Durability: committed results survive later failures. "the system must guarantee that these results survive any subsequent malfunctions." (1.1, Durability)
- A bad but committed transaction can only be undone by another transaction. "the effects of an inevitable incorrect transaction (i.e., the transaction containing faulty data) can only be removed by countertransactions." (1.1, Durability)
- The name "transaction" in databases comes from Eswaran et al. "This ambitious concept was restricted to use in database systems by Eswaran et al. [1976] and given its current name" (1.1)

## Visuals worth redrawing

- Figure 2: three ways a transaction ends (commit, abort by the
  program, abort by the system).

## My notes

- Consistency here is defined as "contains the results of successful
  transactions" (1.3); it relies on each transaction being correct,
  which the database can't check.

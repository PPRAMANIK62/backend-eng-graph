---
id: microsoft-saga-pattern
title: Saga distributed transactions pattern (Azure Architecture Center)
author: Microsoft (Azure Architecture Center)
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/saga
kind: docs
primary: false
---

## Summary

Microsoft's pattern page for sagas across microservices, last revised
in 2025. It names the three kinds of step (compensable, pivot,
retryable), compares choreography and orchestration, lists the data
anomalies sagas allow and the countermeasures for them.

## Key claims

- A saga is a sequence of local transactions, each triggering the next. "The Saga pattern manages transactions by breaking them into a sequence of local transactions." (Solution)
- Failure triggers compensations in reverse. "If a local transaction fails, the saga performs a series of compensating transactions to reverse the changes that the preceding local transactions made." (Solution)
- Compensable steps can be undone. "Compensable transactions can be undone or compensated for by other transactions with the opposite effect." (Key concepts)
- The pivot is the point of no return. "Pivot transactions serve as the point of no return in the saga." (Key concepts)
- After the pivot, every step must complete. "All subsequent actions must be completed for the system to achieve a consistent final state." (Key concepts)
- Retryable steps come after the pivot and must be idempotent. "Retryable transactions follow the pivot transaction. Retryable transactions are idempotent" (Key concepts)
- Compensations can fail too. "Compensating transactions might not always succeed, which can leave the system in an inconsistent state." (Problems and considerations)
- No isolation across services. "there's no built-in isolation across services." (Potential data anomalies)
- Typical anomalies: lost updates, dirty reads, fuzzy (nonrepeatable) reads. "Dirty reads: When a saga or transaction reads data that another saga has modified, but the modification isn't complete." (Potential data anomalies)
- Semantic lock countermeasure. "Semantic lock: Use application-level locks when a saga's compensable transaction uses a semaphore to indicate that an update is in progress." (Strategies)
- Commutative updates countermeasure. "Design updates so that they can be applied in any order while still producing the same result." (Strategies)
- Pessimistic view: reorder so updates happen in retryable steps. "Reorder the sequence of the saga so that data updates occur in retryable transactions to eliminate dirty reads." (Strategies)
- Reread values before updating. "Confirm that data remains unchanged before you make updates." (Strategies)
- Mixing: sagas for low-risk updates, distributed transactions for high-risk ones. "For example, use sagas for low-risk updates and distributed transactions for high-risk updates." (Strategies, risk-based concurrency)
- Choreography's cost: the flow is hard to follow. "It's difficult to track which commands each saga participant responds to." (Choreography, drawbacks)
- Orchestration's cost: a central point of failure. "Introduces a point of failure because the orchestrator manages the complete workflow." (Orchestration)

## Visuals worth redrawing

- The saga overview, choreography and orchestration diagrams. Not
  redrawn as such; the node draws its own example.

## My notes

- The countermeasure names (semantic lock, commutative updates,
  pessimistic view, reread value, version file) come from Chris
  Richardson's Microservices Patterns, chapter 4, which the
  microservices.io page cites; the book wasn't opened.

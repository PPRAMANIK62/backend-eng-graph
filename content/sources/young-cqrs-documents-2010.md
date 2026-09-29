---
id: young-cqrs-documents-2010
title: CQRS Documents
author: Greg Young
url: https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf
kind: paper
primary: true
---

## Summary

A 56-page collection by the person who named CQRS: task-based UIs,
command and query separation at the architecture level, event sourcing
as the storage for the command side, rolling snapshots, and a minimal
event store on two relational tables with an optimistic concurrency
check.

## Key claims

- CQRS grew out of Bertrand Meyer's command-query separation. "Command and Query Responsibility Segregation (CQRS) originated with Bertrand Meyer’s Command and Query Separation Principle." (CQRS, Origins)
- The difference: objects are split into one for commands and one for queries. "The fundamental difference is that in CQRS objects are split into two objects, one containing the Commands one containing the Queries." (CQRS, Origins)
- Example: CustomerService split into CustomerWriteService and CustomerReadService. (CQRS, Listings 2 and 3)
- The two sides have different needs: consistency, storage and scale. "Most systems can be eventually consistent on the Query side." (CQRS)
- Command side stores normalized data, query side denormalized. "The Query side would want data in a denormalized way to minimize the number of joins needed to get a given set of data." (CQRS)
- One model can't serve search, reporting and transactions well. "It is not possible to create an optimal solution for searching, reporting, and processing transactions utilizing a single model." (CQRS)
- Events are named as verbs in the past tense. "It is absolutely imperative that events always be verbs in the past tense" (Events)
- Commands ask for an operation (and can be rejected); events record an action that already occurred. "perform an operation where as events are a recording of the action that occurred." (Events)
- There is no delete: you append an event that reverses the effect. "it is necessary to model a delete explicitly as a new transaction" (There is no Delete)
- Rolling snapshot: a stored copy of an aggregate's state at a point in the stream, so loading replays only later events. "A Rolling Snapshot is a denormalization of the current state of an aggregate at a given point in time." (Rolling Snapshots)
- Minimal event store: an Events table (AggregateId, Data, Version) and an Aggregates table with the current version. (Building an Event Storage)
- Version is unique and sequential per aggregate, because an aggregate is a consistency boundary. "The version number is unique and sequential only within the context of a given aggregate." (Building an Event Storage)
- Only two operations: read an aggregate's events in order, and append events with an expected version, in a transaction, raising a concurrency error if the version moved. "if expectedversion != version" / "raise concurrency problem" (Building an Event Storage, Listing 5)
- CQRS was long confused with CQS. "For a long time it was discussed simply as CQS at a higher level." (CQRS, Origins)
- In web systems the query side handles far more traffic than the command side. "Query: In most systems, especially web systems, the Query side generally processes a very large number of transactions as a percentage of the whole" (CQRS, Scalability)
- The customer service example lists MakeCustomerPreferred and other commands alongside queries. "void MakeCustomerPreferred(CustomerId)" (CQRS, Listing 1)

## Visuals worth redrawing

- Listing 5's write path as a small flow: read version, compare with expected, insert events, update version, commit.

## My notes

- The PDF isn't dated inside; the URL path puts it at 2010.
- Young coined CQRS, so primary: true for CQRS and for his event store
  design.

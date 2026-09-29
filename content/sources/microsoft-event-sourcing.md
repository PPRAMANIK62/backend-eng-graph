---
id: microsoft-event-sourcing
title: Event Sourcing pattern (Azure Architecture Center)
author: Microsoft
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing
kind: docs
primary: false
---

## Summary

Microsoft's current pattern page. Event store as the system of record,
per-entity streams replayed to rehydrate state, projections for reads,
optimistic concurrency on append, snapshots, versioning strategies
(tolerant readers, upcasting), idempotent handlers, personal data and
crypto-shredding, and a clear list of when not to use it.

## Key claims

- Warning up front: complex, costly to migrate to or from, not for most systems. "For most systems and most parts of a system, traditional data management is sufficient." (Important note)
- Each entity has its own stream; current state comes from replaying it ("rehydration"). "Applications derive the current state of an entity by replaying all the events in its stream." (Solution)
- Projections (materialized views) serve reads because replaying is costly. "Applications typically implement materialized views because it's costly to read and replay events." (Solution)
- Optimistic concurrency: the store rejects an append if the stream changed since it was read; the handler reloads and retries. "Event stores address this scenario by using optimistic concurrency control and reject an append if the stream changed since it was read." (Pattern advantages)
- Record intent, not resulting state: "two seats were reserved" beats "remaining seats changed to 42". "State-focused events reduce the event store to a change log that has no business meaning." (Problems and considerations, Event design)
- Projections are eventually consistent. "The system is only eventually consistent when it creates materialized views or generates projections of data by replaying events." (Eventual consistency)
- Never edit events; undo with a compensating event. "The only way to update an entity or undo a change is to add a compensating event to the event store." (Versioning events)
- Bad events from a bug stay in the store. "Fixing the bug in application code doesn't fix the historical events" (Versioning events)
- Versioning strategies: tolerant deserialization, version ids, upcasting on read, and in-place migration as a last resort. "This approach breaks immutability and should be a last resort because it undermines the audit trail." (Versioning events, In-place migration)
- No general query over events; you read a stream by id. "There's no standard approach or existing mechanisms, such as SQL queries, for reading events to obtain information." (Event querying)
- A broker like Kafka isn't an event store: no per-entity stream queries or optimistic concurrency. "Message brokers such as Apache Kafka typically lack per-entity stream queries and optimistic concurrency." (Event store options, Important)
- Snapshots every N events cap rehydration cost; they're an optimization, the stream stays the truth. "Snapshots are an optimization, not a replacement for the eventstream." (Entity state re-creation)
- Delivery to handlers is at least once; handlers must be idempotent. "Event delivery to consumers is typically at least once, so consumers can receive the same event more than once." (Idempotency requirements)
- Right to be forgotten conflicts with immutable events; keep personal data outside, or crypto-shred with a per-subject key. "Delete the key to render the data unrecoverable while leaving the event structure intact." (Personal data and regulatory compliance)
- Not suitable for plain CRUD, short-lived systems, or where views must be consistent in real time. "Eventual consistency between the event store and projections is inherent to event sourcing." (When to use this pattern)
- Apply it selectively, e.g. a payment ledger. "Event sourcing doesn't have to be an all-or-nothing decision for your entire system." (Tip)
- Event sourcing events are low level; other services may need separate integration events. "But the event sourcing events are typically low level, and it might be necessary to generate specific integration events instead." (Pattern advantages)
- An event store is a purpose-built database or a relational/document database with an append-only table. "An event store can be a purpose-built database designed for append-only eventstreams or a general-purpose relational or document database with an append-only table." (Event store options)
- Handlers can skip duplicates by tracking the last processed sequence number. "Track the last processed event sequence number for each consumer and skip duplicates, or design state mutations that are inherently safe to repeat." (Idempotency requirements)

## Visuals worth redrawing

- Overview with CQRS: presentation layer, command handlers loading a stream, event store, queue, handlers updating a read store.

## My notes

- Microsoft describes the pattern; it didn't invent it. primary: false.
- Its "append-only avoids lock contention, improves write throughput"
  claim has no numbers.

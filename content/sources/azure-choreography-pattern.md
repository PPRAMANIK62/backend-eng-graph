---
id: azure-choreography-pattern
title: Choreography pattern (Azure Architecture Center)
author: Microsoft (Azure Architecture Center)
url: https://learn.microsoft.com/en-us/azure/architecture/patterns/choreography
kind: docs
primary: false
---

## Summary

Microsoft's pattern page for choreography: each service decides for
itself when to act on a business operation, usually by reacting to
messages on a broker, instead of a central orchestrator calling every
service. It contrasts the two, lists what choreography makes harder
(failure handling, sequential steps, observability, event storms), and
walks through a drone delivery example on a message bus.

## Key claims

- Choreography puts the decisions in each service. "Have each service decide when and how to process a business operation, instead of depending on a central orchestrator." (opening)
- In orchestration, requests flow through the orchestrator and the services don't know the whole flow. "Incoming requests flow through the orchestrator as it delegates operations to the respective services. Each service completes their responsibility and isn't aware of the overall workflow." (Context and problem)
- An orchestrator can report the overall status of a transaction. "the orchestrator can consolidate the status of a transaction based on the results of individual operations that the downstream services conduct." (Context and problem)
- Adding or removing services means rewiring the orchestrator. "Adding or removing services might break existing logic because you need to rewire portions of the communication path." (Context and problem)
- An orchestrator can be a bottleneck and a single point of failure. "Under load, it can introduce performance bottlenecks and be the single point of failure (SPoF)." (Context and problem)
- Choreography is usually built on a message broker. "A common way to implement choreography is to use a message broker that buffers requests until downstream components claim and process them." (Solution)
- On failure, a service publishes a failure message and subscribers run compensations. "Services that subscribe to that message can run predefined compensating actions for the failed operation or the entire transaction." (Solution, step 4)
- Compensations can fail too. "Failure-handling logic, such as compensating transactions, is also prone to failures." (Issues and considerations)
- Choreography suits parallel, independent steps; sequences get awkward. "The workflow can become complicated when choreography needs to occur in a sequence." (Issues, sequential processes)
- No component sees the whole operation, so you need tracing and correlation ids. "Without a central orchestrator holding the full transaction state, no single component has a complete view of an in-flight business operation." (Issues, observability at scale)
- Many consumers of one event make schema changes risky. "If a producer changes the data structure of an event, it can break downstream consumers that depend on the old schema." (Issues, event schema evolution)
- Consumers must handle duplicates and out-of-order delivery. "Design consumers to be idempotent by tracking stable message identifiers." (Issues, idempotency and event ordering)
- Updating state and publishing the event must be atomic; use an outbox. "Use the Transactional Outbox pattern or an equivalent atomic mechanism to persist the state change and event together" (Issues, atomic state and event publication)
- Services reacting to each other can cause feedback loops and event storms. "When many services react to each other's events, the system can unintentionally produce feedback loops or event storms." (Issues, emergent behavior)
- Choreography fits between bounded contexts; inside one, consider an orchestrator. "For communication inside a single bounded context, consider an orchestrator pattern instead" (When to use this pattern)
- In the example, the delivery service needs a session id to match two messages for one delivery. "Without this session-based correlation, the delivery service has no way to associate related messages across independent hops, because no central coordinator tracks the transaction state." (Example, design)
- The orchestrator has to know what each service is responsible for. "You typically implement the orchestrator pattern as custom software that has domain knowledge about the responsibilities of the services within the system." (Context and problem)
- An orchestrator is a natural home for retries and timeouts. "In an orchestrator-led design, the central component can delegate resiliency responsibilities, such as retry handling for transient, nontransient, and timeout failures, to a dedicated resiliency handler." (Issues, resiliency handler communication)
- Choreography suits independent steps that run in parallel. "This pattern suits a workflow that processes independent business operations in parallel." (Issues, sequential processes)
- Evolve event schemas in backward-compatible ways. "Use a schema registry to manage event contracts and use backward-compatible evolution as services evolve independently." (Issues, event schema evolution)

## Visuals worth redrawing

- The orchestrator diagram and the broker diagram side by side. Redrawn
  in `orchestration-vs-choreography` with the shop order example.

## My notes

- The page is the Azure view; the trade-offs are generic.

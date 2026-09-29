---
id: aws-cell-based-architecture
title: Reducing the Scope of Impact with Cell-Based Architecture (AWS Well-Architected)
author: Amazon Web Services
url: https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html
kind: docs
primary: true
---

## Summary

AWS guidance (2023) on cells: independent copies of a whole workload,
each serving a slice of customers chosen by a partition key, behind a
thin router. Read the pages on what a cell is, why and when to use them,
partitioning, routing and router resilience, sizing, deployment, best
practices and the FAQ on shuffle sharding.

## Key claims

- A cell is an isolated instance of the workload that shares no state and serves a subset of requests. "Each cell is independent, does not share state with other cells, and handles a subset of the overall workload requests." (What is a cell-based architecture?)
- 10 cells for 100 requests: one cell failing leaves 90% unaffected. "If a workload uses 10 cells to service 100 requests, when a failure occurs in one cell, 90% of the overall requests would be unaffected by the failure." (What is a cell-based architecture?)
- Cells contain failures that are otherwise hard to contain: bad deploys and poison-pill requests. "These fault boundaries can provide resilience against failure types that otherwise are hard to contain, such as unsuccessful code deployments or requests that are corrupted or invoke a specific failure mode (also known as poison pill requests)." (What is a cell-based architecture?)
- The partition key should match the grain of the service, e.g. customer ID. "Examples of partition keys are customer ID, resource ID, or any other parameter easily accessible in most API calls." (What is a cell-based architecture?)
- Three parts: router, cell, control plane. "Cell router — We also refer to this layer as the thinnest possible layer, with the responsibility of routing requests to the right cell, and only that." (What is a cell-based architecture?)
- Cells don't have to mean more hardware. "It might be that your application has 30 hosts, and in a cell-based architecture it has the same 30 hosts, but with a cell router and with tasks that are distributed or grouped between cells." (What is a cell-based architecture?)
- Cells have a fixed maximum size; you grow by adding cells. "Each cell, a complete independent instance of the service, has a fixed maximum size." (Why use a cell-based architecture?)
- A capped cell can be stress tested past its breaking point. "These components can be stress tested and pushed past their breaking point to understand their safe operating margin." (Why use a cell-based architecture?)
- Deploy cell by cell; the first can be a canary. "the first cell deployed to in a phased cell deployment can be a canary cell" (Why use a cell-based architecture?)
- The question cells answer. "Is it better for 100% of customers to experience a 5% failure rate, or 5% of customers to experience a 100% failure rate?" (When to use a cell-based architecture?)
- Costs: complexity, infrastructure cost, special tooling, a routing layer. "Increase in the complexity of the architecture due to the redundancy of infrastructure and components." (When to use a cell-based architecture?)
- Very large customers may not fit in one cell. "if you choose the CustomerID for your partition key and a single customer of yours becomes so big that it doesn't fit into a single cell anymore, but it needs to be allocated across two cells." (Cell partition)
- Cross-cell calls should go back through the router. "instead of letting the cells talk directly to each other, any cross-cell calls have to go back through the normal cell router." (Cell partition)
- The router is shared, so it can't be compartmentalized like cells, and must stay simple. "The router layer is a shared component between cells, and therefore cannot follow the same compartmentalization strategy as with cells." (Cell routing)
- The router holds shared state and is a single point of failure. "In a cell-based architecture, the only component that has the shared state of all cells is the cell router. It presents itself as a single point of failure." (About resilience of the cell router)
- Sizing forces: fit the biggest workload, small enough to test at full scale, big enough for economies of scale. "Small enough to test at full scale (and to operate efficiently) that is equal lower risk of scaling cliffs, below the AWS account limits, etc." (Cell sizing)
- Start with a migration mechanism from day one. "Migrating clients from one cell to another is a tricky topic, depending on the nature of your workload it may require a lot of coordination and orchestration." (Best practices)
- Shuffle sharding is not the same as cells; use it inside a cell, not across. "We can use shuffle-sharding within a cell, but cross-cells should not be used by definition." (FAQ)
- Shuffle shards are dealt like hands of cards, and can overlap. "The basic idea of shuffle-sharding is to generate shards as we might deal hands from a deck of cards." (FAQ, What about shuffle-sharding?)
- It's harder with state. "Shuffle-sharding can also be a bit trickier for stateful components." (FAQ, What about shuffle-sharding?)
- (For cell-based-architecture.) Cross-grain work like scatter-gather should be a minority. "Some service interactions might go against the grain of the partition key, or cause the workload to span multiple cells (for example, scatter-gather). These are inevitable and need to be accommodated, but should represent the minority of the service's workload." (Cell partition)
- Keep business logic out of the router. "the routing layer must remain as simple and horizontally scalable as possible, which necessitates avoiding complex business logic within this layer." (Cell routing)
- Start from the current stack as cell zero, with more cells early. "When starting to plan your migration to a cell-based architecture, consider your current stack as cell zero." / "Start with multiple cells from day one" (Best practices)

## Visuals worth redrawing

- "A cell-based architecture": clients, a thin cell router, several cells each with the full stack, and a control plane. (What is a cell-based architecture?)

## My notes

- The note's "with shuffle sharding" wording needs care: AWS keeps the two apart.

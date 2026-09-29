---
id: microservices-io-saga
title: "Pattern: Saga"
author: Chris Richardson
url: https://microservices.io/patterns/data/saga.html
kind: docs
primary: false
---

## Summary

Chris Richardson's pattern page for sagas in a database-per-service
system: why 2PC is ruled out, choreography vs orchestration with the
order and credit-limit example, and the drawbacks (no automatic
rollback, no isolation, the need to publish messages atomically).

## Key claims

- The setting: each service owns its database, so no local ACID transaction spans them. "Since Orders and Customers are in different databases owned by different services the application cannot simply use a local ACID transaction." (Context)
- 2PC is listed as not an option. "2PC is not an option" (Forces)
- Each local transaction publishes a message or event to trigger the next. "Each local transaction updates the database and publishes a message or event to trigger the next local transaction in the saga." (Solution)
- Two ways to coordinate. "Orchestration - an orchestrator (object) tells the participants what local transactions to execute" (Solution)
- The order starts PENDING and is approved or rejected later. "The Order Service receives the POST /orders request and creates an Order in a PENDING state" (Example: choreography-based saga)
- No automatic rollback. "a developer must design compensating transactions that explicitly undo changes made earlier in a saga rather than relying on the automatic rollback feature of ACID transactions" (Resulting context)
- No isolation. "the lack of isolation means that there’s risk that the concurrent execution of multiple sagas and transactions can use data anomalies." (Resulting context)
- Each step must update its database and publish atomically, without a distributed transaction. "In order to be reliable, a service must atomically update its database and publish a message/event." (Resulting context)
- The client that started the saga has to learn its outcome: wait, poll, or be notified. "The service sends back a response (e.g. containing the orderID) after initiating the saga and the client periodically polls (e.g. GET /orders/{orderID}) to determine the outcome" (Resulting context)

## Visuals worth redrawing

- The choreography and orchestration sequence diagrams for Create
  Order. Not redrawn.

## My notes

- "can use data anomalies" is the page's wording (probably meant
  "cause").
- The page promotes the author's book and training; the pattern itself
  is standard.

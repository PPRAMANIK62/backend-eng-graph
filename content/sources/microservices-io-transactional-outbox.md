---
id: microservices-io-transactional-outbox
title: "Pattern: Transactional outbox"
author: Chris Richardson
url: https://microservices.io/patterns/data/transactional-outbox.html
kind: docs
primary: true
---

## Summary

The pattern page that named the transactional outbox. States the
problem (update a database and send a message atomically without 2PC),
the solution (store the message in an outbox table in the same
transaction, relay it later) and the consequences (duplicates, so
consumers must be idempotent).

## Key claims

- Sending a message inside or after the transaction is unreliable. "if a service sends a message after committing the transaction there’s no guarantee that it won’t crash before sending the message." (Context)
- Sending in the middle of a transaction risks sending for a transaction that never commits. "There’s no guarantee that the transaction will commit." (Context)
- 2PC is ruled out: often unsupported, and it couples the service to both. "The database and/or the message broker might not support 2PC." (Forces)
- Messages must go out in the order the service produced them, across instances. "This ordering must be preserved across multiple service instances that update the same aggregate." (Forces)
- Solution: store the message in the database as part of the same transaction; a separate process sends it. "A separate process then sends the messages to the message broker." (Solution)
- In a NoSQL database the outbox can be a property of each record. "Otherwise, if it’s a NoSQL database, the outbox is a property of each database record (e.g. document or item)" (Solution)
- Result: messages sent if and only if the transaction commits. "Messages are guaranteed to be sent if and only if the database transaction commits" (Result context)
- The relay can publish a message more than once, so consumers must be idempotent. "The Message relay might publish a message more than once." (Result context)
- Drawback: developers can forget to publish. "Potentially error prone since the developer might forget to publish the message/event after updating the database." (Result context)
- Two relay implementations: transaction log tailing and polling publisher. (Related patterns)
- Event sourcing is an alternative solution. (Related patterns)

## Visuals worth redrawing

- Sender, database with business tables and outbox, message relay, broker.

## My notes

- "Also known as: Application events."

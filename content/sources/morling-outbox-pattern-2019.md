---
id: morling-outbox-pattern-2019
title: Reliable Microservices Data Exchange With the Outbox Pattern
author: Gunnar Morling (Debezium project)
url: https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/
kind: blog
primary: true
---

## Summary

From the then lead of Debezium: why a service can't write its database
and Kafka in one transaction, how an outbox table written in the same
transaction solves it, and how Debezium tails the Postgres WAL to relay
outbox rows to Kafka topics, with consumers deduplicating by event id.

## Key claims

- Kafka can't join a distributed (XA) transaction with the database. "we cannot have one shared transaction that would span the service’s database as well as Apache Kafka, as the latter doesn’t support to be enlisted in distributed (XA) transactions." (The Issue of Dual Writes)
- Either half can fail: order saved but no message, or message sent but no order. "Or, the other way around, we might have sent the message to Kafka but failed to persist the purchase order in the local database." (The Issue of Dual Writes)
- The fix: modify only one resource and drive the other from it. "The answer is to only modify one of the two resources (the database or Apache Kafka) and drive the update of the second one based on that, in an eventually consistent manner." (The Issue of Dual Writes)
- Writing only to Kafka and consuming your own topic loses read-your-own-writes. "There’s one subtle challenge here, though, and that is the lack of "read your own write" semantics." (The Issue of Dual Writes)
- With suitable retention, new consumers can read a topic from the start and build their own view. "new consumers can subscribe, process the topic from the very beginning and materialize a view of all the data in a microservice’s database, search index, data warehouse etc." (intro)
- Outbox: insert the event into an outbox table in the same transaction as the business data. "as part of the same transaction, also a record representing the event to be sent is inserted into that outbox table." (The Outbox Pattern)
- An explicit event decouples consumers from the internal table layout. "This also helps to make sure that event consumers won’t break when for instance altering the internal domain model or the PurchaseOrder table." (The Outbox Pattern)
- Log-based CDC captures outbox rows with low overhead compared with polling. "As opposed to any polling-based approach, event capture happens with a very low overhead in near-realtime." (An Implementation Based on Change Data Capture)
- Outbox columns: id (for dedup), aggregatetype (topic), aggregateid (message key, so one aggregate's events land in one partition in order), type, payload. "That way, all events pertaining to one aggregate root or any of its contained sub-entities will go into the same partition of that Kafka topic" (The Outbox Table)
- Insert then delete the outbox row in the same transaction: CDC still sees the INSERT in the WAL and the table stays empty. "So we are able to capture the event added to the outbox table by means of CDC, but when looking at the contents of the table itself, it will always be empty." (Sending Events to the Outbox)
- Delivery is at least once; consumers skip event ids they've already processed. "This is to prevent any duplicate processing of events caused by the "at least once" semantics of this data pipeline." (Duplicate Detection in the Consuming Service)
- The consumer records processed ids in its own database in the same transaction as its work. (Duplicate Detection in the Consuming Service)
- Outbox event structure is part of the service's API and must evolve compatibly. "the structure of the events exposed via the outbox should be considered a part of the emitting service’s API." (Summary)
- An update at the top of the post: Debezium later shipped a ready-made outbox routing transform, replacing the custom EventRouter in the example. "Debezium now provides a ready-to-use SMT for routing outbox events." (Update note at the top)
- By default all changes from one table go to one topic; the router sends outbox events to a topic per aggregate type. "In order to route the change events captured from the outbox table to different topics, that custom SMT EventRouter is used." (Topic Routing)

## Visuals worth redrawing

- "Outbox Pattern Overview": order service writes PurchaseOrder and outbox rows in one transaction, Debezium reads the WAL, Kafka topics, shipment service.

## My notes

- Post updated later in 2019: Debezium now ships an outbox event router
  SMT, so the custom SMT in the post isn't needed.

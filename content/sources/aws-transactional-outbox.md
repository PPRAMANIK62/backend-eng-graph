---
id: aws-transactional-outbox
title: Transactional outbox pattern (AWS Prescriptive Guidance)
author: Amazon Web Services
url: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
kind: docs
primary: false
---

## Summary

AWS's write-up of the outbox, with a flight booking service and a
payment service. Shows both failure orders of a dual write, an outbox
table polled by a relay into SQS, and a CDC variant with DynamoDB
Streams. Includes sample code for a polling relay that deletes rows
after the broker accepts them.

## Key claims

- A dual write is writing to two different systems in one operation; a failure in one leaves them inconsistent. "A dual write operation occurs when an application writes to two different systems" (Intent)
- If the notification is sent but the database update fails, downstream acts on something that didn't happen. "If the flight database update fails but the notification is sent out, the payment service will process the payment based on the event notification." (Implementation)
- The outbox row is written in the same transaction; a relay sends it and deletes it once SQS confirms. "A separate service is in charge of regularly scanning the outbox table for new events, sending them to Amazon SQS, and deleting them from the table if Amazon SQS responds successfully." (Sample code)
- The relay sees only committed rows. "it recognizes only those rows that are part of a committed (successful) transaction" (Using an outbox table with a relational database)
- Duplicates are possible, so consumers should be idempotent. "The events processing service might send out duplicate messages or events, so we recommend that you make the consuming service idempotent by tracking the processed messages." (Issues and considerations)
- Send events in the order the database was updated. "Send messages or events in the same order in which the service updates the database." (Issues and considerations)
- CDC alternative: DynamoDB Streams publishes item-level changes, and a function forwards them. "DynamoDB publishes item-level modifications to DynamoDB Streams." (Using change data capture (CDC))
- The page claims order is preserved by timestamps and sequence numbers. "This design resolves the dual write operations issue and preserves the order of messages and events by using timestamps and sequence numbers." (Using an outbox table with a relational database)

## Visuals worth redrawing

- The two failure sequences (commit then crash before send; rollback after send).

## My notes

- Claims the outbox "preserves the order of messages and events by using
  timestamps and sequence numbers". Dudycz's post shows sequence numbers
  don't give commit order in Postgres; that's a tension worth covering.
- Written by AWS about the pattern, not by its inventors: primary: false.

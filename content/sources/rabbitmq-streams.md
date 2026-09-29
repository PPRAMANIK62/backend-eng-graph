---
id: rabbitmq-streams
title: Streams and Super Streams (RabbitMQ 4.3 docs)
author: RabbitMQ team (Broadcom)
url: https://www.rabbitmq.com/docs/streams
kind: docs
primary: true
---

## Summary

RabbitMQ's own log type, next to its queues. A stream is an
append-only log that consumers read without removing anything, with
retention by size or age and offsets to start from. Useful because it
is a queue broker explaining why it added logs and how they differ.

## Key claims

- A stream is a log, read many times. "Streams model an append-only log of messages that can be repeatedly read until they expire." (What is a Stream)
- The name for it. "A more technical description of this stream behavior is “non-destructive consumer semantics”." (What is a Stream)
- They complement queues. "streams were not introduced to replace queues but to complement them." (What is a Stream)
- Why: fan-out, replay, throughput, backlogs. Use cases listed as "Large fan-outs", "Replay (Time-travelling)", "Throughput Performance", "Large backlogs". (Use Cases for Using Streams)
- Start anywhere. "As streams never delete any messages, any consumer can start reading/consuming from any point in the log." (Consuming)
- Some queue features never come to streams. "Many features will never be supported by streams due to their non-destructive read semantics." (Feature Comparison)
- Retention works on whole segments. "NB: retention is evaluated on per segment basis" (Data Retention)
- Partitioned streams since 3.11. "Super streams are available starting with RabbitMQ 3.11." (Super Streams)

## Visuals worth redrawing

None.

## My notes

None.

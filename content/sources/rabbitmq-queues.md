---
id: rabbitmq-queues
title: Queues (RabbitMQ 4.3 docs)
author: RabbitMQ team (Broadcom)
url: https://www.rabbitmq.com/docs/queues
kind: docs
primary: true
---

## Summary

RabbitMQ's general guide to queues. Used here for its section on
message ordering: what order a queue keeps, and the cases that break
it.

## Key claims

- A queue is ordered. "A queue in RabbitMQ is an ordered collection of messages." (What is a Queue?)
- Several publishers interleave. "When publishing happens on multiple connections or channels, their sequences of messages will be routed concurrently and interleaved." (Message ordering)
- Priorities reorder. "Message priorities: higher-priority messages may be delivered before lower-priority messages." (When messages can be reordered)
- Several consumers plus redelivery reorder. "Multiple active consumers on the same queue: the broker still dequeues in FIFO, but any redelivery can change order." (When messages can be reordered)
- To keep order, one consumer at a time. "Enable Single Active Consumer so only one consumer receives messages at a time." (Preserving message order)

## Visuals worth redrawing

None.

## My notes

None.

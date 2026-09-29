---
id: rabbitmq-work-queues-tutorial
title: "RabbitMQ tutorial 2: Work Queues (Python)"
author: RabbitMQ team (Broadcom)
url: https://www.rabbitmq.com/tutorials/tutorial-two-python
kind: docs
primary: true
---

## Summary

The RabbitMQ tutorial on sharing tasks among workers: round-robin
dispatch, manual acknowledgements, durable queues and persistent
messages, and prefetch for fair dispatch.

## Key claims

- Why a work queue. "The main idea behind Work Queues (aka: Task Queues) is to avoid doing a resource-intensive task immediately and having to wait for it to complete." (What This Tutorial Focuses On)
- Round-robin by default. "By default, RabbitMQ will send each message to the next consumer, in sequence." (Round-robin dispatching)
- Without acks, a crash loses the message. "In this case, if you terminate a worker, the message it was just processing is lost." (Message acknowledgment)
- What an ack means. "An ack(nowledgement) is sent back by the consumer to tell RabbitMQ that a particular message had been received, processed and that RabbitMQ is free to delete it." (Message acknowledgment)
- A dead consumer's message is requeued. "If a consumer dies (its channel is closed, connection is closed, or TCP connection is lost) without sending an ack, RabbitMQ will understand that a message wasn't processed fully and will re-queue it." (Message acknowledgment)
- There's a 30-minute ack timeout. "A timeout (30 minutes by default) is enforced on consumer delivery acknowledgement." (Message acknowledgment)
- Forgetting to ack eats broker memory. "RabbitMQ will eat more and more memory as it won't be able to release any unacked messages." (Forgotten acknowledgment)
- Persistence isn't an fsync per message. "Also, RabbitMQ doesn't do fsync(2) for every message -- it may be just saved to cache and not really written to the disk." (Note on message persistence)
- Round-robin ignores load. "It just blindly dispatches every n-th message to the n-th consumer." (Fair dispatch)
- Prefetch 1 means one at a time. "don't dispatch a new message to a worker until it has processed and acknowledged the previous one." (Fair dispatch)
- A queue survives a restart only if declared durable. "First, we need to make sure that the queue will survive a RabbitMQ node restart. In order to do so, we need to declare it as durable" (Message durability)
- Messages must be marked persistent too. "Now we need to mark our messages as persistent" (Message durability)
- For more, use publisher confirms. "If you need a stronger guarantee then you can use publisher confirms." (Note on message persistence)

## Visuals worth redrawing

- One producer, one queue, two workers C1 and C2.

## My notes

None.

---
id: rabbitmq-pubsub-tutorial
title: "RabbitMQ tutorial 3: Publish/Subscribe (Python)"
author: RabbitMQ team (Broadcom)
url: https://www.rabbitmq.com/tutorials/tutorial-three-python
kind: docs
primary: true
---

## Summary

The RabbitMQ tutorial that delivers one message to several consumers:
a fanout exchange copies each message to every queue bound to it, and
each subscriber gets its own temporary queue.

## Key claims

- A work queue gives each task to one worker. "The assumption behind a work queue is that each task is delivered to exactly one worker." (What This Tutorial Focuses On)
- Pub/sub gives it to many. "In this part we'll do something completely different -- we'll deliver a message to multiple consumers." (What This Tutorial Focuses On)
- Producers publish to exchanges, not queues. "The core idea in the messaging model in RabbitMQ is that the producer never sends any messages directly to a queue." (Exchanges)
- A fanout exchange copies to every bound queue. "it just broadcasts all the messages it receives to all the queues it knows." (Exchanges)
- Each subscriber gets a fresh queue. "Firstly, whenever we connect to Rabbit we need a fresh, empty queue." (Temporary queues)
- Deleted when the subscriber leaves. "Secondly, once the consumer connection is closed, the queue should be deleted." (Temporary queues)
- With nobody bound, messages are dropped. "The messages will be lost if no queue is bound to the exchange yet, but that's okay for us; if no consumer is listening yet we can safely discard the message." (Putting it all together)

## Visuals worth redrawing

- Producer, fanout exchange X, two bound queues, two consumers.

## My notes

None.

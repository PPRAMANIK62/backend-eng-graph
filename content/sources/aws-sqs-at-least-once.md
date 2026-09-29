---
id: aws-sqs-at-least-once
title: Amazon SQS at-least-once delivery (SQS Developer Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html
kind: docs
primary: true
---

## Summary

A short SQS docs page explaining why standard queues can deliver a
message more than once.

## Key claims

- Messages are stored on several servers. "Amazon SQS stores copies of your messages on multiple servers for redundancy and high availability." (page)
- If a server holding a copy is down during a delete, the copy survives and can be received again. "If this occurs, the copy of the message isn't deleted on the server that is unavailable, and you might get that message copy again when you receive messages." (page)
- So consumers must be idempotent. "Design your applications to be idempotent (they should not be affected adversely when processing the same message more than once)." (page)

## Visuals worth redrawing

None.

## My notes

- A concrete, non-network reason for duplicates: replication inside the
  queue itself.

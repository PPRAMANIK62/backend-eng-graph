---
id: aws-sqs-visibility-timeout
title: Amazon SQS visibility timeout (SQS Developer Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
kind: docs
primary: true
---

## Summary

How SQS hands a message to one consumer: the message stays in the
queue but is hidden for a visibility timeout. Delete it before the
timeout and it's gone; don't, and it reappears for another consumer.
Defaults, the 12-hour cap, and the advice to extend the timeout with
a heartbeat.

## Key claims

- A received message stays in the queue but is hidden from others. "When you receive a message from an Amazon SQS queue, it remains in the queue but becomes temporarily invisible to other consumers." (intro)
- If you don't delete it in time, it comes back. "If you don't delete it before the timeout expires, the message becomes visible again in the queue and can be retrieved by another consumer." (Setting and adjusting the visibility timeout)
- Default is 30 seconds. "The default visibility timeout for a queue is 30 seconds" (Setting and adjusting the visibility timeout)
- Visibility timeout doesn't rule out duplicates. "there's no absolute guarantee that a message won't be delivered more than once during the visibility timeout period." (Understanding visibility timeout in standard and FIFO queues)
- Too long a timeout slows retries. "setting the visibility timeout too high can delay the reappearance of unprocessed messages, potentially slowing down retries." (Handling failures)
- Extend it with a heartbeat while working. "Implement a heartbeat mechanism to periodically extend the visibility timeout, ensuring the message remains invisible until processing is complete." (Best practices)
- 12-hour maximum from first receive. "the visibility timeout has a maximum limit of 12 hours from when the message is first received." (Best practices)
- Messages that keep failing go to a dead-letter queue. (Best practices, Handling unprocessed messages)
- In-flight limit for standard queues. "For standard queues, there's a limit of approximately 120,000 in-flight messages, depending on queue traffic and message backlog." (In flight messages and quotas)

## Visuals worth redrawing

None.

## My notes

- Same lease idea as a Postgres job row with a locked_until column, or
  Solid Queue's heartbeats.

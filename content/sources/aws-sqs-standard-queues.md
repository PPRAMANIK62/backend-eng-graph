---
id: aws-sqs-standard-queues
title: Amazon SQS standard queues (SQS Developer Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html
kind: docs
primary: true
---

## Summary

A short SQS page on the default queue type: at least once, best-effort
order, stored in several availability zones before the send is
acknowledged.

## Key claims

- Duplicates and reordering are allowed. "Standard queues ensure at-least-once message delivery, but due to the highly distributed architecture, more than one copy of a message might be delivered, and messages may occasionally arrive out of order." (intro)
- Order is best effort. "Despite this, standard queues make a best-effort attempt to maintain the order in which messages are sent." (intro)
- Stored redundantly before the send returns. "When you send a message using SendMessage, Amazon SQS redundantly stores the message in multiple availability zones (AZs) before acknowledging it." (intro)
- A typical use: background work after a user request. "Decoupling live user requests from intensive background work – Users can upload media while the system resizes or encodes it in the background." (Use cases for standard queues)

## Visuals worth redrawing

None.

## My notes

None.

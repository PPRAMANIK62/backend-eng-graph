---
id: aws-sqs-exactly-once
title: Exactly-once processing in Amazon SQS (SQS Developer Guide)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html
kind: docs
primary: true
---

## Summary

A short SQS docs page on how FIFO queues avoid duplicate sends: a
deduplication ID, from the message body's hash or given by the sender,
remembered for five minutes.

## Key claims

- FIFO queues don't introduce duplicates, and a retried send within five minutes isn't duplicated. "If you retry the SendMessage action within the 5-minute deduplication interval, Amazon SQS doesn't introduce any duplicates into the queue." (page)
- Deduplication by content: a SHA-256 hash of the body, not the attributes. "This instructs Amazon SQS to use a SHA-256 hash to generate the message deduplication ID using the body of the message—but not the attributes of the message." (page)
- Or the sender gives an explicit deduplication ID. "Explicitly provide the message deduplication ID (or view the sequence number) for the message." (page)

## Visuals worth redrawing

None.

## My notes

- The page title says "exactly-once processing", but it describes
  deduplication of sends within a time window. It says nothing about a
  consumer that crashes after processing and before deleting. Good
  example of "read the fine print".

---
id: aws-sqs-dead-letter-queues
title: Using dead-letter queues in Amazon SQS
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html
kind: docs
primary: true
---

## Summary

The SQS developer guide page on dead-letter queues (DLQs): a queue that
other queues send messages to after too many failed receives. It covers
the redrive policy (`maxReceiveCount`), which queues may use a DLQ, the
warning about FIFO order, and how retention works once a message moves.

## Key claims

- A DLQ holds messages that weren't processed successfully. "Amazon SQS supports dead-letter queues (DLQs), which source queues can target for messages that are not processed successfully." (intro)
- Its main use is debugging: isolate the failures and find out why. "DLQs are useful for debugging your application because you can isolate unconsumed messages to determine why processing did not succeed." (intro)
- The move happens after `maxReceiveCount` receives. "The maxReceiveCount is the number of times a consumer can receive a message from a source queue before it is moved to a dead-letter queue." (Using policies for dead-letter queues)
- Set too low, one failure is enough to dead-letter a message. "For example, if the maxReceiveCount is set to a low value such as 1, one failure to receive a message would cause the message to move to the dead-letter queue." (Using policies)
- Set it high enough to allow retries. "To ensure that your system is resilient against errors, set the maxReceiveCount high enough to allow for sufficient retries." (Using policies)
- Standard queues push repeatedly received messages to the back. "For standard queues with a redrive policy where maxReceiveCount is greater than 3, if a message is received 3 or more times without being deleted, SQS moves it to the back of the queue." (Using policies)
- A DLQ breaks FIFO order. "Don't use a dead-letter queue with a FIFO queue if you don't want to break the exact order of messages or operations." (Note)
- In standard queues, a message's expiry still counts from when it was first enqueued, so the DLQ's retention should be longer than the source's. "Thus, it is a best practice to always set the retention period of a dead-letter queue to be longer than the retention period of the original queue." (Understanding message retention periods)
- Worked example: 1 day in the source queue, a 4-day DLQ retention, deleted from the DLQ after 3 days. "the message is deleted from the dead-letter queue after 3 days" (Understanding message retention periods)
- The docs point to setting a CloudWatch alarm for messages moved to a DLQ. "For help with dead-letter queues, such as how to configure an alarm for any messages moved to a dead-letter queue, see Creating alarms for dead-letter queues using Amazon CloudWatch." (intro)
- Among the things to check in a DLQ: whether the consumer had enough time. "Determine whether you have given your consumer sufficient time to process messages." (intro list)
- The redrive allow policy can name up to 10 source queues. "you can specify up to 10 source queues using the source queue Amazon Resource Name (ARN)." (Using policies)

## Visuals worth redrawing

None on the page. The flow source queue → consumer → DLQ → redrive is
worth drawing.

## My notes

- The page lists what you do with a DLQ: read logs, look at the
  messages, check the consumer had enough time, and redrive. Redrive is
  on its own page (`aws-sqs-dlq-redrive`).

---
id: aws-sqs-dlq-redrive
title: Configuring a dead-letter queue redrive (Amazon SQS)
author: Amazon Web Services
url: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-dead-letter-queue-redrive.html
kind: docs
primary: true
---

## Summary

How SQS moves messages back out of a dead-letter queue ("redrive"):
where they go, in what order, how fast, and what changes about them on
the way. Also the API actions and limits.

## Key claims

- Redrive moves messages out of a DLQ for another try, by default back to the source queue. "By default, dead-letter queue redrive moves messages from a dead-letter queue to a source queue." (intro)
- You can cap the redrive rate. "Additionally, you can configure the redrive velocity to set the rate at which Amazon SQS moves messages." (intro)
- The custom cap is at most 500 messages per second. "The maximum allowed rate is 500 messages per second." (console steps, velocity control)
- Start slow so the source queue isn't overwhelmed. "It is recommended to start with a small value for Custom max velocity and verify that the source queue doesn't get overwhelmed with messages." (console steps)
- Oldest first, but redriven messages mix with new ones, even in FIFO queues. "the redriven messages will interweave with the new messages from the producer." (intro)
- Another queue can be the destination if it's the same type. "However, you can also configure any other queue as the redrive destination if both queues are the same type." (intro)
- Oldest first. "Dead-letter queues redrive messages in the order they are received, starting with the oldest message." (intro)
- Redriven messages are new messages. "All redriven messages are considered new messages with a new messageID and enqueueTime are assigned to redriven messages." (Note)
- No editing or filtering during redrive. "Amazon SQS doesn't support filtering and modifying messages while redriving them from the dead-letter queue." (Important)
- Limits: 36 hours per task, 100 active tasks per account. "A dead-letter queue redrive task can run a maximum of 36 hours. Amazon SQS supports a maximum of 100 active redrive tasks per account." (Important)
- API: StartMessageMoveTask, ListMessageMoveTasks, CancelMessageMoveTask. "Starts an asynchronous task to move messages from a specified source queue to a specified destination queue." (API table)

## Visuals worth redrawing

None.

## My notes

- "No filtering" means a redrive replays everything in the DLQ. If some
  messages are broken for good, they fail again and come back.

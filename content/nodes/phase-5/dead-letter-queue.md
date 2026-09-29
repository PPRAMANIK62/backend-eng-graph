---
id: dead-letter-queue
title: Dead-letter queues
depth: short
phase: 5
note: >-
  Where a message or delivery goes after its last retry fails, and
  replaying it from there.
needs: [retries-with-backoff]
leads_to: [poison-messages, webhooks, background-jobs]
compare_with: [message-ordering]
---

# Dead-letter queues

A dead-letter queue (DLQ) is where a message goes once you've given up
on it. After its last retry fails, the system moves it aside instead of
trying forever or throwing it away. That stops one bad message from
eating your workers' time, and keeps it where a person can look at it
and send it through again once the problem is fixed.

## One message that always fails

Say an order service puts a "send receipt" message on a
[[message-queue|queue]] for every order, and a worker takes them off
and sends the emails. Almost every message works the first time. One
doesn't: the customer's email field is empty, and the worker throws an
error every time it reads that message.

Without a DLQ you can retry forever, and every attempt wastes a worker.
Or you drop the message after a few tries, and nothing records that it
existed or why it failed. A DLQ is the third option. You set a limit on
attempts. When a message reaches it, the queue moves the message to a
separate queue, the dead-letter queue, and the workers carry on.

![A producer sends messages to a source queue. A consumer receives them. A failing message goes back to the source queue with its receive count going up by one each time. When the count reaches the limit, the message moves down to the dead-letter queue, where an alarm fires and a person inspects it. After the fix, a redrive moves the message back to the source queue at a capped rate.](img/dead-letter-queue-flow.svg)

*A message that keeps failing is moved aside after its last attempt, and moved back after the fix.*

The attempts before that point are [[retries-with-backoff]]. The DLQ is
what happens when they run out.

## How "the last attempt" is counted

Queues count deliveries, not errors. A message that the consumer
received but never acknowledged counts as a failed attempt, whatever
the reason: an exception, a crash, or a worker too slow to finish in
time.

- **Amazon SQS** puts a redrive policy on the source queue. Its
  `maxReceiveCount` is how many times a consumer may receive a message
  before it moves to the DLQ. Set it to 1 and a single failed receive
  dead-letters the message, so set it high enough to allow real
  retries.
- **Google Cloud Pub/Sub** puts a maximum number of delivery attempts
  on the subscription: 5 by default, anywhere from 5 to 100. The count
  is best effort. Pub/Sub can forward a message a little early or a
  little late, and the count can reset to zero, so a consumer may see a
  message more times than the limit.

When Pub/Sub dead-letters a message, it wraps it and adds attributes:
how many attempts were made, which subscription it came from, and when
it was first published. That context is what makes a DLQ useful for
debugging.

## Replaying from the dead-letter queue

Once the bug is fixed, or the missing data is filled in, you move the
messages back and let the workers try again. SQS calls this a redrive:

- By default it sends messages back to the queue they came from. It
  can also send them to another queue of the same type.
- It goes oldest first, and you can cap the rate, up to 500 messages a
  second. Start low, so the replay doesn't flood the source queue.
- Replayed messages get a new message ID and a new enqueue time, and
  they mix with new messages arriving at the same time.
- You can't filter or edit messages during the move. A redrive replays
  everything in the DLQ, including messages that will fail again.

The new message ID matters. If your consumer ignores duplicates by the
queue's message ID, a replayed message looks brand new. Put your own ID
in the message body and deduplicate on that; see [[idempotency]].

## Where it gets tricky

**A DLQ breaks order.** When message 5 goes to the DLQ, messages 6, 7
and 8 get processed before it. When it comes back, it lands among
whatever is new. On an SQS FIFO queue, a DLQ breaks the exact order of
messages, so leave it off if you need that order. If order matters, you either accept this or
stop the stream when one fails.

**A DLQ can't tell a poison message from bad luck.** A message that can
never succeed (a [[poison-messages|poison message]]) and a good message
that failed because a downstream service was down for an hour look the
same in the DLQ. After an outage it may be full of good messages that
only need a replay.

**Messages still expire.** In an SQS standard queue, a message's age
counts from when it was first enqueued, not from when it reached the
DLQ. With a 4-day DLQ retention, a message that spent a day in the
source queue is deleted from the DLQ after 3 days. Give the DLQ a
longer retention than the source queue.

**Nobody reads it by default.** A DLQ that no one watches is data loss
with a delay. SQS points you to a CloudWatch alarm for messages arriving
in a DLQ, and Pub/Sub has a metric that counts forwarded messages. In
Pub/Sub the dead-letter topic also needs its own subscription, or
nothing receives what's forwarded to it.

## What this means when you build

- Put a DLQ behind every retry loop, and set the limit so an ordinary
  outage doesn't dead-letter good messages.
- Store why each message failed and how many attempts it had.
- Alert when anything lands in the DLQ, and keep messages there longer
  than in the source queue.
- Build replay with a rate cap, and make consumers safe to run twice.
- If you promise order, decide what a dead-lettered message does to
  the ones behind it. [[webhooks]] have this problem.

## Further reading

- [Using dead-letter queues in Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html), AWS docs. The redrive policy, `maxReceiveCount`, the FIFO warning and how retention works after a move.
- [Configuring a dead-letter queue redrive](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-dead-letter-queue-redrive.html), AWS docs. Replaying messages out of a DLQ: rate caps, ordering and what changes about each message.
- [Dead-letter topics](https://cloud.google.com/pubsub/docs/handling-failures), Google Cloud docs. The same idea in Pub/Sub, with approximate attempt counts and the attributes added to forwarded messages.

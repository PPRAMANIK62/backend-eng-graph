---
id: message-queue
title: Message queues
depth: deep
phase: 10
note: >-
  A broker between producers and consumers, so neither waits on the
  other. Acks, redelivery and competing consumers.
needs: [delivery-guarantees]
leads_to: [pub-sub, log-based-messaging, poison-messages, message-schemas, dual-writes, background-jobs]
compare_with: [log-based-messaging, pub-sub, share-groups]
---

# Message queues

A message queue is a broker that sits between the code that creates
work and the code that does it. The producer drops a message in and
moves on; a consumer picks it up when it's ready. Neither waits for the
other, and neither has to be running at the same moment. The hard part
is deciding when a message is really done, because that decision is
what loses messages or runs them twice.

## A job handed off instead of a call made

Say a user uploads a video. Resizing it takes a minute, far longer than
an HTTP request should hold. So the web handler puts a message on a
queue, "resize video 42", and answers the user right away. A worker
process somewhere else takes the message off the queue and does the
slow part.

That split has three parts:

- **Producers** send messages to the broker.
- **The broker** stores them in a named queue, in the order they
  arrived.
- **Consumers** take messages from the queue and process them.

The producer doesn't know which worker will run the job, or whether
any worker is up right now. If all workers are down for a deploy, the
messages wait in the queue. If uploads spike, the queue absorbs the
spike and the workers work through it at their own speed.

## Competing consumers share the work

Run three workers on the same queue and each message goes to exactly
one of them. The workers compete for messages, which is why this is
called the competing consumers pattern. Adding workers is how you
process a backlog faster.

How the broker picks the worker matters. RabbitMQ by default hands
message 1 to worker A, message 2 to worker B, and so on, in turn. It
does this blindly: if every odd message is a long video and every even
one a short clip, one worker is always busy and the other mostly idle.

The fix is a limit on how many messages a consumer may hold without
having finished them. RabbitMQ calls it the prefetch count. With a
prefetch of 1, the broker doesn't send a worker a new message until it
has finished the last one, so work goes to whoever is free. That's the
safest setting and the slowest, especially when the consumer is far
from the broker. Values between 100 and 300 usually give the best
throughput without swamping consumers. Either way, the
limit also stops a consumer from pulling in more messages than it has
memory for, which is [[backpressure]] from the consumer's side.

## The acknowledgement decides when a message is gone

The broker has to delete a message at some point. There are two
choices of when.

**When it's sent.** The broker counts the message as delivered the
moment it goes out on the wire. This is automatic acknowledgement, and
it's fast. But if the worker crashes halfway through, the message is
gone: the broker already deleted it.

**When the consumer says so.** The worker processes the message and
then sends an acknowledgement, an ack, meaning "done, you can delete
it". Until the ack arrives, the broker keeps the message and won't give
it to anyone else. If the worker dies without acking, the broker puts
the message back and another worker gets it.

![Sequence diagram with a producer, the queue, worker A and worker B. The producer sends message m1 and the queue stores it as ready. The queue delivers m1 to worker A and marks it unacked, hidden from other workers. Worker A crashes before sending an ack. The queue notices, either because A's connection closed or because m1's timeout ran out, and makes m1 ready again. It delivers m1 to worker B, B processes it and sends an ack, and only then does the queue delete m1.](img/message-queue-ack-redelivery.svg)

*A message stays in the queue, hidden, until someone acks it. If the
worker holding it dies, the message comes back for another worker.*

Brokers notice a dead worker in one of two ways:

- **By the connection.** RabbitMQ requeues every unacked message on a
  channel when that channel or its [[tcp|TCP]] connection closes. It also
  enforces an acknowledgement timeout, 30 minutes by default, to catch
  a worker that is alive but stuck.
- **By a timer.** Amazon SQS has no long-lived connection to watch.
  When you receive a message, it stays in the queue but becomes
  invisible to other consumers for a visibility timeout, 30 seconds by
  default. Delete it before the timer runs out and it's gone. Don't,
  and it becomes visible again for someone else. A worker with a long
  job extends the timeout as it goes, like a heartbeat, up to a limit
  of 12 hours from the first receive.

The timer version is a [[leases|lease]]: the worker borrows the message for a
while and has to give it back or renew it.

## Redelivery means duplicates

Manual acks fix lost messages but bring back duplicates. Picture a
worker that resizes the video, writes the result, and crashes one
instruction before sending the ack. The broker sees no ack and hands
the message to another worker, which resizes the video again.

Nothing in the broker can tell "crashed before the work" from "crashed
after the work but before the ack". So a queue with acks gives you
[[delivery-guarantees|at-least-once delivery]], and your consumer has
to cope with seeing a message twice. RabbitMQ marks a redelivered
message with a flag, but the flag can't tell you whether
the first attempt finished its work, and the first attempt may have
been on a different worker.
The real answer is an [[idempotency|idempotent]] consumer: resizing
video 42 twice should leave the same result as doing it once.

SQS standard queues add another source of duplicates. Their design is
spread across many machines, so more than one copy of a message can
be delivered, and even a visibility timeout doesn't promise that no one
else will receive one.

## A message that never succeeds

Sometimes a message fails every time: a corrupt video, a bug the
message happens to trigger. A consumer can reject it with a negative
acknowledgement (nack). With "requeue" set, the broker puts it back in its
old place if it can, and if every consumer keeps rejecting it you get
a loop that burns CPU and network forever. Without requeue, RabbitMQ
routes it to a dead-letter exchange if one is set up, or drops it.

This is where a [[dead-letter-queue]] comes in: after some number of
failed attempts, move the message aside so the rest of the queue keeps
flowing. The message that caused it is a [[poison-messages|poison
message]].

## Durable is a setting, not a default

A queue only survives a broker restart if it's configured to. In
RabbitMQ you declare the queue durable and mark each message
persistent. Even then, RabbitMQ doesn't call [[fsync]] for every
message, so a message it has just accepted can still be lost in a
crash. If the producer needs to know the broker has safely taken a
message, it turns on publisher confirms: the broker acks the
publish once it has the message safe; for a persistent message on a
durable queue, that means written to disk. SQS stores a message
in several availability zones before it acknowledges the send.

That gives two acknowledgements in every flow, and they are separate.
The broker's confirm to the producer covers the first hop. The
consumer's ack to the broker covers the second. Neither knows about
the other.

## Where it gets tricky

**A queue doesn't fix overload.** A queue absorbs bursts. If producers
send more than the workers can handle for a long time, the queue just
grows until something breaks: the broker's memory or disk, or a
limit like SQS's cap of about 120,000 in-flight messages on a
standard queue. You still have to choose between slowing producers
down ([[backpressure]]) and dropping work
([[load-shedding]]). Adding a queue makes failures rarer and bigger.

**A forgotten ack is a slow leak.** If a consumer never acks, its
messages are redelivered when it disconnects, which looks like random
duplicates, and RabbitMQ can't free the memory for them in the
meantime.

**Timeouts are a guess.** Too short, and a slow but healthy worker
loses its message to another worker, and the job runs twice at the
same time. Too long, and a crashed worker's message sits hidden
before anyone retries it.

**FIFO has limits.** A queue stores messages in order, but that
doesn't mean they're processed in order. With several consumers, two
messages are worked on at the same time and can finish in either
order. A redelivered message comes back after later messages have
already been handled. Several producers interleave. SQS standard
queues only make a best-effort attempt at order. If order matters,
see [[message-ordering]].

**Gone after the ack.** Once a message is acked, it's deleted. You
can't replay last week's messages after fixing a bug, and a second
kind of consumer can't read the same messages later. Delivering one
message to many readers is [[pub-sub]]; keeping messages after they're
read is what a log does ([[log-based-messaging]]).

## What this means when you build

- Ack after the work is done, never before, unless losing messages is
  fine.
- Make every consumer idempotent. Duplicates will happen.
- Set a prefetch limit, and a visibility or ack timeout that fits your
  slowest normal job. Extend the lease for long jobs.
- Send messages that keep failing to a dead-letter queue instead of
  requeueing them forever.
- Watch queue depth. A queue that only grows means your consumers
  can't keep up, and the queue won't save you.
- Use durable queues, persistent messages and publisher confirms if a
  lost message costs you anything.

## Further reading

- [RabbitMQ tutorial 2: Work Queues](https://www.rabbitmq.com/tutorials/tutorial-two-python), RabbitMQ team. Competing consumers, acks, durability and prefetch, with runnable code.
- [Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms), RabbitMQ 4.3 docs. Everything about acks on both ends: modes, requeueing, nacks, prefetch.
- [Queues](https://www.rabbitmq.com/docs/queues), RabbitMQ 4.3 docs. What order a queue keeps and what breaks it.
- [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), AWS. The lease model: hidden messages, timeouts, heartbeats and limits.
- [Amazon SQS standard queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html), AWS. At least once, best-effort order, and why.
- [Queues Don't Fix Overload](https://ferd.ca/queues-don-t-fix-overload.html), Fred Hebert, 2014. Why a queue in front of a bottleneck only delays the failure.

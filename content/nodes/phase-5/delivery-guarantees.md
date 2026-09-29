---
id: delivery-guarantees
title: Delivery guarantees
depth: deep
phase: 5
note: >-
  At most once, at least once, and what "exactly once" can really mean.
needs: [idempotency, retries-with-backoff]
leads_to: [webhooks, message-queue, exactly-once-processing, offsets-and-commits, idempotent-producers]
compare_with: [two-phase-commit]
---

# Delivery guarantees

When one system passes messages to another, failures force a choice.
Either some messages can be lost but never repeated (at most once), or
none are lost but some can arrive twice (at least once). "Exactly once"
is what everyone wants, and when a system offers it, it means at least
once plus something that makes the duplicates harmless. Knowing which
of these you have tells you what your code has to handle.

## The acknowledgement that didn't come back

A sender sends a message and waits for the receiver to say "got it".
Nothing comes back. There are several reasons, and the sender can't
tell them apart: the message was lost, the acknowledgement was lost,
the receiver crashed, or everything is just slow.

The sender has two options, and they give the first two guarantees:

- **Don't send it again.** If the message was lost, it stays lost. No
  message is ever delivered twice. That's **at most once**.
- **Send it again until an acknowledgement arrives.** If the first copy
  did arrive and only the acknowledgement was lost, the receiver now
  has it twice. No message is lost. That's **at least once**.

This is the same bind as a client that timed out on an API call (see
[[idempotency]]), with a queue or a broker in the middle. Resending is
[[retries-with-backoff|a retry]], with all the same care about load.

## Two places it can go wrong: sending and consuming

With a broker in the middle, such as [[kafka-architecture|Kafka]], the problem splits in two:
getting the message into the broker, and getting it processed by a
consumer.

**Sending.** A producer that gets a network error while publishing
can't tell whether the broker stored the message. Before version
0.11.0.0, a Kafka producer's only safe move was to send it again, so
the log could end up with two copies. That's at least once.

**Consuming.** A consumer reads messages, processes them, and records
how far it got, so that after a crash it (or another consumer) knows
where to resume. In Kafka that record is the consumer's offset (see
[[offsets-and-commits]]). The order of the last two steps decides the
guarantee:

![Two timelines of a consumer handling message 5. In the first, it saves its position as 6, then crashes before processing message 5; after restart it resumes at 6 and message 5 is never processed: at most once. In the second, it processes message 5, then crashes before saving its position; after restart it resumes at 5 and processes message 5 a second time: at least once.](img/delivery-guarantees-consumer-order.svg)

*The same crash, two orders, two guarantees. Adapted from the Apache Kafka design docs, "Message Delivery Semantics".*

- **Save the position, then process.** A crash between the two skips
  the message. At most once.
- **Process, then save the position.** A crash between the two
  processes the message again after restart. At least once.

A queue that deletes messages when you acknowledge them works the same
way: acknowledge before processing and you get at most once,
acknowledge after and you get at least once.

## Duplicates come from inside the system too

Even with no crashes on your side, a queue can hand you a message twice.
Amazon SQS standard queues store copies of each message on several
servers. If one of them is unavailable when you delete a message, its
copy isn't deleted, and you can receive it again later. The docs' advice
is to make your consumer idempotent.

So in practice, at least once is the normal guarantee, and your code
has to expect duplicates. Kafka's default is at least once too. You get
at most once only by asking for it: turn off producer retries and save
the offset before processing.

## What "exactly once" can really mean

A message can't be *delivered* exactly once as far as the sender can
tell; there will always be a moment where it doesn't know. What you can
get is an *effect* that happens once. There are three ways to build
that on top of at least once.

**Make the message harmless to repeat.** If a message says "user 42's
email is now x@example.com", applying it twice leaves the same record.
If it says "add 10 to the balance", it doesn't. Messages keyed by a
record ID that overwrite the whole record are idempotent by nature. The
same goes for instructions: telling someone where you are survives a
duplicate message, while turn-by-turn directions don't.

**Remember what you've already seen.** Give every message an ID and
have the receiver drop IDs it has seen before, the way an
[[idempotency-keys|idempotency key]] works for an API. Kafka's
idempotent producer (0.11.0.0 and later) does this between producer and
broker: the broker gives each producer an ID, the producer numbers its
messages, and the broker drops a number it already has. Unlike [[tcp|TCP]]'s
sequence numbers, which live only as long as one connection, these are
stored in the replicated log, so a new leader knows them too. That's
[[idempotent-producers]]. SQS FIFO queues do a version of this with a
deduplication ID, either given by the sender or made from a SHA-256
[[cryptographic-hashes|hash]] of the message body, and remembered for five minutes.

**Commit the result and the position together.** The consumer's two
steps, "do the work" and "record how far I got", are what let a crash
split them. Put both in one atomic write and the split can't happen.
Kafka does this for consumers that read from one topic and write to
another: the consumer's offset is written in the same [[transaction]] as
its output, so either both happen or neither does. When the output goes
to another system, such as a database, the same trick works if you
store the offset in that system, in the same transaction as the data.
That's usually simpler than coordinating two systems with
[[two-phase-commit]], which many of them don't support. The details
belong to [[exactly-once-processing]].

With that, "exactly once" in Kafka's [[stream-processing|stream processing]] has a precise
meaning: the output is the same as if each input message had been
processed once, with no failures.

## Where it gets tricky

**"Exactly once is impossible" vs "exactly once is here".** A 2015
post argues that exactly-once delivery can't exist between
two machines, and that systems claiming it are faking it with
idempotency or deduplication. The 2017 post announcing Kafka's
exactly-once semantics answers that it's hard but possible. They
mostly disagree about words. Delivery, seen from the sender, is at
least once. The processed effect can be once, if the receiver
cooperates. The Kafka announcement says as much: exactly once needs the
messaging system and the application to work together.

**Read the fine print.** Many systems claim exactly-once delivery, and
the claim sometimes doesn't hold when producers or consumers fail, when
several consumers share the work, or when data on disk is lost. SQS's
page is titled "exactly-once processing", but what it describes is
deduplicating sends within five minutes. A retry after those five
minutes isn't covered, and the page says nothing about a consumer that
processes a message and crashes before deleting it.

**The guarantee stops at the edge.** Kafka's exactly once covers
reading from Kafka, state stored in Kafka and writing to Kafka. If your
processing sends an email, calls an HTTP API or writes to a database
without storing the offset there, those effects are at least once. They
need their own idempotency or deduplication.

**Deduplication has a window.** Remembering every ID forever isn't
practical, so deduplication schemes keep IDs for a while and then
forget them. SQS FIFO remembers them for five minutes. A duplicate that
arrives after the window isn't caught.

## What this means when you build

- Assume at least once. Every consumer, webhook receiver and job
  handler should expect to see the same message twice.
- Acknowledge or save your position after the work is done, not
  before.
- Give every message a unique ID, and store "I've handled this ID" in
  the same transaction as the work it caused.
- Prefer messages that state a new value over messages that describe a
  change.
- When a product promises exactly once, find out which failures and
  which window it covers.
- A queue or broker gives you these guarantees between services
  ([[message-queue]]). A [[webhooks|webhook]] is the same problem with
  an endpoint you don't control.

## Further reading

- [Kafka design: Message Delivery Semantics](https://kafka.apache.org/43/design/design/), Apache Kafka 4.3 docs. The three guarantees, the producer and consumer sides, the idempotent producer, and transactions.
- [Exactly-once Semantics are Possible: Here's How Apache Kafka Does it](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/), Neha Narkhede, Confluent, 2017. The failure cases, how idempotence and transactions fit together, and what exactly once means for stream processing.
- [You Cannot Have Exactly-Once Delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/), Tyler Treat, 2015. The case that delivery is at most or at least once, and that exactly once is idempotency or deduplication.
- [Amazon SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html), AWS docs. How a replicated queue delivers a message twice without any network fault on your side.
- [Exactly-once processing in Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html), AWS docs. FIFO deduplication IDs and the five-minute window.

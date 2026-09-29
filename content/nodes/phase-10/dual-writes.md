---
id: dual-writes
title: Dual writes
depth: short
phase: 10
note: >-
  Writing to the database and the queue separately, and how they drift
  apart.
needs: [transaction, message-queue]
leads_to: [transactional-outbox]
compare_with: [transactional-outbox, cache-invalidation, zanzibar, search-architecture]
---

# Dual writes

A dual write is when your code saves the same fact in two systems as
two separate steps: a row in the database, then a message to a broker,
a cache update or a search index update. Nothing ties the two steps
together, so a crash, a network error or two requests racing each
other can leave the systems disagreeing. No error shows up when that
happens, and the disagreement stays until someone notices.

## One order, two writes

Take an order service. When a customer places an order, it does two
things:

1. `INSERT` the order into its Postgres database and commit.
2. Publish an `OrderPlaced` message to Kafka, so the shipping service
   can create a shipment.

Each step can fail on its own:

- **The commit works, the publish doesn't.** The process crashes or
  the broker is unreachable right after the commit. The order exists,
  but shipping never hears about it. No shipment is ever created for
  an order the customer was told succeeded.
- **Publish first, then the insert fails.** Flip the order of the
  steps and you get the opposite: a shipment gets created for an order
  that isn't in the order service's database.
- **Publish inside the transaction, then fail to commit.** Sending the
  message before `COMMIT` is the same case in disguise. If the commit
  then fails, the message is already out and can't be taken back.

Whichever order you pick, there's a moment between the two writes
where a failure leaves one done and the other not.

## Two writers, two orders

Failures aren't the only problem. Say two requests update the same
key at the same time, and each writes the database first and the
search index second. Nothing forces the two stores to see the writes
in the same order.

![Two clients and two datastores, time running left to right. Client 1 sets X=A in the database, then in the search index. Client 2 sets X=B in the database after client 1, but reaches the search index first. The database ends with X=B and the search index ends with X=A, and every write returned success.](img/dual-writes-race.svg)

*Every write succeeded, and the two stores still disagree. Adapted from Martin Kleppmann, "Using logs to build a solid data infrastructure (or: why dual writes are a bad idea)" (2015).*

The database ends with B, the index with A. Every call returned
success, so nothing logs an error. The stores stay different until
something overwrites that key again. This isn't
[[eventual-consistency]], where things settle on their own; it's a
permanent difference that someone has to find and repair by hand.

## Why a transaction doesn't save you

Inside one database this is a solved problem. Wrap the order insert
and, say, a counter update in one [[transaction]], and both happen or
neither does.

The trouble starts when the second write goes somewhere else: a
[[message-queue]], Redis, a search index. A database transaction can
only undo the database's own writes. To stretch one across two systems
you'd need a distributed transaction, [[two-phase-commit]], and many
brokers and stores don't take part in one. Kafka, for example, can't
join an XA transaction with your database. Even where it's possible,
it's far from clear that distributed transactions are a good idea.

So with dual writes, your application has to deal with partial failure
itself, and there's no good way to do that from inside the code that
does the writes.

## The way out: write once, derive the rest

Every fix follows the same rule: write to **one** system, and have the
second one updated from the first, in order, even if a little later.

- **Write to the database only**, and put the message in the same
  transaction, in an outbox table that a separate process forwards to
  the broker. That's the [[transactional-outbox]].
- **Write to the database only**, and read its own change log to feed
  everything else. That's [[change-data-capture]].
- **Write to the log only** (a Kafka topic, say), and let every store,
  including your own database, consume it in order. The log fixes the
  order, so the race goes away. The catch is that your own service
  can't read back what it just wrote until it has consumed its own
  message, so you lose read-your-own-writes.

All three trade instant consistency between systems for a system that
catches up reliably.

## Where it gets tricky

**It looks fine for a long time.** Dual writes are popular because
they're easy to build and they mostly work at first. The failures
come from crashes and races that rarely show up in testing, and when
they happen in production nothing reports them.

**Cache and index updates are dual writes too.** "Write the database,
then invalidate the cache" and "write the database, then reindex" have
the same two failure modes. The phase 9 [[caching-patterns]] run into
this.

**A retry doesn't close the gap.** Retrying the publish helps with a
flaky broker, but not with a process that crashed between the two
writes: after the crash, nothing remembers that a message was owed.

## What this means when you build

- Look for any request handler that writes to your database and then
  calls a broker, cache, index or another service. Each one is a dual
  write.
- Decide which system is the source of truth, write only there, and
  drive the others from it.
- For database plus messages, reach for the [[transactional-outbox]]
  or [[change-data-capture]], not a second write after `COMMIT`.

## Further reading

- [Using logs to build a solid data infrastructure (or: why dual writes are a bad idea)](https://www.confluent.io/blog/using-logs-to-build-a-solid-data-infrastructure-or-why-dual-writes-are-a-bad-idea/), Martin Kleppmann, 2015. The race and partial-failure examples, why they cause permanent inconsistency, and the log-based alternative.
- [Reliable Microservices Data Exchange With the Outbox Pattern](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/), Gunnar Morling, Debezium, 2019. The database-plus-Kafka version of the problem, why Kafka can't join an XA transaction, and what writing to Kafka first costs you.

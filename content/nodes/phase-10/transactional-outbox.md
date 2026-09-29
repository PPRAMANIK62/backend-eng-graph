---
id: transactional-outbox
title: The transactional outbox
depth: deep
phase: 10
note: >-
  Write the event in the same transaction as the data, and relay it
  later.
needs: [dual-writes, transaction, idempotency]
leads_to: [background-jobs, sagas]
compare_with: [dual-writes, change-data-capture, idempotency-keys, exactly-once-processing, event-sourcing]
---

# The transactional outbox

The transactional outbox is how a service changes its database and
sends a message without the two ever drifting apart. Instead of calling
the broker, you insert the message into an `outbox` table in the same
transaction as the data change. A separate process, the relay, reads
committed outbox rows and delivers them to the broker. The message goes
out if and only if the transaction commits, at the price of arriving a
little later and sometimes twice.

## The problem it solves

An order service inserts an order and must tell the shipping service
about it. Doing that as two writes, one to Postgres and one to Kafka, is
a [[dual-writes|dual write]]: a crash between them leaves an order with
no message, or a message with no order. A [[transaction]] can't cover
both, because it only covers the database, and a distributed
transaction ([[two-phase-commit]]) is usually not available between a
database and a broker. Kafka, for one, can't join an XA transaction.

The outbox gets around this by never writing two systems at once. The
service writes only to its own database. Getting the message to the
broker becomes a separate job that can be retried until it works.

## Write the message in the same transaction

Here's the order service's write, with the outbox:

```sql
BEGIN;
INSERT INTO orders (id, customer_id, total)
  VALUES (1042, 7, 3999);
INSERT INTO outbox (id, aggregate_type, aggregate_id, type, payload)
  VALUES ('9f2c7a1e-5b3d-4c8a-9e61-0d4b7f3a2c10', 'order', '1042', 'OrderPlaced',
          '{"order_id": 1042, "customer_id": 7, "total": 3999}');
COMMIT;
```

Both rows commit together or not at all. If the transaction rolls back,
there's no outbox row, so no message will ever be sent for an order
that doesn't exist. If it commits, the message is safely on disk next
to the order, and nothing can lose it.

The columns are the ones from Debezium's outbox example (with
underscores added), and each has a job:

- `id` is a unique event id. Consumers use it to spot duplicates.
- `aggregate_type` picks the topic, so all order events go to one
  topic and all customer events to another.
- `aggregate_id` becomes the message key. Every event for order 1042
  lands in the same partition, so consumers see them in order (see
  [[message-ordering]]).
- `type` and `payload` are the event itself.

The payload is an event you design, not a copy of the `orders` row.
That matters: consumers depend on the event's shape, not on your
table's, so you can change your schema without breaking them. It also
means the event format is part of your service's API, and has to evolve
as carefully as one.

![Flow of one order. The order service runs one transaction that inserts into the orders table and the outbox table in Postgres. A relay reads committed outbox rows, either by polling or by tailing the WAL, and publishes them to a Kafka topic keyed by order id. The shipping service consumes the message, checks the event id against a processed-events table, and does its work in one local transaction.](img/transactional-outbox-flow.svg)

*One transaction writes the data and the event; everything after it can be retried. Adapted from Gunnar Morling, "Reliable Microservices Data Exchange With the Outbox Pattern" (Debezium, 2019).*

## Two ways to run the relay

The relay's whole job is: find outbox rows that haven't been sent, send
them, remember that they were sent. There are two ways to find them.

**Polling.** The relay queries the table in a loop:

1. Start a transaction and select a batch of outbox rows, oldest first.
2. Publish each one to the broker and wait for the broker to accept it.
3. Delete (or mark) the rows it just sent, and commit.

A reader only sees committed rows, so the relay can't pick up a message
from a transaction that's still running or that later rolls back. Brandur
Leach's version for background jobs runs a single relay at a time under
a lock, and uses `REPEATABLE READ` so the `DELETE` removes exactly the
rows the `SELECT` saw. Polling needs nothing special from the database. The costs are
queries that often find nothing (Brandur's loop backs off when the
table is empty) and the delay between polls.

**Tailing the log.** Instead of querying the table, the relay reads the
database's own change stream, for Postgres its [[write-ahead-log]]
read through [[logical-replication]]. This is
[[change-data-capture]] pointed at one table. Debezium does this and
ships an "outbox event router" that turns outbox inserts into messages
on the right topic, with the right key. Capture happens in near real
time with low overhead, since nothing polls.

With log tailing there's a neat trick: insert the outbox row and delete
it again in the same transaction. The WAL still records the `INSERT`,
so the relay sees the event, but the table itself stays empty and never
needs cleaning up.

## Duplicates come with it

The relay can crash after the broker accepted a message but before it
recorded that it sent it. On restart it sends the message again. So the
outbox gives you at-least-once delivery, never exactly once (the
[[delivery-guarantees]] page covers the vocabulary).

The consumer has to cope. The usual way: keep a table of event ids
you've processed, and in one local transaction, check the id, do the
work, and insert the id. A duplicate finds its id already there and is
skipped. If the work fails, the transaction rolls back, the id isn't
recorded, and the message can be retried. This is [[idempotency]] on
the consumer side, and consumers of most brokers need it anyway,
because brokers redeliver too.

## Order, and how polling can lose messages

Events for one order should reach consumers in the order they were
written. Keying by `aggregate_id` keeps them in one partition once
they're in the broker. The harder part is reading them out of the
table in the right order.

The obvious polling design gives each outbox row a `BIGSERIAL`
position and has the relay remember "the last position I sent", then
ask for rows after it. In Postgres this can skip messages.

A sequence hands out numbers when a row is inserted, not when its
transaction commits. So three transactions can take positions 11, 12
and 13, and the one holding 13 can commit first:

![Timeline of three transactions. T1 takes position 11, T2 takes 12, T3 takes 13. T3 commits first. The relay polls, sees only row 13, sends it and saves last position = 13. Then T1 and T2 commit. The next poll asks for positions greater than 13, so rows 11 and 12 are never sent.](img/transactional-outbox-sequence-gap.svg)

*A higher number can commit before a lower one, and a relay that only moves forward skips the gap. Adapted from Oskar Dudycz, "How Postgres sequences issues can impact your messaging guarantees" (2022).*

The relay can't tell whether 11 and 12 are missing because their
transactions rolled back (sequence numbers are never reused, so gaps
are normal) or because they haven't committed yet. If it assumes
rollback, it loses messages.

There are a few ways out:

- **Delete sent rows instead of tracking a position.** A relay that
  reads whatever unsent rows exist, sends them and deletes them, like
  the polling loop above, never skips anything, because 11 and 12 are
  still waiting on the next poll. What you lose is strict order: 13 went
  out before 11.
- **A gapless counter.** A single-row counter table, updated in each
  transaction, gives numbers in commit order. It also makes every
  writer wait on that one row lock, which serialises all your writes.
- **Filter by transaction id.** Store the writing transaction's id
  (an `xid8` column) in each outbox row, and only
  read rows from transactions older than the oldest one still running,
  from `pg_snapshot_xmin(pg_current_snapshot())`. You never read past a
  transaction that might still commit. The order you get follows when
  transactions started, not when rows were written, and one long
  transaction holds the relay back until it ends.
- **Tail the log.** A database's change log comes out in commit
  order, so log-based relays don't have this problem.

## Where it gets tricky

**"Preserves order with sequence numbers" isn't enough.** Some
write-ups say the outbox keeps events in order because rows carry
timestamps and sequence numbers. Under concurrent writers, as shown
above, a sequence gives insertion order, not commit order. Test the
relay with overlapping transactions before you trust it.

**Nothing forces you to write the outbox row.** The pattern relies on
every code path that changes data also inserting its event. Forgetting
one is an easy bug and the database won't complain.

**Enqueueing inside the transaction isn't an outbox.** Pushing to Redis
or a job queue before `COMMIT` has two failure modes: a fast worker
picks up the job before the data it needs is committed and fails, or
the transaction rolls back and the job can never succeed. Pushing after
`COMMIT` brings back the crash-in-between problem. Staging the job in a
table, as an outbox, avoids both. The same idea turns up in
[[background-jobs]].

**Outbox or log capture of the business tables?** You could skip the
outbox and capture changes to `orders` directly with
[[change-data-capture]]. That's less code in the service, but consumers
then see your internal table layout, and a schema change can break
them. The outbox keeps a deliberate event between you and them.

**The outbox is not event sourcing.** In [[event-sourcing]] the events
are the source of truth and the state is derived from them. With an
outbox the tables are the truth and the events are a notification.
Event sourcing is an alternative way to get the same guarantee, since
there's only one write, to the event store.

**Consumers are behind.** The shipping service learns about the order
a little after it's committed. The order service itself reads its own
writes immediately, because it wrote its own database first; everyone
else is eventually consistent.

## What this means when you build

- Put the event insert in the same transaction as the change, in the
  same database. Never call the broker from inside the request's
  transaction.
- Give every event a unique id and make every consumer skip ids it has
  already processed, in the same transaction as its work.
- Key messages by the entity id so one entity's events stay in order.
- If you poll, don't track "last sequence number sent". Delete sent
  rows, or filter by transaction id, and run a single relay.
- If you tail the log, you get commit order and no polling, but you now
  run a replication slot; see [[logical-replication]] for what that
  costs.
- Treat the event payload as a public API: version it, add fields
  instead of changing them.

## Further reading

- [Pattern: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html), Chris Richardson. The pattern as named: the problem, the forces, the if-and-only-if guarantee, duplicates, and the two relay styles.
- [Reliable Microservices Data Exchange With the Outbox Pattern](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/), Gunnar Morling, Debezium, 2019. A full worked example with Postgres, Debezium and Kafka: the outbox columns, the insert-then-delete trick, and duplicate detection in the consumer.
- [Transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html), AWS Prescriptive Guidance. Both failure orders of a dual write, and a polling relay that deletes rows after the broker accepts them.
- [Transactionally Staged Job Drains in Postgres](https://brandur.org/job-drain), Brandur Leach, 2017. The outbox for background jobs, why enqueueing inside or after a transaction fails, and a single-relay drain loop.
- [Using logs to build a solid data infrastructure (or: why dual writes are a bad idea)](https://www.confluent.io/blog/using-logs-to-build-a-solid-data-infrastructure-or-why-dual-writes-are-a-bad-idea/), Martin Kleppmann, 2015. Why a log read from the database in commit order is as good as writing to a log directly.
- [How Postgres sequences issues can impact your messaging guarantees](https://event-driven.io/en/ordering_in_postgres_outbox/), Oskar Dudycz, 2022. Why polling by sequence number skips messages, and the transaction-id fix.

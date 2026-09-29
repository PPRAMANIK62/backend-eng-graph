---
id: event-sourcing
title: Event sourcing
depth: deep
phase: 10
note: >-
  Store the events, derive the current state from them.
needs: [log-based-messaging, optimistic-concurrency]
leads_to: [cqrs, durable-execution]
compare_with: [change-data-capture, log-compaction, transactional-outbox]
---

# Event sourcing

Event sourcing means you don't store the current state of your data and
overwrite it. You store every change as an event, in order, and never
change or delete those events. The current state is whatever you get by
replaying them. The event log is the source of truth; tables, caches
and views are derived from it and can be rebuilt at any time.

## One account, two ways

A bank account is the classic example, because accounting already works
this way. The usual design keeps one row:

| id | balance |
|---|---|
| 7 | 110 |

Every deposit reads the row, changes the balance and writes it back.
The row tells you where the account is. It doesn't tell you how it got
there.

The event-sourced design keeps the account's history instead, as a
stream of events for account 7:

1. `AccountOpened`
2. `MoneyDeposited 100`
3. `MoneyDeposited 30`
4. `MoneyWithdrawn 20`

To get the balance, you start from nothing and apply each event in
order: 0, then 100, 130, 110. That process is called replaying, or
rehydrating the account. A ledger of entries is exactly this, which is
why the pattern feels natural in accounting.

A few habits come with it:

- **Events are named in the past tense.** `MoneyDeposited`, not
  `DepositMoney`. A command asks for something and can be refused; an
  event records something that already happened and can't be.
- **Events record intent, not just the new value.** "Two seats were
  reserved" says what happened. "Remaining seats is now 42" only says
  where you ended up, and throws the reason away.
- **Nothing is deleted.** To undo a change, you append a new event that
  reverses it: a `MoneyWithdrawn` to reverse a mistaken deposit, a
  `ReservationCanceled` for a `SeatsReserved`. The mistake stays in the
  history, along with its correction.

## What you get for it

Because every change to the state goes through an event, you can:

- **Rebuild from scratch.** Throw away the current state and replay the
  whole log to recreate it.
- **Ask about the past.** Replay up to a given point to see the state as
  it was then, the way a version control system shows old revisions.
- **Fix bugs retroactively.** If the code that applied events was wrong,
  fix it and replay; the derived state becomes what it should have
  been.
- **Build new views later.** A new report or read model can be built by
  replaying events that were stored before anyone thought of it.
- **Keep an audit trail** that is the data itself, not a side log that
  might disagree with it.

## The event store

The store that holds events can be small. A minimal design uses two
relational tables: one row per event (entity id, version number, the
serialized event), and one row per entity holding its current version.
It needs only two operations:

1. **Read a stream:** all events for one entity, in version order.
2. **Append to a stream,** with the version you expect the stream to be
   at.

![Left: an event stream for account 7, versions 1 to 4, with a snapshot of the balance stored after version 3. Loading the account reads the snapshot and replays only version 4 to get balance 110. Right: two command handlers both load account 7 at version 4 and try to append version 5. The store accepts the first append and rejects the second, because the stream is no longer at version 4; the second handler reloads and retries.](img/event-sourcing-stream.svg)

*Loading an entity from a snapshot plus the events after it, and the expected-version check on append. Adapted from Greg Young, "CQRS Documents" (2010), "Building an Event Storage".*

The expected version is what keeps two writers from both acting on
stale state. Say two requests both load account 7 at version 4, both
see a balance of 110, and both try to withdraw 100. Each tries to append
version 5 "expecting version 4". The first append succeeds. The second
finds the stream at version 5, not 4, and is rejected. Its handler
reloads the account, now at 10, and refuses the withdrawal. This is
[[optimistic-concurrency]], and the version is per entity, because an
entity is the boundary inside which you promise consistency.

That's also why a message broker isn't an event store. Kafka is a fine
way to fan events out to other systems ([[log-based-messaging]]), but
it has no "read the events for account 7" and no "append only if the
stream is still at version 4". Event stores are either databases built
for this or ordinary relational or document databases with an
append-only table, where you build those two operations yourself.

## Snapshots keep replay cheap

Replaying a stream from the beginning on every request gets slow once
an entity has many events. The fix is a snapshot: every so often (say
every N events), store the entity's state as of that version. Loading
means reading the latest snapshot and replaying only the events after
it.

Snapshots are only a cache. The events stay the truth, and you can
throw snapshots away and regenerate them at any time.

## Reads come from projections

The event store is good at one query: give me this entity's events.
It's bad at "all accounts with a negative balance" or "orders placed
today", because there's no general query language over events.

So reads come from projections: handlers that consume events as they're
appended and keep a read-optimized view up to date, a table of current
balances, a search index, a dashboard. Splitting the write model (the
event streams) from read models like this is [[cqrs]], and the two are
usually used together.

Two things follow:

- **Projections lag.** A read right after a write may not see it yet.
  The system is eventually consistent between the event store and every
  view.
- **Handlers see events more than once.** Delivery to projections is
  typically at least once, so each handler has to be idempotent
  ([[idempotency]]), for example by tracking the last event position it
  applied.

## Replays and the outside world

Replaying is safe only as long as it has no side effects. If applying
`OrderPlaced` also sends a confirmation email, rebuilding the state
would email every customer again. Code that talks to other systems has
to sit behind a gateway that knows whether it's running for real or
replaying, and stays silent during replay.

Queries to other systems have the same problem in reverse. If handling
an event looked up an exchange rate, a replay a week later needs the
rate from that day, not today's. Either the other system can answer
"as of" a time, or your gateway remembers every answer it got and hands
back the recorded one during replay.

The idea of recording results so a replay reproduces the same outcome
comes back in [[durable-execution]], which replays a workflow's
recorded history after a crash.

## Where it gets tricky

**Events outlive the code that wrote them.** Requirements change and
old events stop fitting the model. You can't edit them (that breaks the
audit trail), so you have options, each with a cost:

- tolerant readers that ignore unknown fields and default missing ones,
  which handles additions;
- a version number on each event, with handling code per version;
- upcasting, where code converts old events to the current shape as
  they're read, and the stored events stay as they were;
- rewriting the stored events, as a last resort, since it destroys the
  history you adopted the pattern to keep.

Once you upcast or rewrite, you can no longer reproduce exactly what
the system showed before the change. The "perfect history" is less
perfect in practice.

**Bugs are stored forever.** If a bug produced wrong events, fixing the
code doesn't fix the events. You append corrections, or teach the
replay to handle the bad ones.

**Deleting personal data.** Laws that give people a right to have their
data erased clash with a store where nothing is deleted. The usual
answers: keep personal data outside the events and refer to it by id,
or encrypt it in the events with a key per person and delete the key
("crypto-shredding").

**Shared event streams couple services.** Letting other services
subscribe to your raw events means they depend on your internal event
shapes, the same as reading your tables directly, and the web of
subscribers gets hard to follow. Events that are fine inside one
service are often too low-level for others; you may need separate,
deliberately designed integration events.

**It costs a lot of code.** Commands, handlers, events, aggregates and
one projection per view, each of which has to change when an event
type changes. One team that ran an event-sourced system in production found the
cost far higher than expected, and concluded that a plain history
table would have given most of the value for much less.

**Most systems don't need it.** For plain create-read-update-delete
data, short-lived products, or views that must be up to date the
instant a write returns, it adds cost with little return. It also
doesn't have to be all or nothing: event-source the ledger or the order
pipeline, keep user profiles as ordinary rows.

**It's not change data capture.** [[change-data-capture]] also produces
a stream of changes, but from a normal database whose tables are the
truth, and the events are row diffs. In event sourcing the events are
the truth and carry business meaning; the tables are derived.

## What this means when you build

- Use it where history and audit are part of the requirement (money,
  orders, reservations), not across a whole system by default.
- Design events around what happened in the business, in the past
  tense, and treat their format as a long-lived contract.
- Append with an expected version per entity so concurrent writers
  can't both act on stale state.
- Add snapshots once replaying a stream gets slow; keep them
  disposable.
- Serve reads from projections, make handlers idempotent, and plan for
  them to lag.
- Keep side effects out of replay, and decide early how you'll erase
  personal data.

## Further reading

- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), Martin Fowler, 2005. The original pattern write-up: rebuild, temporal queries, replay, snapshots, and the trouble with external systems during replay. A draft, but still the clearest start.
- [CQRS Documents](https://cqrs.files.wordpress.com/2010/11/cqrs_documents.pdf), Greg Young, 2010. Past-tense events, no deletes, rolling snapshots, and a minimal event store on two tables with an optimistic concurrency check.
- [Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing), Microsoft Azure Architecture Center. A current, balanced treatment: projections, versioning strategies, idempotent handlers, personal data, and when not to use it.
- [Don't Let the Internet Dupe You, Event Sourcing is Hard](https://chriskiehl.com/article/event-sourcing-is-hard), Chris Kiehl, 2019. What went wrong in one team's production event-sourced system, and the questions to ask before adopting it.

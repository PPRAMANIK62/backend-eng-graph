---
id: sagas
title: Sagas
depth: deep
phase: 12
note: >-
  A long operation as local steps, with a compensating step to undo each
  one.
needs: [two-phase-commit, transactional-outbox]
leads_to: [orchestration-vs-choreography]
compare_with: [two-phase-commit, durable-execution, distributed-transactions]
---

# Sagas

A saga runs a long operation as a series of local transactions, one
per step, each committing on its own. If a later step fails, you don't
roll back: you run a compensating step for each step that already
committed, newest first. It's the usual answer when an operation spans
several services or databases and [[two-phase-commit]] is too fragile,
too slow, or simply not available.

## The order that touches three services

Take an online shop split into services, each with its own database.
Placing an order means three things:

1. The order service records the order.
2. The customer service reserves the amount against the customer's
   credit limit.
3. The stock service reserves the items.

There's no single database, so there's no single [[transaction]]
covering all three. You could try two-phase commit across the three
databases, but then each service holds locks while it waits on a
coordinator owned by someone else, and a coordinator crash leaves them
all stuck. Many teams rule 2PC out here from the start.

A saga does it differently. Each step is an ordinary local transaction
that commits right away:

- **T1:** create the order with status `PENDING`.
- **T2:** reserve 100 of the customer's credit.
- **T3:** reserve the stock.

And each step that might need undoing gets a **compensating
transaction**:

- **C1:** mark the order `REJECTED`.
- **C2:** release the 100 of credit.

If all three steps succeed, the order moves to `APPROVED` and you're
done. If T3 fails because the item is out of stock, the saga runs C2
then C1. Either every step happens, or some prefix happens and is then
compensated in reverse. Those are the only two outcomes a saga
promises.

![Three forward steps in a row: T1 create order (status PENDING) in the order service, T2 reserve credit (100 held) in the customer service, and T3 reserve stock in the stock service, which fails because the item is out of stock. An arrow turns back to the compensating steps, run newest first: C2 release credit, then C1 reject order (status REJECTED). Notes say that between T2 and C2 other requests can see the 100 held, and that C1 moves the order to a new state rather than deleting it.](img/sagas-compensation.svg)

*A saga that fails at its third step and compensates the first two. The order and credit example is adapted from Chris Richardson, "Pattern: Saga" (microservices.io).*

## Compensation is not rollback

The name and the idea come from a 1987 paper by Hector Garcia-Molina
and Kenneth Salem, written about long-lived transactions inside one
database: jobs that run for hours or days and would hold locks the
whole time. Their fix was to cut such a job into steps that commit
separately and release their locks, so other work can run in between.

That's where the key difference comes from. A rollback puts the old
bytes back. A compensation is a new transaction that undoes the step's
*meaning*, and it doesn't restore the old state. Their example is an
airline seat. If T1 booked a seat, C1 cancels that booking. It can't
write back the old number of free seats, because other bookings may
have happened since.

The same holds in the shop. C2 releases this order's hold on 100 of
credit; it doesn't reset the customer's balance to what it was before
T2, because the customer may have placed other orders in between.
Compensations work in the language of the business: cancel, refund,
release, reverse.

This also means compensations can reach outside the database. The
original paper's example: if a step sent a letter, the compensation
sends a second letter explaining the problem. Some actions have no
compensation at all (their example is a transaction that fires a
missile), and those need special care, below.

## Three kinds of step

Not every step can be compensated, and the useful way to design a saga
is to sort its steps into three kinds:

- **Compensable** steps can be undone by a later transaction. Creating
  a pending order and reserving credit are compensable.
- The **pivot** is the point of no return. Once it succeeds, the saga
  can only go forward. In the shop, charging the customer's card
  could be the pivot.
- **Retryable** steps come after the pivot. They must eventually
  succeed, so they must be safe to repeat, which means [[idempotency]].
  Sending the confirmation email, say.

Put the steps that are likely to fail, and the ones that are easy to
undo, before the pivot. Put the steps you can't undo after it, and make
sure they can always be retried until they succeed.

This lines up with the two recovery modes in the original paper. When
a saga is interrupted, you can go **backward** (run the compensations)
or **forward** (keep retrying the missing steps). Going forward only
works if you can assume every remaining step will succeed if retried
enough times.

## Who runs the saga

Something has to remember which steps have run and decide what's next.
There are two common shapes, compared in
[[orchestration-vs-choreography]]:

- **Choreography.** Each service does its step and publishes an event;
  the next service reacts to it. No central controller, but the flow
  is spread across services and hard to follow.
- **Orchestration.** One orchestrator tells each service what to do and
  waits for the reply. The flow is in one place, and the orchestrator
  becomes something that must not lose its state.

Either way, the saga's progress has to survive crashes. The original
paper kept it in the database's log, so after a crash the system could
see which sagas had no end record and compensate them. An
orchestrator does the same job by storing each step's result, the idea
behind [[durable-execution]] engines.

Each step also has two things to do at once: commit its local change
and send the message that triggers the next step. Doing those as two
separate writes is the [[dual-writes]] problem, and the usual fix is a
[[transactional-outbox]].

## Where it gets tricky

**A saga has no isolation.** This is the big one. Every step commits
immediately, so other requests see the saga's half-done state. Between
T2 and C2, another order from the same customer sees 100 of credit
already held, and may be refused because of an order that's about to
be rejected anyway. When a compensation runs, nobody who saw the
earlier step is told. The classic anomalies all come back: [[lost-update|lost updates]] when two sagas overwrite each other, [[dirty-read|dirty reads]] of data a saga will compensate, and [[non-repeatable-read|non-repeatable reads]] between steps.

You counter this in the design, not with a setting. The usual
countermeasures:

- A **semantic lock**: the `PENDING` status itself says "a saga is
  working on this", and other code treats pending rows with care.
- **Commutative updates**, so steps from different sagas can apply in
  any order.
- Ordering the saga so risky updates happen late, in retryable steps,
  where they'll never be compensated.
- **Rereading** a value just before updating it, and restarting if it
  changed.

**Compensations fail too.** A compensation is code, and it can hit a
bug or a missing resource. Retrying won't help if the bug is still
there, and the saga is then stuck: it can't go back and can't go
forward. The original paper already names this case; its suggestion
is an alternate block of code to run when the primary fails. In
practice someone gets paged. Make compensations simple, retryable and
idempotent, and alert on sagas that stay unfinished.

**The caller doesn't get an answer right away.** The request that
started the saga returns before the saga ends. The client either
waits, polls the order's status, or gets notified later. Your API has
to show that state (`PENDING`) honestly.

**It's workflow, and that's the point.** Pat Helland's view, from
building large systems, is that past a certain scale nobody uses
distributed transactions, and uncertainty moves out of record locks
and into the business logic. A reservation that can later be confirmed
or cancelled is how the real world handles it too: a warehouse holding
stock for an order that may not go through, an escrow account in a
house sale. Sagas are the engineering name for that. They're more
work than a transaction, and they match how businesses already behave.

**Sagas and 2PC aren't rivals everywhere.** Inside one distributed
database, the database's own transactions (built on 2PC) are simpler
and give you isolation. Sagas are for when the steps belong to
different services, different owners, or outside systems that can't
take part in 2PC. Some teams mix them, using a real transaction for
the risky part and a saga for the rest.

## What this means when you build

- List every step and its compensation before you write code. If a
  step has no compensation, it must be the pivot or come after it.
- Put the pivot as late as you can, and make every step after it
  idempotent and retryable.
- Store saga progress durably: an orchestrator's log, or an outbox and
  events. A saga whose state lives only in memory is a bug waiting for
  a restart.
- Model intermediate states in your data (`PENDING`, `RESERVED`) and
  treat them as semantic locks.
- Write compensations as business actions (release, refund, cancel),
  never as "restore the old value".
- Alert on sagas that don't finish, and know how a human finishes one.

## Further reading

- [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf), Hector Garcia-Molina and Kenneth Salem, 1987. The original: compensating transactions, backward and forward recovery, and what to do when a compensation fails.
- [Life beyond Distributed Transactions](https://www.cidrdb.org/cidr2007/papers/cidr07p15.pdf), Pat Helland, 2007. Why large systems give up distributed transactions, and tentative operations that confirm or cancel.
- [Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga), Microsoft Azure Architecture Center, 2025. Compensable, pivot and retryable steps, the anomalies sagas allow, and the countermeasures.
- [Pattern: Saga](https://microservices.io/patterns/data/saga.html), Chris Richardson. The order and credit example, choreography vs orchestration, and the drawbacks.

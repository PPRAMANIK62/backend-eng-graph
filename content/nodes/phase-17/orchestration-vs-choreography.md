---
id: orchestration-vs-choreography
title: Orchestration vs choreography
depth: short
phase: 17
note: >-
  One coordinator calls the steps vs services reacting to each other's
  events.
needs: [sagas]
leads_to: [durable-execution]
compare_with: [monolith-vs-microservices]
---

# Orchestration vs choreography

When one business operation spans several services, something has to
decide which step runs next. In **orchestration**, one component, the
orchestrator, calls each service in turn and knows the whole flow. In
**choreography**, there's no such component: each service does its
part when it sees an event, and publishes an event of its own. The
choice decides where the flow lives in your code, and who can tell you
what state an operation is in.

## One order, two ways

Take the shop order from [[sagas]]: create the order, reserve the
customer's credit, reserve the stock. Three services, three local
steps.

**Orchestrated,** an order orchestrator receives the request. It calls
the order service to create a pending order, then the customer service
to reserve credit, then the stock service. It waits for each reply and
decides what comes next, including which compensations to run if a
step fails. The services don't know they're part of a larger flow.
They just answer requests.

**Choreographed,** the order service creates the pending order and
publishes an `OrderCreated` event to a broker. The customer service is
subscribed, reserves the credit and publishes `CreditReserved`. The
stock service reacts to that, and so on. If a step fails, the service
publishes a failure event, and the services that already did something
react to it by running their own compensations. Nobody tells anyone
what to do.

![Two panels. Left, orchestration: a client request reaches an order orchestrator, which calls the order service (1, create pending order), the customer service (2, reserve credit) and the stock service (3, reserve stock) and gets a reply from each. Right, choreography: the client request reaches the order service, which publishes OrderCreated to a message broker; the customer service consumes it and publishes CreditReserved; the stock service consumes that and publishes StockReserved; the order service consumes it and marks the order approved. A note under the right panel says the flow exists only in the subscriptions.](img/orchestration-vs-choreography-order.svg)

*The same order both ways. Adapted from the orchestrator and broker diagrams in Microsoft's "Choreography pattern" (Azure Architecture Center).*

## What each one costs

**The orchestrator knows the state.** Because every reply comes back
to it, the orchestrator can say where an operation is: "credit
reserved, waiting on stock". It's also the one place to read the flow,
change it, and put retries and timeouts.

But the orchestrator has to know every service's job, so adding or
removing a service means changing it. Under load it can become a
bottleneck, and if it goes down, every operation it runs stops. If it
keeps its progress only in memory, a crash also forgets which steps
already ran.

**Choreography keeps services apart.** Each service only knows the
events it consumes and the ones it publishes, usually through a
[[message-queue]] or [[pub-sub]] broker. You can add a new reaction
(send a receipt when `StockReserved` appears) without touching anyone
else. It suits steps that can run in parallel and independently.

What you lose is the flow itself. It isn't written in any one
program; it's the sum of who subscribes to what. Often the only way to
see it is to watch a live system. No single component has the whole
state of an operation in flight, so you need
[[distributed-tracing]] and correlation ids just to answer "what
happened to order 42?".

Choreography also gets awkward when steps must happen in order or wait
for each other. If a delivery step has to wait for both "package
ready" and "drone scheduled", the delivery service has to collect the
two messages and match them itself, because nothing else is tracking
the operation.

## Where it gets tricky

**The same problems show up in both, just in different places.** Each
step still has to update its database and publish its message
atomically, which is the [[transactional-outbox]] problem. Messages
still arrive twice or out of order, so consumers still need
[[idempotency]]. Compensations can still fail. Choreography spreads
these across every service instead of one.

**Events that are really commands.** A service that publishes an event
and expects one particular service to act on it is issuing a command
dressed as an event. The coupling is still there, only harder to see.
If you need something done, say so with a command to the service that
does it.

**Event storms.** When many services react to each other's events, a
small event can set off a cascade, or two services can end up
triggering each other in a loop. Nobody designed that flow, so nobody
spots it until it happens.

**Changing an event breaks readers you don't know about.** Many
services may consume the same event. Change its shape and you can
break any of them. Treat event formats as contracts and change them
only in backward-compatible ways; see [[message-schemas]].

**It doesn't have to be all one or the other.** A reasonable split is
choreography between domains, where loose coupling matters most, and
an orchestrator inside one domain, where someone needs to own the
flow.

**The orchestrator's memory is the weak point.** An orchestrator is
only as reliable as the record of what it has done so far. Engines
that store every step's result and resume after a crash take care of
that; see [[durable-execution]].

## What this means when you build

- If one team owns the whole flow and needs to know its status,
  orchestrate it.
- If independent teams react to facts about each other's domains,
  publish events and let them choreograph.
- Either way, write the flow down. For choreography that means a
  diagram of who consumes what, and tracing with a correlation id on
  every message.
- An orchestrator must store its progress durably. Don't keep "which
  steps ran" in memory.
- Use an outbox to publish, and make every consumer idempotent.

## Further reading

- [Choreography pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/choreography), Microsoft (Azure Architecture Center). The two styles side by side, what choreography makes harder, and a worked delivery example on a message bus.
- [What do you mean by "Event-Driven"?](https://martinfowler.com/articles/201701-event-driven.html), Martin Fowler, 2017. Why a flow spread over event notifications is hard to see, and the "passive-aggressive command".

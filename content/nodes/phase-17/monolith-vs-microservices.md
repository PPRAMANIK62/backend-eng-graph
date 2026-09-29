---
id: monolith-vs-microservices
title: Monoliths vs microservices
depth: deep
phase: 17
note: >-
  What splitting a system into services buys and what it costs.
needs: [distributed-system]
leads_to: [service-mesh]
compare_with: [system-design-method, orchestration-vs-choreography]
---

# Monoliths vs microservices

A monolith is an application built and deployed as one unit. A
microservice architecture builds the same application as many small
services, each in its own process, with its own data, deployed on its
own and called over the network. Splitting buys firmer boundaries
between parts of the code and independent deploys. It costs you a
[[distributed-system]]: slow and failing calls, no transactions across
services, and many more things to run. Which one is right depends on
how big the system and the team are, not on fashion.

## One shop, three shapes

Take an online shop with four jobs: the catalogue, orders, payments
and shipping.

**As a monolith**, all four are modules in one program. Placing an
order calls the payments module with an ordinary function call. All
four share one database, so "create the order and reserve the stock"
is one [[transaction]]. You build, test and deploy one thing. To handle
more traffic you run more copies of the whole program behind a
[[load-balancing|load balancer]].

**As microservices**, each job is its own service, usually owned by
one team. The order service calls the payment service over HTTP or
[[grpc|gRPC]]. Each service keeps its own database, and nobody else
reads it directly; they go through its API. Each service is built,
tested and deployed on its own schedule, and scaled on its own.

**As a modular monolith**, it's still one program and one deployment,
but the four modules have enforced boundaries: each exposes a public
API, owns its own tables, and a tool flags any place where one module
reaches into another's internals.

![Three panels. Left, a monolith: one process containing catalogue, orders, payments and shipping modules that call each other directly, all sharing one database. Middle, a modular monolith: the same single process and deployment, but each module sits behind a boundary with a public API and owns its own tables. Right, microservices: four separate processes, each with its own database, calling each other over the network, with the network calls marked as able to be slow or fail.](img/monolith-vs-microservices-shapes.svg)

*The same four jobs as one program, one program with enforced boundaries, and four services. Microservices layout adapted from James Lewis and Martin Fowler, "Microservices" (2014); the modular monolith from Kirsten Westeinde, "Deconstructing the Monolith" (Shopify, 2019).*

## What splitting buys

**Boundaries that are hard to cross.** Good modules matter more as the
code and the team grow. In theory a monolith can be just as modular as
a set of services. In practice it's easy to sneak around a module
boundary inside one program: import the internal class, query the
other module's table. Across a network there's nothing to sneak
around, so the boundaries tend to hold. Each service owning its own
data also removes the shared "integration database", a large source of
coupling in big systems.

**Independent deploys.** A change to shipping ships only shipping. A
bad deploy breaks one service, not the whole site. This fits teams
that deploy many times a day.

**Parts scale separately.** In a monolith, scaling the busy part means
scaling everything. With services you add copies of the one that's
under load.

**Teams line up with the code.** Conway's law says a system's design
copies the communication structure of the organisation that builds it.
Services organised around business capabilities, each owned by one
team, make that work for you: the boundaries where teams talk less are
the boundaries in the code.

**Isolation.** A crash in one service doesn't take down the others, and
one slow part can get its own queue and resources instead of blocking
everyone.

**Choice of tools.** Each service can use a different language or
database where that really helps.

## What it costs

**Every call can be slow or fail.** An in-process call basically
always works. A remote call adds network time and serialisation, and
can fail at any moment (the [[fallacies-of-distributed-computing]] are
the list of assumptions that stop holding). Chains add up: a service
that calls six others, each of which calls six more, collects all their
latencies. Making calls in parallel helps, but asynchronous code is
harder to write and debug. And every remote call needs its own answer to
"what if this fails?" ([[timeouts]], [[retries-with-backoff|retries]],
[[circuit-breakers]]).

**No transactions across services.** In the monolith, the order and the
stock reservation commit together. Split across two services with two
databases, they can't, and [[distributed-transactions]] are hard enough
that microservice designs avoid them. You coordinate with messages and
compensating steps instead ([[sagas]]), and accept that the system is
only [[eventual-consistency|eventually consistent]]: for a while, one
service knows about the order and the other doesn't.

**Many more things to run.** Dozens of services mean dozens of build
pipelines, deploys, dashboards and on-call alerts. Automated
[[ci-cd|continuous delivery]] goes from useful to essential, and
debugging a request that crosses many services gets hard, which is
what [[distributed-tracing]] is for. The complexity isn't gone; it has moved from inside the
code to the connections between services.

**Versions and APIs.** At any moment, several versions of several
services are talking to each other. Once a service publishes an API,
others depend on it, and changing it without breaking them takes care
([[api-versioning]], [[schema-evolution]]). A change that touches three
services can't be deployed atomically.

**Wrong boundaries are expensive.** Moving a function from one module
to another is a refactor. Moving it from one service to another is a
project. A naive split that turns fine-grained in-process calls into
remote calls gives you a chatty system that performs badly.

## Two stories from opposite directions

**Segment split, then merged back.** Segment's event pipeline once put
events for all its outbound destinations on one queue. When one
destination slowed down, its retries filled the queue and delayed
everyone, a textbook [[head-of-line-blocking|head-of-line block]]. The
fix was one service and one queue per destination, which worked. But
as the destinations grew past 140, so did the cost: shared libraries
drifted to different versions in different services because updating
all of them was risky, each service needed its own scaling settings,
and three full-time engineers spent most of their time keeping the
system alive. They merged everything into one service with one version
of each of 120 dependencies, and kept the per-destination isolation in
a separate queueing component. What they gave up: a bug in one
destination can now crash all of them, and in-memory caches are spread
across thousands of processes, so they hit less often.

**Shopify didn't split.** Shopify's Rails monolith, worked on by more
than a thousand developers for over a decade, had the classic problems:
changes broke unrelated tests, and new developers needed to understand
orders and payments before touching shipping. The cause was missing
boundaries, not being one program. So they reorganised the code by
business domain, gave each component a public API and sole ownership
of its data, and built a tool that flags calls across boundaries. One
payoff: the tax engine could later be swapped out for a new one.

## Where it gets tricky

**"Monolith" isn't an insult.** The word means one deployable unit,
not a mess. Most people who argue for microservices agree a
well-structured monolith is possible; they argue that it's rare,
because the boundaries are so easy to break.

**Microservices aren't required for fast delivery.** Large monoliths
can be delivered continuously; Facebook and Etsy are the usual
examples. And a set of services that must be released together has all
the costs and none of the independence.

**Start with a monolith?** One common view: almost every successful
microservice system started as a monolith that got too big and was
split, and systems built as microservices from day one often got into
serious trouble, because nobody can draw good boundaries before they
understand the domain. The counter-argument is that a monolith modular
enough to split later takes a lot of discipline, and starting with
services gets teams used to working that way. Even the people who wrote down
the monolith-first rule call the evidence thin and mostly anecdotes.

**Logical boundaries aren't physical ones.** A group at Google argues
that microservices mix up two decisions: how the code is split (for
people) and how it's deployed (for machines). Their prototype lets you
write one modular program whose components become remote calls only if
the runtime places them in different processes, and deploys every
version together. On their test application at 10,000 requests a
second it used 28 cores and 2.66 ms median latency against 78 cores
and 5.47 ms for the microservice version; with every component in one
process, 9 cores and 0.38 ms. Those are their numbers for their
prototype, and even they note that a shared database still couples
versions of an app together.

## What this means when you build

- Start with one deployable, and make it modular: modules with public
  APIs, each owning its tables, and a check that fails the build on
  violations.
- Split out a service when you have a concrete reason: a part that
  must scale or fail separately, a team that's blocked by others'
  deploys, a real isolation need.
- When you split, give the new service its own data. Two services
  sharing tables is the worst of both.
- Before splitting, budget for what it costs: timeouts and retries on
  every call, no cross-service transactions, a pipeline per service, and
  tracing.
- Keep the number of services small enough that one team can
  understand how a request flows through them. A [[service-mesh]] can
  take over retries and mTLS once there are many, but it doesn't remove
  the need to understand the calls.

## Further reading

- [Microservices: a definition of this new architectural term](https://martinfowler.com/articles/microservices.html), James Lewis and Martin Fowler, 2014. The common description of the style and how it differs from a monolith.
- [Microservice Trade-Offs](https://martinfowler.com/articles/microservice-trade-offs.html), Martin Fowler, 2015. The clearest list of what services buy and what they cost, with the caveats.
- [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html), Martin Fowler, 2015. Why to start with a monolith, the ways teams split later, and the counter-argument.
- [Goodbye Microservices](https://segment.com/blog/goodbye-microservices/), Alexandra Noonan, Segment, 2018. A real split and a real merge back, with what each cost.
- [Deconstructing the Monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity), Kirsten Westeinde, Shopify, 2019. The modular monolith in practice, on a very large codebase.
- [Towards Modern Development of Cloud Applications](https://sigops.org/s/conferences/hotos/2023/papers/ghemawat.pdf), Sanjay Ghemawat and others, Google, HotOS 2023. The argument for separating logical boundaries from deployment, with a measured prototype.

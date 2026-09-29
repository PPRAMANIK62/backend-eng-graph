---
id: cascading-failures
title: Cascading failures
depth: deep
phase: 13
note: >-
  One overloaded part pushes load onto the next until everything falls
  over.
needs: [load-shedding, load-balancing, retries-with-backoff, thundering-herd, health-checks]
leads_to: []
compare_with: [metastable-failures, capacity-planning]
---

# Cascading failures

A cascading failure is one that grows by feeding on itself: one part
of a system fails, that raises the load or the latency on the parts
still standing, and they fail too. It's how a single slow dependency
or one lost cluster turns into a whole service down, and it's the
failure that load shedding, deadlines and retry limits exist to stop.

## One cluster down, then the next

Take a service running in two clusters behind a
[[load-balancing|load balancer]]. Cluster A handles 1,000 requests a
second and is fine. Cluster B fails, and the load balancer does its
job: it sends B's users to A. A now gets 1,200 requests a second,
more than it can handle.

A doesn't just serve 1,000 and drop the rest. It runs short of CPU,
so every request slows down. Slower requests mean more requests in
flight at once, which means more memory, more threads, more file
descriptors. Replies start missing their callers' deadlines, callers
retry, and the retries add more load. The rate of *successful*
requests in A falls well below 1,000 a second, below what A handled
happily before B failed.

Then A's servers start crashing or failing health checks. The load
balancer, doing its job again, moves their traffic to cluster C, which
overloads the same way. This can spread across a whole service within
minutes, because load balancers and schedulers react fast.

![Three panels. 1, normal: a load balancer sends traffic to cluster A (1,000 QPS, fine) and cluster B (fine). 2, cluster B fails: all traffic goes to A, now at 1,200 QPS and over capacity, slow with missed deadlines and retries, so its successful rate drops well below 1,000 QPS. 3, A falls over too: A is crashing and the balancer moves its traffic to cluster C, which overloads the same way, within minutes. Caption line: each failure puts more load on what is left, positive feedback.](img/cascading-failures-domino.svg)

*How losing one cluster can take down the next. Adapted from Mike Ulrich, "Addressing Cascading Failures", in Google's Site Reliability Engineering (2016).*

Every step there was a sensible local decision. Moving traffic away
from a dead cluster is correct. Retrying a failed call is usually
correct. The cascade comes from their sum.

## How overload spreads inside one server

Resources run out in chains, and the chain can be long. Here's one:

1. A Java frontend's garbage collector is badly tuned.
2. Under high but expected load, GC eats the CPU.
3. Requests finish more slowly, so more are in progress at once.
4. More requests in progress use more memory, leaving less for the
   frontend's cache.
5. A smaller cache means a lower hit rate, so more requests go through
   to the backend.
6. The backend runs out of CPU or threads, and its health checks fail.

The first three steps can loop on their own: less CPU means slower
requests, more memory in use, more [[garbage-collection|GC]], and even
less CPU. That loop has a name, the GC death spiral.

The chain also hides its cause. During the outage you see the backend
failing health checks, owned by another team, while the trigger was a
GC setting in the frontend. Overload tends to produce many secondary
symptoms that each look like the root cause.

## How it spreads between services

**Latency eats the caller's resources.** Nearly every service has a
limit on requests it can have outstanding, set by its threads or its
memory. If a dependency gets slow, the caller's requests to it pile up
and use that limit. Say a new experimental service, used by 1% of
users, slows from 1 ms to 1 second per request. The calls for that 1% can hold so many threads that requests for the other
99% can't run. A failure in a small feature takes down all of them.
This is why a small amount of extra latency is fine and a large amount
starts cascades.

**Retries multiply load.** Each layer that retries multiplies the
traffic reaching the layers below (see [[retries-with-backoff]]). The
lower layer is then more overloaded, fails more, and gets more
retries.

**Fallbacks move the load.** Amazon once showed shipping speeds from a
cache and, if the cache failed, queried the supply-chain database
directly. When all the caches failed together, every web server hit
the database, it locked up, and the whole site went down. Fulfillment
centers used the same database, so they stopped too. A missing
shipping estimate became a worldwide outage (more in
[[graceful-degradation]]).

**Health checks kill what's left.** A server that's slow from overload
can fail its [[health-checks|health check]]. The balancer removes it,
or the scheduler restarts it, and its share of the load moves to the
rest. Load balancing that avoids servers returning errors does the
same thing. Envoy has a guard for this, the panic threshold: if fewer
than 50% of a cluster's hosts look healthy (the default), it stops
trusting health status and spreads traffic over all hosts, since
cutting the pool further would only overload the survivors.

## Why it doesn't stop by itself

Once servers crash under load, the remaining ones get more, and crash
too. Restarted servers come back into a flood of traffic and fail
almost at once, so the service crash-loops.

This is why removing the trigger often isn't enough. Say a service
was fine at 10,000 requests a second and started cascading at 11,000.
Dropping back to 9,000 won't stop it: the service now has far less
healthy capacity than before. If only 10% of servers are healthy
enough to serve, load has to fall to about 1,000 requests a second
before it can recover.

New or restarted servers make it worse because they start slow. They
have connections to open and code to warm up, and their caches are
empty. If the service needs its [[caching|cache]] to carry normal load (a capacity
cache, rather than a cache that only makes things faster), a restart
turns every request into an expensive one.

## What sets one off

The trigger is often small; the system was already close to the edge.
Common ones:

- A few processes dying, from a bad request that crashes them or from
  machines being rescheduled.
- Deploys or config pushes that restart many servers at once, or
  change what each request costs.
- Growth nobody matched with capacity.
- Planned drains or maintenance that remove a cluster.
- Leaning on spare CPU that other jobs on the same machines can take
  back.
- A traffic spike far above plan. At the Pokémon GO launch, backends
  that got slow instead of refusing requests led to load balancer
  retries, then synchronized client retries (a [[thundering-herd]]),
  and the load balancer tier's own worldwide capacity fell by half.

## Breaking the chain

Each defence cuts one link:

- **[[load-shedding|Shed load]]** at every server, so an overloaded
  server rejects the excess fast instead of slowing down for everyone.
  A well-built component, pushed past its limit, keeps its success rate
  and serves errors for the rest; a fragile one crashes.
- **[[graceful-degradation|Degrade]]** to cheaper answers when capacity
  is short.
- **Bound the time.** Set deadlines and pass them down
  ([[timeouts]], [[deadline-propagation]]), so nobody works on a
  request its caller abandoned.
- **Limit retries** to one layer, with backoff and a budget
  ([[retry-budgets]]).
- **Cap outstanding calls per dependency.** Facebook's clients count
  requests in flight to each service and fail new ones immediately
  over a limit, so one slow service can't take all of a caller's
  threads. Separate pools per dependency, [[bulkheads]], do the same.
  [[circuit-breakers|Circuit breakers]] go further and stop calling a
  failing dependency.
- **Keep calls flowing downward.** Servers in the same layer calling
  each other can spread thread-pool exhaustion sideways. Have the
  client make the call instead.
- **Test past the breaking point.** Load test each component until it
  fails, then check how far load must drop for it to recover (see
  [[load-testing]]).

When a cascade is already under way, the options are blunt: add
capacity if you have it; stop health checks from killing servers that
are only starting up; turn off batch work; and, as a last resort, drop
most traffic (say to 1%) until servers are healthy, then ramp back up
slowly so caches warm. Fix the trigger first, or it starts again as
soon as traffic returns.

## Where it gets tricky

**Cascading vs metastable.** A cascade spreads a failure across
parts. A [[metastable-failures|metastable failure]] is about time: the
system stays broken after the trigger is gone, held there by its own
retries or cold caches. The two overlap: the crash loop above, which
outlasts its trigger, is metastable as well as cascading. In a metastable failure
the feedback loop, not the trigger, is the real root cause, and the
loop can be contagious, pulling in parts the trigger never touched.

**Improvements to the normal case add risk.** Retrying failures,
moving load off unhealthy servers, killing unhealthy servers, adding
caches: each makes the everyday case better and each is a link in some
cascade. Before adding one, ask what it does when half the fleet is
unhealthy.

**Autoscaling isn't a cure.** Scaling up helps when you're short of
capacity. When a dependency is failing, requests get stuck on your
servers; scale up and you have more servers with stuck requests, and
more load on the failing dependency (see [[autoscaling]]).

## What this means when you build

- Assume any server can be overloaded, and make it reject extra work
  rather than slow down.
- Set a deadline on every call and a limit on requests outstanding to
  each dependency.
- Retry at one layer only, with backoff, jitter and a budget.
- Don't fall back onto a dependency that can't take the load; do less
  instead.
- Separate "is this process alive" checks from "can it serve right
  now" checks, and don't let a scheduler restart servers that are only
  busy.
- Find each component's breaking point by testing, and know how far
  load has to drop before it recovers.

## Further reading

- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google SRE book, 2016. The reference: causes, resource chains, crash loops, triggers, testing and what to do during one.
- [Fail at Scale](https://queue.acm.org/detail.cfm?id=2839461), Ben Maurer, ACM Queue, 2015. How latency and resource exhaustion spread failures at Facebook, and the library-level limits that stop it.
- [Avoiding fallback in distributed systems](https://d1.awsstatic.com/builderslibrary/pdfs/avoiding-fallback-in-distributed-systems.pdf), Jacob Gabrielson, Amazon Builders' Library, 2019. A fallback that turned a missing feature into a site-wide and fulfillment-wide outage.
- [The Site Reliability Workbook, chapter 11: Managing Load](https://sre.google/workbook/managing-load/), Cooper Bethea, Gráinne Sheerin, Jennifer Mace and Ruth King, Google, 2018. The Pokémon GO launch as a cascade, and how autoscaling can feed one.
- [Panic threshold](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/load_balancing/panic_threshold), Envoy docs (1.40.0-dev). A load balancer setting that stops health checking from cascading.
- [Metastable Failures in Distributed Systems](https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf), Nathan Bronson, Abutalib Aghayev, Aleksey Charapko and Timothy Zhu, HotOS 2021. Triggers vs the feedback loops that sustain a failure.

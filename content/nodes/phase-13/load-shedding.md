---
id: load-shedding
title: Load shedding
depth: deep
phase: 13
note: >-
  Rejecting some work on purpose, cheaply and early, to keep serving the
  rest.
needs: [goodput, bounded-queues, backpressure]
leads_to: [admission-control, graceful-degradation, cascading-failures]
compare_with: [autoscaling, rate-limiting, capacity-planning, metastable-failures]
---

# Load shedding

Load shedding is a server turning some requests away on purpose when
it's close to overload, so it can keep answering the rest quickly. It
sounds like giving up. It's the opposite: a server that accepts
everything past its limit ends up answering nothing in time, and one
that sheds keeps its [[goodput]] near its capacity. Every service that
can get more traffic than it planned for needs it, which is every
service.

## A server that says no stays useful

Picture an API server with a fixed pool of worker threads and a queue
in front of them. Its clients give up after a fixed timeout. Normally
the queue is nearly empty and replies come back well inside that
timeout.

Then traffic doubles, from a big customer's batch job or because
another cluster failed and its traffic moved here. The workers can't
keep up, so the queue grows. Every request now waits behind all the
ones before it. Soon the wait alone is longer than the timeout, so most
requests time out while still in the queue or just after a worker
picks them up. The workers are busy the whole time, doing work nobody
will read. Clients retry, and the queue grows faster.

Now give the same server a rule: if more than a set number of requests
are already in flight, answer new ones with HTTP 503 straight away.
Half the traffic gets a fast error. The other half gets served at
normal speed, well inside the timeout. Only the excess loses; the
requests the server accepts still succeed.

That's the whole idea. The rest of this page is about doing it well:
rejecting cheaply, noticing overload early, choosing what to drop, and
making sure the rejections don't come straight back.

It's the "drop" branch of the choice every overloaded system faces.
The other branch is [[backpressure]], slowing the sender down. A
[[bounded-queues|bounded queue]] makes you choose; load shedding is
what you do when the sender is a remote client you can't slow down.

## Rejecting has to be cheap

A rejection is only useful if it costs much less than serving the
request. That isn't automatic. If turning a request away still means
parsing it fully, writing a detailed log line, or holding a
thread while you build the error, a flood of rejections can overload
the server by itself. Google has seen backends overloaded while
spending almost all their CPU on rejecting requests. Amazon has found
that one accidental log statement or socket setting can make dropping
a request far more expensive than it should be.

The cost of a rejection depends on where it happens, which is why
large systems shed in layers:

![A request's path from left to right: client, gateway or load balancer, server door, queue, worker. Each stage has a reject arrow. Client: client-side throttling fails requests locally and costs the server nothing. Gateway or load balancer: rate, quota or priority limits, cheap but knowing little about the server. Server door: too many requests in flight or CPU too high gives a fast 503. Queue: a request that waited too long or whose deadline has passed is dropped before any work. Worker: if the client gave up, stop the rest of the work. A double arrow underneath runs from "earlier: cheaper to reject" to "later: more is known, but more work is already spent".](img/load-shedding-where-to-reject.svg)

*The places a request can be turned away. Earlier is cheaper; later knows more.*

- **Before the server.** A kernel firewall rule can cap connections
  and reject the excess far more cheaply than any server process. An
  [[api-gateway]] or [[load-balancing|load balancer]] can enforce rates and quotas. These
  layers are cheap but see little: they don't know how busy the server
  really is.
- **At the server's door.** The server knows its own load. A check
  before any real work starts ("too many requests in flight, reply
  503") is cheap and accurate.
- **In the queue.** A request that sat in the queue past its caller's
  deadline is already dead. Drop it when you dequeue it, before
  spending a worker on it.
- **In the middle of the work.** If the caller has gone, stop. That
  needs the caller's deadline to travel with the request (see
  [[deadline-propagation]]).

The earliest layer is the cheapest place to drop traffic, but it's
also the one that sees least, so it makes worse choices and leaves
fewer clues about what it dropped. Amazon's answer is to let the
server shed what it can, with good logging, and rely on the layers in
front only for floods too big for the server to reject by itself.

## Noticing overload: which signal

A shedder needs a signal that says "we're past capacity". The common
ones:

- **Requests in flight.** The simplest: count concurrent requests and
  reject above a limit. Picking the right limit by hand is the hard
  part, and a raw count of requests in flight doesn't always tell you
  whether the server is really overloaded. [[admission-control]] is about finding that
  limit automatically, from latency.
- **Utilization.** Google's servers compute a smoothed count of threads
  that are running or waiting for a CPU, and start rejecting once it
  goes above the number of CPUs the task has. The smoothing means a
  short burst from one big request doesn't trip it, but load that
  stays high does.
- **Time spent queueing.** Facebook adapted CoDel, an algorithm from
  the research on [[bufferbloat]] in network queues. If the queue
  hasn't been empty at any point in the last 100 ms, requests may only
  wait 5 ms in it; otherwise they may wait up to 100 ms. A brief burst
  can queue; a queue that never drains gets cut short. Facebook found
  these two values worked across many services without per-service
  tuning, which fixed queue lengths and fixed timeouts never did.
- **Deadlines.** If requests carry the caller's remaining time, the
  server can drop any whose time is already up, or nearly.

Whatever the signal, it should react to lasting overload and ignore a
short spike. A shedder that fires on every burst turns away requests
the server could have served. Amazon aims for zero of these false
positives, and treats regular ones as a sign of a tuning, scaling or
balancing problem.

## Which requests to drop

When some traffic has to go, it shouldn't be random.

**Keep the health checks.** A load balancer pings
each server to see if it's alive ([[health-checks]]). If an overloaded server drops those pings, the balancer
takes it out of service, and the fleet shrinks just when it needs to
grow. Health checks come first.

**Drop the least important work first.** Google tags every request
with one of four criticality levels, from `CRITICAL_PLUS` down to
`SHEDDABLE`. Capacity is planned for the two critical levels, batch
jobs default to sheddable, and an overloaded server rejects lower
levels sooner. The level is set close to the user, in the web
frontends, and copied onto every call made on that request's behalf,
so a database several calls down knows it's serving a batch job.

Netflix's API gateway does something similar. It sorts requests into
three buckets: non-critical (logs, background requests), degraded
experience (things like viewing history, which affect the experience
but not playback) and critical (anything that stops you pressing
play). It gives each request a priority from 1 to 100. Under overload
it raises a cut-off along a curve: at first only the lowest
priorities go, and only when things get very bad does it drop
everything. In a 2020 incident similar to an outage the year before,
this shed enough traffic to recover without stopping anyone watching.

**Finish what's started.** If a client needs two calls, `start()` then
`end()`, prefer `end()`: rejecting it wastes the `start()` already
done. The same goes for later pages of a paginated read, which should
beat new first pages.

**Serve the newest first under pressure.** Queues are usually served
oldest first. In a long queue, though, the oldest request's user has
probably given up already. Facebook's servers switch from FIFO to LIFO
once a queue starts to form. Paired with the short queue timeout
above, new requests get served fast and old ones time out cheaply.

## Stopping the rejections from coming back

A rejected client usually retries. If every client retries right away,
shedding just turns one request into several. Three things help.

**Retry somewhere else.** When only a few servers are overloaded, a
quick rejection plus an immediate retry is often the best outcome: the
retry most likely lands on a server with room, simply because there
are many servers to land on. Google treats this as the normal case. The
trouble starts when the whole fleet is overloaded, where retries only
add load (see [[retries-with-backoff]] and [[retry-budgets]]).

**Throttle at the client.** Google's clients track, over the last two
minutes, how many requests they sent and how many the backend
accepted. Once requests pass twice the accepts, the client starts
failing new requests locally with a probability that grows with the
gap:

```
reject probability = max(0, (requests − K × accepts) / (requests + 1)),  K = 2
```

Rejected requests then never reach the network, which matters when a
rejection costs the server almost as much as serving.

**Tell clients how to back off.** When Netflix's gateway sheds, it
tells devices how many retries they may make and how long to wait,
with more generous values for high-priority requests.

## Where it gets tricky

**Shedding can hide load from autoscaling.** If a service sheds at a
CPU level and also scales out at the same CPU level, the shedder holds
CPU at the line and the autoscaler never sees a reason to add servers.
Set autoscaling to act before shedding starts. More in
[[autoscaling]].

**Shedding can fool the load balancer.** Google's SRE workbook tells
the story of a made-up shop, Dressy. Its servers shed above a CPU
threshold, and its load balancer sent traffic where CPU per request
was lowest. Rejections are cheap, so the overloaded region looked the
most efficient, and the balancer sent it even more traffic. The fix is
to count an error as costing more than a full CPU, so a shedding
server looks overloaded.

**It isn't a rate limiter.** A [[rate-limiting|rate limiter]] asks
"has *this client* sent too much?". A load shedder asks "is *the
server* overloaded?", whoever sent the traffic. You usually want both, and rate limiting alone can't stop a failure that
has already started, because it doesn't look at the service's health.

**Queues in the wrong place undo it.** A load balancer that queues
requests while servers are busy hides how long a request has waited.
Amazon moved away from that: its older Classic Load Balancer queued
excess requests, its Application Load Balancer rejects them. Kernel
socket buffers are a queue too, and a server can pull a request out of
one after its client has already timed out. Assume there are queues
you haven't found yet.

**It needs testing past the limit.** Shedding code runs only under
overload, so it's easy to ship broken. The only way to know is to load
test well past the breaking point and check that goodput stays flat
(see [[load-testing]]).

**It isn't a plan for capacity.** Shedding protects a service from
overload it didn't plan for. If it fires every day, you need more
capacity or cheaper requests ([[capacity-planning]]).

## What this means when you build

- Put a cheap overload check at the server's door, before parsing
  bodies or taking locks, and answer 503 when it trips.
- Cap how long a request can wait in any queue, and drop requests whose
  deadline has passed before working on them.
- Give requests a priority, set near the user and passed along. Never
  shed health checks.
- Make rejections cheap: no stack traces, no heavy logging per
  rejection. Count them instead, by client and operation.
- Keep latency for successes separate from latency for rejections.
- Scale out before you shed, and tell your load balancer that errors
  aren't cheap work.
- Test it: overload a test environment far past capacity and plot
  goodput against offered load.

## Further reading

- [Using load shedding to avoid overload](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf), David Yanacek, Amazon Builders' Library, 2019. The best single account: cheap rejections, priorities, deadlines, queue time, shedding in layers, and the interaction with autoscaling.
- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google SRE book, 2016. Load shedding and graceful degradation as defences, and why rate limiting alone isn't enough.
- [Handling Overload](https://sre.google/sre-book/handling-overload/), Alejandro Forero Cuervo, Google SRE book, 2016. Criticality levels, the executor load average, and client-side adaptive throttling with its formula.
- [Fail at Scale](https://queue.acm.org/detail.cfm?id=2839461), Ben Maurer, ACM Queue, 2015. Facebook's CoDel-style queue timeout, adaptive LIFO and client-side limits on outstanding requests.
- [Keeping Netflix Reliable Using Prioritized Load Shedding](https://netflixtechblog.com/keeping-netflix-reliable-using-prioritized-load-shedding-6cc827b02f94), Manuel Correa, Arthur Gonigberg and Daniel West, Netflix, 2020. Priority buckets at an API gateway, a curve for the cut-off, and testing what's safe to shed.
- [The Site Reliability Workbook, chapter 11: Managing Load](https://sre.google/workbook/managing-load/), Cooper Bethea, Gráinne Sheerin, Jennifer Mace and Ruth King, Google, 2018. How load shedding, load balancing and autoscaling interact, including the case where shedding misled the balancer.

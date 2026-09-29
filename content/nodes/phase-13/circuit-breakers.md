---
id: circuit-breakers
title: Circuit breakers
depth: deep
phase: 13
note: >-
  Stop calling a dependency that's failing, and probe it before trusting
  it again.
needs: [timeouts]
leads_to: []
compare_with: [health-checks, retry-budgets, graceful-degradation, metastable-failures]
---

# Circuit breakers

A circuit breaker sits in front of the calls to one dependency and
watches how they go. When too many fail, it stops making the calls for
a while and fails them straight away; later it lets a few through to
test whether the dependency has recovered. It keeps your threads from
piling up behind something broken and takes load off a service that's
struggling, but used carelessly it turns a partial outage into a total
one.

## Waiting on something broken

Say your product page calls a recommendations service. One day that
service stops answering. It doesn't refuse connections, it just hangs.
Every page request now waits the full [[timeouts|timeout]] on its call
to recommendations, holding a thread and a connection the whole time.
With enough traffic, every thread is waiting, and your product page is
down too, although nothing in it is broken. That's how one failure
spreads to the services that call it, the start of a
[[cascading-failures|cascading failure]].

A timeout caps the cost of each call, but you pay it on every call. You
can shorten the timeout, but then calls that are only slow fail too.
[[retries-with-backoff|Retries]] make it worse: each failed call is
sent again, to a service that already can't cope.

A circuit breaker adds memory. After enough failures, it stops trying,
so each call fails at once instead of after a timeout, and the
broken service stops getting traffic it can't serve. The name comes
from the electrical breaker in a building, which cuts the power when
something's wrong. The pattern was made popular by Michael Nygard's book
*Release It!*.

## Three states

A breaker is a small state machine:

![State diagram with three states. Closed: calls go through and their outcomes are counted. When failures pass the threshold, once enough calls have been counted, it moves to Open: calls fail at once and nothing is sent. When the wait time passes, it moves to Half-open: a few trial calls go through and the rest fail at once. If the trial calls succeed it goes back to Closed; if a trial call fails it goes back to Open.](img/circuit-breakers-states.svg)

*The three states of a circuit breaker. Adapted from Martin Fowler, "CircuitBreaker" (2014), and the Azure Architecture Center's Circuit Breaker pattern.*

- **Closed** is normal. Calls go through, and the breaker records
  whether each one worked.
- **Open** means the dependency is presumed broken. Calls fail at once
  without being sent. A timer starts.
- **Half-open** comes when the timer runs out. A limited number of
  trial calls go through. If they succeed, the breaker closes. If one
  fails, it opens again and the timer restarts.

Half-open exists because a service coming back up is fragile. If every
waiting caller rushed in the moment the breaker closed, the flood could
knock it over again. A few trial calls test it gently.

The simplest version, the one in Fowler's example, counts failures in
a row: five failures and it opens, and any success resets the count.
Real libraries do more, and the details are where breakers go right or
wrong.

## Deciding when to trip

**Rate over a window, not a count.** Libraries look at the share of
recent calls that failed. resilience4j keeps a sliding window of either
the last N calls or the last N seconds. Hystrix, Netflix's library,
uses a rolling time window, 10 seconds in its docs' example. Both open
at 50% failures by default.

**A minimum number of calls.** A failure rate from three calls means
little. Hystrix won't trip until it has seen 20 requests in the window,
so 19 failures out of 19 don't open it. resilience4j's default minimum
is 100 calls. Below the minimum, nothing trips.

**Which errors count.** Not every error means the dependency is broken.
A "not found" or a rejected input is the service doing its job, and
shouldn't move a breaker. resilience4j counts every exception by
default, so you have to tell it which ones to record and which to
ignore. You may also want different thresholds for different errors,
say more timeouts than outright "unavailable" errors before tripping.

**Slow calls.** resilience4j can also open on the share of calls that
take longer than a set duration. That lets it back off from a service
that's getting slow before it stops answering altogether.

**Hints from the server.** A response can carry enough to trip the
breaker at once: an overloaded service answering 429 or 503 with "try
again in a few minutes" has already said what the breaker needs to know.

## Coming back

The wait in the open state is a tradeoff. Hystrix's default is 5
seconds, resilience4j's 60. Too short and the breaker flaps, opening
and half-opening over and over. Too long and callers keep failing after
the dependency has recovered. One answer is to grow the wait each time
the breaker reopens, from seconds to minutes.

The trial itself varies. Fowler's simple version makes a single trial
call; resilience4j lets 10 through by default and decides on their
failure rate. Instead of a timer, a breaker can also ping the service, or a
health endpoint it exposes, and half-open only when that answers. In
resilience4j the move to half-open happens on the next call after the
wait, not on a timer, unless you turn on automatic transitions.

## Breakers per what

A breaker has to decide what "the dependency" is: a whole service, or
one copy of it. Finagle, Twitter's RPC library, goes fine-grained: its
breakers are per endpoint, one per backend host, and when one trips,
the load balancer sends traffic to the other hosts instead of failing
the call.

Finagle has two. Fail Fast watches connections: when one fails, it
marks the host down and reconnects in the background with backoff.
It's switched off when there's only one host, since then there's
nowhere else to send the traffic. Failure Accrual watches requests: by
default, 5 failures in a row or a success rate under 80% mark a host
dead for a jittered 5 to 300 seconds, and it comes back with one probe
request. This per-host kind of breaker does a job close to a load
balancer's [[health-checks|health checks]]: it takes a bad backend out
of rotation.

Watch the naming, though. What Envoy calls "circuit breaking" is a set
of fixed limits per upstream cluster: at most so many connections,
pending requests, active requests and retries, with modest defaults
such as 1024 connections per cluster. Crossing a limit fails the
request at once. That protects Envoy from a slow upstream by capping
what it holds, which is a [[bulkheads|bulkhead]], not a failure-rate
state machine.

## What the caller does when it's open

A breaker only turns a slow failure into a fast one. The caller still
has to decide what to do:

- **Return an error** that says what happened, so callers don't treat
  it like any other failure. If you retry, stop when the breaker says
  the fault isn't passing.
- **Fall back.** Show stale data from a cache, return a default, or
  put the work on a queue to finish later, the way a card payment could
  be authorised once the service is back. This is
  [[graceful-degradation]]: the product page renders without
  recommendations.
- **Tell people.** Log every state change, alert when a breaker opens,
  and give operators a way to force it open or closed. resilience4j has
  states for exactly that: FORCED_OPEN, DISABLED, and METRICS_ONLY,
  which records everything but never opens.

## Where it gets tricky

**Partial failures.** Picture a store split into shards by key, with a
router in front. A popular signup floods the shard for keys A to H,
while the other shards are fine:

![A client with one circuit breaker for a whole store calls a router, which sends requests to three shards: keys A–H, which is overloaded, and keys I–R and S–Z, which are fine. If the breaker trips, calls for keys I–Z fail too even though their shards are fine; if it doesn't trip, the overloaded A–H shard gets no protection.](img/circuit-breakers-shards.svg)

*One breaker can't describe a store that's partly down. Adapted from Marc Brooker, "Will circuit breakers solve my problems?" (2022).*

A breaker for the whole store has no good move. If it trips, calls for
I to Z fail although their shards are healthy. If it doesn't, it
protects nothing. The same goes for a service built as
[[cell-based-architecture|cells]]: a breaker that trips on one bad cell
makes the whole service look down, undoing the point of cells. The
ways out all cost something: breakers per shard or per customer (so
the client must know how the service is split), a server that says
which part is overloaded, or statistical guessing. Systems are built to
fail partially; a breaker that isn't aware of the parts turns a partial
failure into a complete one.

**All-or-nothing behaviour.** A breaker gives the system a second mode,
and that mode only shows up during outages. Some teams limit retries with a [[retry-budgets|retry budget]]
instead, which has no on/off switch.

**Every client decides alone.** Breakers aren't coordinated. Each
client, or each Envoy, keeps its own counts. A client that makes few
calls has a noisy view, and trips too early or too late. In one
simulation, a breaker that only stopped retries tripped at about half
the failure rate it was set for, because 100 clients each judged the
failure rate from their own small sample.

**Long timeouts blunt it.** A breaker needs failures to count. If each
failure takes 30 seconds to arrive, threads fill up long before the
breaker has seen enough to trip. A breaker is no substitute for a
sensible timeout; one variant trips on a full thread pool instead of a
failure count.

**A breaker doesn't cap concurrency.** While it's closed, any number of
calls can be in flight at once. Limiting that is a bulkhead's job, and
libraries ship the two separately so you can combine them.

**What's changed.** Hystrix, which made breakers common in Java, is
in maintenance mode; its final release is 1.5.18. Netflix moved
to limits that adapt to measured performance, such as adaptive
concurrency limits (see [[admission-control]]), and recommends
resilience4j for new code. Breaking has also moved out of application
code into proxies and service meshes, which is why a pattern write-up
now warns that a breaker in your code may duplicate what the platform
already does.

## What this means when you build

- Set real timeouts first. A breaker is a second line of defence, not
  a replacement.
- Trip on a failure rate over a window, with a minimum number of calls,
  and count only errors that mean the dependency is unhealthy.
- Decide what the caller does when the breaker is open, and test that
  path on purpose.
- Scope breakers to what fails together: a host, a shard, a customer.
  One breaker over a sharded or cell-based service can make a partial
  outage total.
- Log state changes and give operators a manual switch.
- Consider a retry budget before a breaker if your real problem is
  retries.

## Further reading

- [CircuitBreaker](https://martinfowler.com/bliki/CircuitBreaker.html), Martin Fowler, 2014. The pattern in a few pages, with a small implementation that grows from two states to three.
- [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker), Microsoft Azure Architecture Center. The states and counters, and a long list of design questions: which errors count, recovery timing, shards, manual override.
- [Configuration](https://github.com/Netflix/Hystrix/wiki/Configuration), Netflix Hystrix wiki. Hystrix's defaults: 20 requests, 50% errors, a 5-second sleep window.
- [Hystrix README](https://github.com/Netflix/Hystrix), Netflix. Why Hystrix is in maintenance mode and what Netflix moved to.
- [CircuitBreaker](https://resilience4j.readme.io/docs/circuitbreaker), resilience4j docs. A current library: sliding windows, slow-call tripping, special states, and every default.
- [Clients](https://twitter.github.io/finagle/guide/Clients.html), Finagle user guide, 24.2.0. Per-endpoint breakers that steer the load balancer, and their defaults.
- [Circuit breaking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking), Envoy docs, 1.40.0-dev. What a proxy means by the same name: fixed limits per cluster.
- [Will circuit breakers solve my problems?](https://brooker.co.za/blog/2022/02/16/circuit-breakers.html), Marc Brooker, 2022. The case against client-side breakers in sharded and cell-based systems.
- [Fixing retries with token buckets and circuit breakers](https://brooker.co.za/blog/2022/02/28/retries.html), Marc Brooker, 2022. A simulation of a retry-only breaker against a token bucket.

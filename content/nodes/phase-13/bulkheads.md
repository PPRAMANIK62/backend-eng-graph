---
id: bulkheads
title: Bulkheads
depth: short
phase: 13
note: >-
  Separate pools per dependency, so one slow one can't take everything.
needs: [thread-pool, connection-pooling]
leads_to: []
compare_with: [shuffle-sharding, cell-based-architecture, noisy-neighbor]
---

# Bulkheads

A bulkhead gives each dependency its own limited share of your
resources, such as threads, connections or concurrent calls, so a
dependency that hangs can use up only its own share. The name comes
from the walls that split a ship's hull into sections: if the hull is
breached, one section floods and the ship stays afloat.

## One slow dependency, every thread

Say your service calls three others: payments, search and profile. All
outgoing calls share one [[thread-pool|thread pool]] or one
[[connection-pooling|connection pool]]. Then payments starts hanging.
Every call to it holds a thread until its timeout fires, and new
payment calls keep arriving. Soon every thread in the pool is waiting
on payments. Search and profile are healthy, but calls to them can't
get a thread, so they fail too. One broken dependency has taken out all
three.

![Two panels. Left, one shared pool: all 8 threads in the pool are waiting on the payments service, which hangs, so calls to the healthy search and profile services get no thread. Right, a pool per dependency: the payments pool's 3 threads are all stuck, so new payments calls fail fast, while the search and profile pools each have one thread serving a request and two free.](img/bulkheads-pools.svg)

*A shared pool lets one hung dependency take every thread; separate pools keep the damage inside one.*

The fix is to split the pool. Give each dependency its own limit.
When payments hangs, its pool fills and further payment calls are
rejected at once, while search and profile carry on with their own
threads. When payments recovers, its pool drains and everything is back
to normal.

## Threads or a counter

There are two common ways to build the wall.

**A thread pool per dependency.** This is how Hystrix, Netflix's
library, isolates dependencies. Each call to a dependency runs on a thread from that
dependency's pool, and the calling thread waits for the result with a
timeout. Because the caller is on a different thread, it can walk away
from a call that's taking too long, even if the client library
underneath never gives up. Netflix chose this because its services
called dozens of other services through client libraries owned by other
teams, which changed often and hid their network behaviour. Its API
servers ran more than 40 such pools, of 5 to 20 threads each, most set
to 10.

The price is a handoff per call: queueing, scheduling and a
[[context-switch]]. Netflix measured it for one command on a
production server: nothing at the median, 3 ms at the 90th percentile
and 9 ms at the 99th.

**A counter (semaphore).** The call runs on the caller's own thread,
and a counter limits how many can be in flight at once. There's no
handoff to another thread, but the caller can't walk away: if the dependency hangs, the
callers' threads stay blocked until the network timeout fires, and only
new calls are turned away. resilience4j, the Java library Netflix now
recommends, defaults to 25 concurrent calls, and by default a call that
finds the bulkhead full is rejected at once instead of waiting.
resilience4j also offers a fixed thread pool with a
[[bounded-queues|bounded queue]], 100 slots by default.

Proxies do the same thing outside your code. Envoy caps connections,
pending requests and active requests to each upstream cluster, with
modest defaults such as 1024 connections per cluster, and fails
requests over the cap at once. Envoy calls
this circuit breaking, but it's a bulkhead: a limit on how much one
upstream can hold, not a switch that trips on errors.

## Where it gets tricky

**Sizing.** Too small and a healthy dependency's normal traffic gets
rejected. Too large and a hung dependency can still take most of your
threads. Size each one the way you'd size any
[[thread-pool]], starting from [[littles-law|Little's law]], and watch
how often each rejects.

**Reserved capacity sits idle.** A thread kept for payments can't serve
search, even when payments is quiet. You trade some efficiency for
isolation, and a project that can't afford that may skip the pattern.

**Timeouts still matter.** A separate pool limits the damage, but the
code inside it still needs its own timeouts, or the pool fills with
calls that never end.

**Bulkheads and breakers do different jobs.** A
[[circuit-breakers|circuit breaker]] stops calls when too many fail but
doesn't limit how many run at once; a bulkhead limits how many run at
once but doesn't notice failures. Pattern guides recommend combining
them.

**The same idea at a bigger scale.** The wall can go around a whole
set of servers instead of a pool of threads. A service can split its
instances into groups by consumer, so one noisy client overloads only
its own group, or give high-priority consumers their own pool. Taken
all the way, with full copies of a service, that's
[[cell-based-architecture]]; some pattern guides use the two names for
the same thing.

**Fixed limits are guesses.** Netflix moved away from hand-set pool
sizes toward limits that adapt to measured performance, such as the
adaptive concurrency limits in [[admission-control]].

## What this means when you build

- Give each downstream dependency its own limit on concurrent calls or
  connections.
- Reject at once when a limit is full, and have a fallback ready.
- Use a thread per call when you don't trust a client library to time
  out; a counter when you do and the calls are cheap.
- Size limits from traffic and latency, and watch rejections per pool.
- Keep timeouts inside every bulkhead.

## Further reading

- [Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead), Microsoft Azure Architecture Center. The pattern on both sides: a pool per dependency in the client, instances per consumer group in the service.
- [How it Works](https://github.com/Netflix/Hystrix/wiki/How-it-Works), Netflix Hystrix wiki. Why Netflix isolated each dependency in its own thread pool, what it cost, and when a semaphore is enough.
- [Hystrix README](https://github.com/Netflix/Hystrix), Netflix. Why Netflix moved from fixed pools to adaptive limits and recommends resilience4j.
- [Bulkhead](https://resilience4j.readme.io/docs/bulkhead), resilience4j docs. A semaphore bulkhead and a thread-pool bulkhead with their defaults.
- [Circuit breaking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking), Envoy docs, 1.40.0-dev. Per-cluster limits in a proxy, a bulkhead under another name.

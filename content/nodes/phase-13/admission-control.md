---
id: admission-control
title: Admission control
depth: short
phase: 13
note: >-
  Letting in only as much work as the server can finish, often with a
  concurrency limit that adapts to latency.
needs: [load-shedding, littles-law]
leads_to: []
compare_with: [congestion-control]
---

# Admission control

Admission control decides at the door how much work a server takes
on: it lets a request in only if the server can finish it, and turns
the rest away at once. The usual form is a cap on requests in flight.
The hard part is the number, and the modern answer is to let the
server work it out for itself from its own latency, the way
[[tcp|TCP]] works out how much data the network can hold.

## A limit on requests in flight

A server can only work on so many requests at once before they start
waiting for each other. [[littles-law|Little's law]] ties the numbers
together: at steady state, the requests in flight equal the arrival
rate times the time each one takes. Anything above what the server can
really run at once has to wait in a queue or be rejected. A little
queueing is fine, since it smooths out uneven arrivals. An unlimited
queue isn't: latency grows until every request times out, and memory
grows until the process dies.

So you cap concurrency: keep a counter of requests in flight, and when
a new one arrives with the counter at the limit, reject it immediately
(Envoy answers with a 503). That's [[load-shedding]] with a
single, simple signal.

The trouble is the limit itself. Set it too low and you reject traffic
the server could have handled. Set it too high and latency climbs before
the limit ever kicks in. Netflix used to find each service's
limit by careful performance testing and profiling, and the number
went stale as soon as the service scaled, a code push changed its
latency, or part of the system went down.

## Let latency find the limit

Adaptive concurrency limits borrow from TCP [[congestion-control]]. A
TCP sender doesn't know how much the network can carry, so it keeps
probing: it sends a bit more while things look fine, and backs off when
they don't. Replace "packets in flight" with "requests in flight" and
"packet loss or rising delay" with "rising latency", and you have a
server that finds its own limit.

Netflix's version, and the gradient controller in the Envoy proxy,
work like this:

1. Measure the latency the server has with no queue, `minRTT`. Envoy
   does it by briefly pinning the limit very low (3 by default) and
   timing requests.
2. Keep sampling current latency, `sampleRTT`.
3. Compute a gradient: `minRTT / sampleRTT`. Envoy adds a small buffer
   to `minRTT` so normal jitter doesn't count. A value near 1 means no
   queue has formed; below 1 means requests are waiting.
4. Update the limit: `new limit = old limit × gradient + headroom`,
   where headroom is the square root of the current limit.

When latency stays at its floor, the gradient is about 1 and the
headroom slowly raises the limit. When a queue forms, latency rises,
the gradient drops and the limit shrinks. The square root was chosen
because it's large next to a small limit, so the limit grows fast from
low values, and small next to a large one, which keeps it steady.

Nobody configures a number. If the server gets slower because a
dependency is slow, the limit falls on its own; after an upgrade to
faster machines, it rises. Over-limit requests are rejected in
under a millisecond, so the server stays responsive while autoscaling
adds capacity behind it.

## Where it gets tricky

**Each server decides alone.** The limits aren't coordinated, so one
busy server may reject a request while its neighbour has room. With
client-side load balancing that's cheap to fix: Netflix found a single
retry almost always reached a server with spare capacity.

**Measuring the floor costs something.** While Envoy pins the limit
low to measure `minRTT`, more requests get 503s. It adds random jitter
to when each host measures, so they don't all do it at once, and
recommends retrying on a different host.

**The limiter has to see everything.** It only works if every request
to the protected service passes through it. Traffic that goes around
it adds load the limiter can't account for.

**It's the same idea as congestion control, not the same problem.**
TCP protects the network path from the sender. Admission control
protects a server from its callers. The feedback loop is the same;
what's being protected is different.

## What this means when you build

- Cap requests in flight in every service; reject over the cap
  immediately rather than queueing.
- Prefer an adaptive limit (Netflix's concurrency-limits library,
  Envoy's adaptive concurrency filter) to a hand-tuned constant.
- Let clients retry a rejected request once, on a different server.
- Watch the limit over time: a limit that keeps falling is telling you
  something got slower.

## Further reading

- [Performance Under Load: Adaptive Concurrency Limits @ Netflix](https://netflixtechblog.medium.com/performance-under-load-3e6fa9a60581), Eran Landau, William Thurston and Tim Bozarth, Netflix, 2018. Why fixed limits go stale, and the gradient algorithm borrowed from TCP.
- [Adaptive Concurrency](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/adaptive_concurrency_filter), Envoy docs (1.40.0-dev). The same controller in a proxy: the formulas, how `minRTT` is measured, and the filter's limits.

---
id: capacity-planning
title: Capacity planning
depth: short
phase: 9
note: >-
  Working out how much hardware a load needs, with headroom.
needs: [queueing-theory, load-testing]
leads_to: [autoscaling]
compare_with: [back-of-envelope-estimation, cascading-failures, load-shedding]
---

# Capacity planning

Capacity planning is making sure enough hardware is in place, before
it's needed, to serve the demand you expect at the latency you promise,
with enough spare to survive losing some of it. It's four steps:
forecast the demand, measure what one unit of hardware can really
serve, add headroom, and keep redoing it as things change.

## Forecast past the lead time

Demand grows in two ways. Organic growth is more people using the
product more. Inorganic growth comes from events: a launch, a
marketing campaign, a big customer moving in. A forecast needs both,
and it has to reach further ahead than the time it takes to get new
capacity. If servers take three months to arrive, a forecast for next
month is useless.

Many cascading failures start here. There's no bad deploy and no
failure; usage just grew and nobody added capacity to match.

## Measure what one unit serves

"We need 20 more servers" only means something if you know what one
server handles. The way to find out is a [[load-testing|load test]]
that pushes each component until it breaks. Each component has its own
breaking point, so test them separately; you don't know in advance
which one hits the wall first.

Two traps:

- **Requests per second is a shaky unit.** Requests don't all cost the
  same, and the mix drifts: a new client, a code change, a different
  time of day. Planning directly in resources, cores and memory, holds
  up better. For many services CPU alone works as the signal, since
  with garbage collection memory pressure shows up as extra CPU.
- **Capacity is defined at a latency.** A service that still answers,
  but slowly, has lost capacity. So the question isn't "how many
  requests before it falls over?" but "how many before it misses its
  latency target?", and [[queueing-theory]] says that point comes well
  before 100% busy.

## Add headroom for failures

Capacity has to cover the peak even while part of it is missing, for
maintenance or after a failure. One target is N + 2: enough units
for the peak, plus two spare.

Take the worked example: each cluster breaks at 5,000 requests a
second, load spreads evenly, and the peak is 19,000. Four clusters
give 20,000, just enough for the peak. N + 2 means about six.

![Six boxes, each a cluster that breaks at 5,000 QPS, under the heading "Peak load 19,000 QPS". Clusters 1 to 4 are bracketed as "N = 4: 20,000 QPS, just enough for the peak"; clusters 5 and 6 are marked "+2 spare". A note says that if any two clusters are lost, the four left still carry the peak.](img/capacity-planning-n-plus-2.svg)

*Sizing for N + 2. Adapted from Mike Ulrich, "Addressing Cascading Failures", in Google's Site Reliability Engineering (2016).*

Notice the four clusters in that example run at their breaking point
at peak. If your latency target needs them at, say, 70% instead, N
grows before you add the two spares.

## Keep redoing it

A plan is out of date as soon as something moves: a slower code path
raises the cost per request, users upload bigger files, traffic shifts
between clusters. Rerun the load tests
regularly and check the forecast against what actually happened.

## Where it gets tricky

**Planning doesn't protect you.** It lowers the chance of overload; it
doesn't stop one. Lose a big chunk of infrastructure, get a traffic
surprise or a load-balancing bug, and some servers will get more than
was planned. They still need to reject work gracefully
([[load-shedding]]) instead of failing in a chain
([[cascading-failures]]).

**[[autoscaling|Autoscaling]] doesn't replace it.** Growing the number
of copies on demand helps, but it only works if the capacity to grow
into exists, so you still have to plan.

**Borrowed spare capacity isn't yours.** If your service only keeps up
because it uses idle CPU that other jobs on the machine aren't using
right now, it will fall behind the moment they start using it. Load
test within the resources you're actually guaranteed.

**Adding capacity is itself a change.** New servers or a new location
mean new configuration, load balancer changes and validation, which
makes provisioning riskier than just shifting traffic around.

## What this means when you build

- Forecast organic and event-driven demand, far enough ahead to cover
  how long capacity takes to arrive.
- Load test each component to its breaking point, and record the load
  where it misses its latency target, not just where it falls over.
- Plan in cores and memory rather than requests per second.
- Size for the peak with N + 2 spare, at a utilization your latency
  target allows.
- Redo it after big code changes, and whenever the forecast and
  reality drift apart.
- For quick sizing in a design discussion, rough math is enough (see
  [[back-of-envelope-estimation]]); this page is about the numbers you
  buy hardware with.

## Further reading

- [Site Reliability Engineering, chapter 1: Introduction](https://sre.google/sre-book/introduction/), Benjamin Treynor Sloss, Google, 2016. What capacity planning must include: organic and inorganic forecasts past the lead time, and regular load tests.
- [Site Reliability Engineering, chapter 22: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google, 2016. The N + 2 worked example, load testing to the breaking point, and why planning isn't enough.
- [Site Reliability Engineering, chapter 21: Handling Overload](https://sre.google/sre-book/handling-overload/), Alejandro Forero Cuervo, Google, 2016. Why requests per second is a poor unit of capacity, and planning in CPU instead.

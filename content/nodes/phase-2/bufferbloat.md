---
id: bufferbloat
title: Bufferbloat
depth: short
phase: 2
note: >-
  Oversized buffers in routers and modems that fill up and add seconds
  of delay, and the queue management that fixes it.
needs: [network-latency, congestion-control]
leads_to: []
compare_with: []
---

# Bufferbloat

Bufferbloat is the delay you get when a router or modem has far more
buffer than it needs and TCP keeps that buffer full. Every packet then
waits behind the whole buffer, so round trips can grow from
milliseconds to seconds while the link is busy. If your API feels fine
on an idle connection and slow while an upload is running, this is a
likely cause.

## Where the queue builds

Picture a home connection: a fast Ethernet link feeds a much slower
DSL uplink. The uplink is the bottleneck, and packets that arrive
faster than it can send wait in the buffer in front of it. That wait
is the queuing delay from [[network-latency]].

A buffer that soaks up a burst and empties within a round trip is
useful. The problem is a queue that never empties. If a connection
keeps more data in flight than the path holds (its
[[bandwidth-delay-product]]), the extra sits in the buffer for as long
as the connection runs, adding delay and nothing else.

## Why TCP fills the buffer

Loss-based TCP [[congestion-control]] (Reno, CUBIC) raises its rate
until a packet is lost, then backs off. The router's
default way of managing its buffer is tail drop: accept every packet
until the buffer is full, then drop new arrivals. Put the two together
and the only signal TCP gets comes when the buffer is already full. So
the sender runs with the buffer full, all the time.

When memory was expensive, buffers were only a little bigger than the
path's BDP, so a full buffer cost little extra delay. Memory got cheap,
vendors and operators asked for as much buffer as possible to avoid
drops, and buffers grew far past the BDP. Full buffers that size push
round trips from milliseconds to seconds. It's worst at the consumer
edge, where home connections meet the internet.

Tail drop has two more costs. A burst that hits a nearly full buffer
loses several packets at once. And a new flow, say a DNS lookup, waits
behind the bulk flow that filled the buffer.

![Two rows, each a sender, a router buffer and a slow link. With tail drop the buffer is full of a bulk upload and a small request waits at the back. With active queue management one packet is dropped early, the queue stays short and the request goes through.](img/bufferbloat-tail-drop-vs-aqm.svg)

*A full tail-drop buffer against a managed one. Our own drawing.*

## The fix: drop early, on purpose

The fix is active queue management (AQM): the router drops or
ECN-marks a packet before the buffer is full, so TCP backs off while
the queue is still short. RFC 7567 (2015) says deployments should use
AQM, and makes a point that sounds backwards: keeping queues normally small gives higher throughput as
well as lower delay, because there's room left to absorb bursts. Buffer
size should be set for the largest burst you expect, not for the queue
you want to keep.

An older AQM, RED, watched queue length and needed careful tuning,
so most operators left it off. Newer ones watch time instead:

- **CoDel** (RFC 8289, 2018) timestamps each packet and measures how
  long it sat in the buffer. If that wait stays above a target for a
  whole interval, it starts dropping. The defaults, 5 ms target and
  100 ms interval, were chosen for ordinary internet round trips.
- **FQ-CoDel** (RFC 8290, 2018) hashes packets by their 5-tuple into
  separate queues, 1024 by default, serves them in turn, puts flows
  that aren't building a queue first, and runs CoDel on each, so a DNS
  query doesn't wait behind an upload. It has been in Linux
  as the `fq_codel` qdisc since 3.5 (2012), and some distributions
  made it their default queueing discipline.
- **PIE** (RFC 8033, 2017) estimates queuing delay and drops arriving
  packets at random, with a probability it adjusts to hold the delay
  near 15 ms. It needs no timestamps, so it's cheap in hardware.
  DOCSIS 3.1 (2013) required a PIE variant in cable
  modems.

## Where BBR fits

The other angle is the sender: stop filling buffers in the first
place. BBR measures the path's bandwidth and minimum round trip and
aims for about one BDP in flight, leaving the bottleneck queue near
empty. It sends at a steady rate with [[pacing]] instead of in
bursts.

That only helps BBR's own traffic. Where a deep buffer has no AQM,
loss-based flows sharing it still fill it, and the BBR paper found they
take more than their share doing so. The network still needs AQM.

## Where it gets tricky

**Bigger buffers feel safer.** They trade loss you can see for delay
you can't, and hide the loss signal TCP relies on.

**Which algorithm isn't settled.** CoDel, FQ-CoDel and PIE are all
Experimental RFCs. Only the advice to use some AQM is a Best Current
Practice.

**How much delay it explains depends on where you measure.** From
someone's home connection, full edge buffers are a prime suspect. On
well-connected paths, long routes and protocol round trips explain
more of it. [[network-latency]] covers that disagreement.

## What this means when you build

- Test latency while the link is busy, not only on an idle one. A
  ping on a quiet line hides bufferbloat.
- On Linux boxes that route traffic, check which queueing discipline
  (qdisc) each interface runs. `fq_codel` is a sensible choice for a
  router; for a host sending mostly its own TCP traffic, see [[pacing]]
  for `fq`.
- BBR lowers the queue your own flows create; it doesn't fix a
  bloated buffer shared with others.

## Further reading

- [RFC 7567: IETF Recommendations Regarding Active Queue Management](https://www.rfc-editor.org/rfc/rfc7567), F. Baker and G. Fairhurst (eds.), 2015. Why tail drop keeps queues full and what AQM fixes.
- [RFC 8289: Controlled Delay Active Queue Management](https://www.rfc-editor.org/rfc/rfc8289), K. Nichols, V. Jacobson et al., 2018. Good queue vs bad queue, and CoDel.
- [RFC 8290: The Flow Queue CoDel Packet Scheduler and Active Queue Management Algorithm](https://www.rfc-editor.org/rfc/rfc8290), T. Hoeiland-Joergensen et al., 2018. FQ-CoDel as it runs in Linux.
- [RFC 8033: Proportional Integral Controller Enhanced (PIE)](https://www.rfc-editor.org/rfc/rfc8033), R. Pan et al., 2017. A cheap delay-based AQM.
- [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Neal Cardwell et al., ACM Queue, 2016. Why loss-based control fills buffers.

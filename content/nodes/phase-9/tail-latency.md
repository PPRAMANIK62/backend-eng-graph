---
id: tail-latency
title: Tail latency
depth: deep
phase: 9
note: >-
  Why the slowest 1% matter most at scale, how fan-out multiplies them,
  and hedged requests.
needs: [latency-percentiles, queueing-theory]
leads_to: [hedged-requests]
compare_with: [trace-sampling]
---

# Tail latency

Tail latency is the slow end of the latency distribution: the p99, the
p99.9, the requests that take ten or a hundred times longer than
usual. One server's tail looks like a rounding error. But a request
that fans out to many servers, or passes through a chain of them, is
only as fast as the slowest one it touches, so at scale the rare slow
case becomes the common one. The fixes are less about removing every
hiccup and more about building systems that route around them.

## One slow server in a hundred, and a request that asks all of them

Start with a server that usually answers in 10 ms but whose
[[latency-percentiles|p99]] is one second. If each user request goes to
one such server, 1 user request in 100 is slow. That's the number you
see on the server's dashboard.

Now make the user request fan out: a search query that asks 100 index
servers in parallel and waits for all of them. The request is slow if
any one of the 100 is slow. Each is fast with probability 0.99, so all
100 are fast with probability 0.99^100, about 0.37. That leaves 63% of
user requests taking over a second. Nothing about any single server
changed.

![A chart of the chance a user request takes over one second, against the number of servers it fans out to, from 1 to 2,000. Three curves: servers slow 1 time in 100, 1 in 1,000 and 1 in 10,000. The 1-in-100 curve passes 63% at 100 servers and is close to certain soon after. The 1-in-10,000 curve reaches about 18% at 2,000 servers.](img/tail-latency-fan-out.svg)

*How fan-out turns a rare slow server into a common slow request. Adapted from Jeffrey Dean and Luiz André Barroso, "The Tail at Scale" (CACM, 2013).*

Even very rare slowness adds up. If each server is slow only once in
10,000 requests, a request that touches 2,000 of them is still slow
almost one time in five.

Real systems behave like this. In one Google service where a root
server fans a request out through intermediate servers to many leaves,
the p99 for a single leaf, measured at the root, was 10 ms. The p99 for
all leaves to finish was 140 ms. Waiting for just 95% of the leaves
took 70 ms at the p99, so the slowest 5% of leaves cost half the total.

Serial chains have the same problem in a different shape. When service
A calls B, which calls C, the latencies add, and every hop gets a
chance to be slow. In a simulation of services that take about 10 ms
99% of the time and about 100 ms 1% of the time, that 1% raised the
variance of a long chain's total by a factor of 25 over a world with no
slow mode.

## Where the slow responses come from

Slow responses usually aren't caused by the request itself. They come
from whatever else the machine is doing at that moment:

- **Shared resources.** Other programs on the same machine compete for
  CPU cores, [[cpu-cache|caches]], memory bandwidth and network. Other
  machines compete for switches and shared filesystems.
- **Background work.** Daemons that barely use the CPU on average can
  still take it for milliseconds when they run. Log
  [[compaction]] in storage engines and [[garbage-collection|garbage
  collection]] in managed languages cause periodic spikes.
- **Queueing.** Every layer of queues, in servers and in switches,
  amplifies the variation. [[queueing-theory|Queueing theory]] predicts
  that the tail gets worse as utilization rises and better as more
  workers share one queue.
- **Hardware.** CPUs run above their power budget for a while, then
  throttle. Power-saving states take time to wake from. An SSD's
  internal [[ssd-internals|garbage collection]] can make reads 100 times
  slower with only a modest amount of writing going on.

A study of three Linux servers (a null RPC server, Memcached and Nginx)
found their tails were much worse than a queueing model predicted, and
traced the extra to background processes, a [[cpu-scheduler|scheduler]] that didn't
serve requests in arrival order, interrupts handled on the wrong cores,
CPU power saving and NUMA memory placement. After fixing each one,
Memcached at 80% utilization on four cores had a median of 11 µs and a
p99.9 of 32 µs. A naive single-core setup at the same utilization had a
median of 100 µs and a p99.9 of 5 ms. First-in-first-out queueing gave
the best tail, and CPU power saving hurt the tail most when the server
was lightly loaded.

## Making each server less variable

Some variability can be engineered out:

- **Keep low-level queues short.** If the OS disk queue holds only a
  few requests, the server's own priority queue decides the order, and
  a user-facing read doesn't wait behind a batch job's backlog.
- **Break big requests into slices.** A few very expensive queries
  shouldn't hold up many cheap ones. That's
  [[head-of-line-blocking]] inside a server.
- **Schedule background work together.** For fan-out services it can
  help to run background tasks on every machine at the same moment.
  Then only requests during that brief window are slow. Spread out,
  some machine is always busy, and every fan-out request hits it.

[[caching|Caching]] doesn't fix the tail, unless the whole working set
fits. A miss still goes to the slow path.

But in a large, shared system you can't remove all of it. Google's
conclusion was to accept the hiccups and build around them, the way
fault-tolerant systems accept that machines fail.

## Hedged requests: ask twice, keep the first answer

If the slowness comes from interference on one machine, not from the
request, then the same request sent to another replica will probably be
fast. A [[hedged-requests|hedged request]] waits about as long as the
p95, then sends a copy to a second replica and takes whichever answer
comes first. Only about 5% of requests get a copy, and those are the
ones likely stuck in the tail. In a Google test reading 1,000 keys
across 100 BigTable servers, hedging after 10 ms cut the p99.9 from
1,800 ms to 74 ms while sending 2% more requests.

## Steering away from slow machines

Over longer time scales, from seconds to minutes, you can move load
instead of duplicating it:

- **Many small partitions.** With about 20 partitions per machine, a
  balancer can shed load from a slow machine in 5% steps by moving one
  partition. See [[partitioning]].
- **Extra copies of hot items.** Detect items likely to cause
  [[hot-spots]] and replicate them more widely.
- **Probation.** Stop sending to a machine whose latency has gone bad,
  keep probing it in the background, and bring it back when it
  recovers. Removing capacity under high load can actually improve
  latency.
- **Good enough.** A search that has heard from most of its leaves can
  answer without the last few, and skip optional parts like ads if
  they're late.

## Where it gets tricky

**The 63% assumes independent slowness.** The math treats each server
as slow at random. Correlated causes (a shared switch, a garbage
collection that hits every server at once, a bad deploy) break both the
arithmetic and the hedging that relies on it.

**Which number to watch is disputed.** One view: watch high percentiles
and end-to-end latency for real user paths, because fan-out makes the
tail dominate. Another, from the same writer: if you only watch one
number, watch the mean, and never use trimmed means that drop the tail
you most need to see. Both agree one number isn't enough.

**Writes are easier.** Quorum-based writes wait for three to five
replicas, not all of them, so they tolerate a slow replica by design
([[quorums]]). Many updates can also happen after replying to the user.

**Measuring the tail is its own problem.** You need
[[histograms]] with enough resolution at the top, enough requests to
fill the p99.9, and a load generator that doesn't hide the slow
periods ([[load-testing]], [[coordinated-omission]]).

**The numbers are from 2013 and 2014.** The fan-out math and the
causes still hold. The specific latencies came from hardware of that
time.

## What this means when you build

- For any request that fans out, the users see the tail of your
  backends, not their median. Budget with p99 and p99.9.
- Keep background work (GC, compaction, cron jobs) in check: throttle
  it, break it up, or line it up across machines.
- Hedge reads that are safe to repeat, after about the p95, and throttle
  hedges like retries.
- Consider answering with partial results when most of a fan-out has
  replied.
- Measure end to end, per user path, with histograms.

## Further reading

- [The Tail at Scale](https://www.barroso.org/publications/TheTailAtScale.pdf), Jeffrey Dean and Luiz André Barroso, CACM, 2013. The fan-out math, the causes of variability, and hedged, tied and good-enough requests, with Google's numbers.
- [Tales of the Tail](https://drkp.net/papers/latency-socc14.pdf), Jialin Li, Naveen Kr. Sharma, Dan R. K. Ports and Steven D. Gribble, SoCC 2014. Measured causes of excess tail latency on Linux servers, and what fixing each one bought.
- [Tail Latency Might Matter More Than You Think](https://brooker.co.za/blog/2021/04/19/latency.html), Marc Brooker, 2021. A simulation of fan-out and serial chains, and which statistics to watch.

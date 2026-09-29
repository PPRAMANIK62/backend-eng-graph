---
id: goodput
title: Goodput
depth: short
phase: 13
note: >-
  Requests finished in time to be useful, as opposed to all requests
  processed. Under overload the two split apart.
needs: [queueing-theory]
leads_to: [load-shedding, metastable-failures]
compare_with: []
---

# Goodput

Throughput counts every request a server is sent. Goodput counts only
the ones it answered without an error and fast enough for the caller to
use the answer. While a server has spare capacity the two numbers are
the same. Past its capacity they split apart, and goodput is the one
your users feel.

## A reply that arrives too late is worth nothing

Take one API server and a client that waits at most one second for a
reply. At low load every request is fast, so everything sent is also
useful. As load grows, requests start waiting for each other and
latency climbs (see [[queueing-theory]]). Past a point it climbs much
faster: threads fight over locks, the CPU spends more time switching
between them, and [[garbage-collection|garbage collection]] and I/O
contention get worse.

Now watch what the client sees. When the server's median latency
reaches the client's one-second timeout, half the requests time out.
The server may well have finished them. It logged a success and sent
a reply, but the client had already given up and counted an error.
The server spent the full cost of those requests and got no credit for
them.

It gets worse from there. A client that times out usually retries, so
every late reply turns into more incoming work, on a server that has
none to spare. Work done for a caller who has left is pure waste, and
the waste produces more load.

![A chart of goodput against offered load. A dashed diagonal shows every request sent. Both goodput curves rise along it up to the server's capacity. Past capacity the "without protection" curve drops steeply to zero, because replies arrive after the client gave up and retries add load. The "with load shedding" curve stays roughly flat near capacity, because the excess is rejected and the rest stays fast.](img/goodput-vs-offered-load.svg)

*Goodput as offered load rises past capacity, with and without load shedding. Schematic, no measured values. Adapted from David Yanacek, "Using load shedding to avoid overload" (Amazon Builders' Library, 2019).*

So the goodput curve has a shape you don't get from throughput alone.
It rises with load, peaks near capacity, and then falls. With nothing
to protect it, it can fall all the way to zero: the server is as busy as it
can be, and nobody gets a useful answer.

## The curve you want instead

The ideal overload result is a goodput curve that climbs to capacity
and then stays flat however much more load arrives. The server finishes
as much useful work as it can and turns the rest away quickly, instead
of accepting everything and finishing nothing in time. That's what
[[load-shedding]] is for.

Even with shedding the curve can't stay flat forever. Rejecting a
request still costs something (reading it, answering with an error),
so at enough excess load the rejections alone use up the server and
goodput drops again. Good shedding pushes that point far out; it
doesn't remove it.

Goodput also gives a sharp way to describe a worse kind of failure. In
a [[metastable-failures|metastable failure]], something (a short
outage, a burst of traffic) knocks goodput to near zero, and it stays
there after the trigger is gone, because retries and full queues keep
the system overloaded on their own.

## Where it gets tricky

**The server's success rate isn't goodput.** A server can report 100%
success while its callers see mostly timeouts, because it measures when
it finishes and they measure when they stop waiting. Measure goodput
where the client is, or at least count a reply as good only if it
came back within the caller's deadline.

**Fast failures flatter your latency graphs.** Once a server sheds a
lot of traffic, its rejections are very quick. If you mix them into
the latency numbers, the median can look great while successful
requests are slow. Keep latency for successes separate from latency
for errors.

**"Useful" depends on the caller.** The same reply can be on time for
a batch job and too late for a person staring at a spinner. Define
goodput per kind of caller, with the deadline that caller actually
uses.

## What this means when you build

- Define goodput for your service: successful replies that arrive
  within the client's timeout, counted per second.
- When you load test, push far past the breaking point and plot
  goodput against offered load, not just throughput or CPU (see
  [[load-testing]]). The shape past the peak tells you whether the
  service protects itself.
- Treat a goodput curve that falls toward zero as a bug to fix with
  load shedding, deadlines and limits on retries.
- The phase 13 lab's main result is exactly this plot, before and after
  the fixes.

## Further reading

- [Using load shedding to avoid overload](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf), David Yanacek, Amazon Builders' Library, 2019. Goodput versus throughput, the curve that collapses without shedding, and why a late reply is a failure.
- [Metastable Failures in Distributed Systems](https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf), Nathan Bronson, Abutalib Aghayev, Aleksey Charapko and Timothy Zhu, HotOS 2021. Goodput as "throughput of useful work", and failures where it stays near zero after the trigger is gone.

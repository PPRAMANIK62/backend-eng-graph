---
id: queueing-theory
title: Queueing theory
depth: deep
phase: 9
note: >-
  Why wait time shoots up as a server gets busy, and why 80% utilization
  can already feel slow.
needs: [littles-law]
leads_to: [capacity-planning, goodput, tail-latency]
compare_with: [use-method, load-balancing-algorithms]
---

# Queueing theory

Queueing theory is the math of jobs waiting for a busy resource. Its
main lesson for a backend engineer fits in one sentence: as a server
gets close to fully busy, the time requests spend waiting doesn't grow
steadily, it shoots up. That's why a service at 80% CPU can already
feel slow, why efficiency wins seem to fade, and how much headroom you
need to plan for.

## One server and a queue

Start with the smallest possible system: one server that handles one
request at a time, and a queue in front of it. Requests arrive at an
average rate λ (lambda). The server finishes them at an average rate μ
(mu) when it's busy, so each one takes 1/μ of work on average. Call
that the service time, S.

Utilization, written ρ (rho), is the ratio of the two:

ρ = λ / μ

It's also the fraction of time the server is busy. At ρ = 0.4, it's
idle 60% of the time. At ρ = 1 or above, more work arrives than
leaves, and the queue grows forever.

If arrivals were perfectly regular and every request took exactly the
same time, nothing would ever wait below ρ = 1. Queues form because
neither is regular. Sometimes three requests happen to show up at
once. The first gets the server, the other two wait. If the server has
little spare time, that backlog is still there when the next bunch
shows up.

The standard model for this is called **M/M/1**: random (Poisson)
arrivals, random (exponentially distributed) service times, one server,
unlimited queue. One client's traffic isn't Poisson, but the sum of
many independent clients comes close, which is why the model is a
useful first guess for a server.

## The curve

For M/M/1 the average number of requests in the system, waiting or
being served, is:

E[N] = ρ / (1 − ρ)

At ρ = 0.5 that's 1. At ρ = 0.99 it's 99.

Put that through [[littles-law]] (time in the system = number in the
system ÷ arrival rate), and the average time a request spends in the
system comes out as:

W = S / (1 − ρ)

So at 50% busy a request takes twice its service time on average, at
80% five times, at 90% ten times, at 99% a hundred times. The step from
50% to 80% costs 3 service times; the step from 90% to 99% costs 90.

![A chart of mean time in the system, in multiples of the service time, against utilization from 0% to 100%. The M/M/1 curve starts at 1× and passes 2× at 50%, 5× at 80% and 10× at 90%, then rises almost straight up near 100%. A curve for bursty arrivals or uneven work (Kingman's variability term of 2) rises earlier and faster; a curve for steadier work (term 0.5) rises later.](img/queueing-theory-utilization.svg)

*Mean time in the system against utilization. The middle curve is S ÷ (1 − ρ); the other two use Kingman's approximation with a different variability term.*

Make it concrete. A server does 10 ms of work per request, so it can
handle 100 requests a second at most. At 50 requests a second the
average request takes 20 ms. At 80 a second, 50 ms. At 90, 100 ms. At
99, a full second, for the same 10 ms of work. In a simulation of this
exact model, things start to look bad around 80%. That's the sense in
which a server at 80% can already feel slow.

The waiting also lands unevenly. A request that arrives just behind a
burst waits far longer than the average, so queueing is a common cause
of outlier latency, the [[tail-latency]] that users notice.

## Variability is the other half

M/M/1 assumes a particular amount of randomness. Real traffic can be
steadier or much worse. Kingman's formula, an approximation for one
server with any arrival and service patterns, shows how much that
matters. The average wait in the queue is roughly:

wait ≈ ρ / (1 − ρ) × (ca² + cs²) / 2 × S

Three factors: how busy the server is, how variable things are, and
how long the work takes. ca and cs are the coefficients of variation
(standard deviation divided by mean) of the gaps between arrivals and
of the service times. For M/M/1 both are 1, the middle factor is 1,
and you get back the curve above.

The middle factor multiplies everything. Double it, by having bursty
arrivals or a mix of cheap and very expensive requests, and the wait
doubles at every utilization. Halve it, with steady arrivals and
uniform work, and the wait halves. The chart shows both. The
approximation is most accurate close to saturation, exactly where it
matters.

This is also where the textbook model breaks down most. Real service
times are rarely exponential; they tend to look more like a log-normal
distribution, with a long tail of slow requests. When job sizes vary
a lot, or are correlated, the simple assumptions can give very wrong
answers.

## Faster servers help more than you'd think

Run the formula the other way. Your arrival rate is going to double.
How much faster must the server get to keep the same average response
time?

Less than twice. Doubling both λ and μ generally halves the mean
response time, so doubling the speed overshoots. Work it out for M/M/1,
where W = S / (1 − ρ) is the same as W = 1 / (μ − λ). With λ = 3 and
μ = 5 jobs a second, W = 1 / (5 − 3) = 1/2 s. At λ = 6 you only need
μ = 8 to get the same 1/2 s.

The same curve explains why efficiency work seems to vanish. Make the
code faster and μ rises, so ρ drops, and you slide down the steep part
of the curve: the mean and especially the tail improve a lot. Then
traffic grows, or someone removes servers to bank the savings, ρ climbs
back up, and so does the latency. The code didn't get slower. That's
also why high-percentile latency is a poor measure of efficiency, but
a good early warning that a server is nearing overload.

## Many servers, one queue

Now put c servers behind one shared queue (the M/M/c model; the
telephone world calls it Erlang's delay system). Keep each server 80%
busy, and grow c with the load.

The average latency falls toward the bare service time as c grows,
even though each server is just as busy. With more servers, it's less
likely that all of them are busy at the moment a request arrives. At
half load, 5 servers let 87% of requests through without waiting; 10
servers at double the load let 96.4% through. Most of this gain comes
at modest pool sizes, and in simulation the p99 and p99.9 follow the
same shape as the mean.

So at the same utilization, a bigger pool gives lower latency, or at
the same latency, higher utilization. This depends on the pool sharing
one queue. When each server keeps its own queue instead, spreading
requests across them is [[load-balancing-algorithms]].

A related puzzle: one fast server of speed s, or n slow servers of
speed s/n? It depends. When job sizes vary a lot, many slow servers
win, because short jobs don't get stuck behind long ones. At low load,
one fast server wins, because not all the slow servers get used and
each job runs slower on the one it gets.

## Bounded queues change the question

Everything above assumes an unlimited queue. Real servers can't afford
one: queued requests take memory and add latency.

A worked example: a server with a queue 10 times the size of its
[[thread-pool|thread pool]] and 100 ms of work per request. When the
queue is full, a new request takes about 1.1 s, almost all of it
waiting. For steady traffic it's usually better to keep the queue
small, half the pool size or less, and reject early. Gmail often runs
servers with no queue at all and relies on failing over to another
server when all threads are busy.

Once you've accepted that a queue can't absorb a lasting overload, you
have three levers: add capacity, reduce demand, or cap the queue and
decide what happens to the overflow. The overflow policies are
[[bounded-queues]], pushing back on the sender is [[backpressure]], and
dropping work on purpose is [[load-shedding]].

## Where it gets tricky

**Open vs closed load.** The formulas here assume arrivals don't care
how the server is doing: an open system, like independent users on the
internet. In a closed system a fixed number of clients each wait for a
reply before sending again, so the server can never have more than
that many requests. The same change can mean very different things in
the two. In one textbook example with six jobs always circulating
between two servers, making one server twice as fast barely changes
throughput or response time; in the open version of the same system
it clearly helps. Which kind you model matters when you design a load
test (see [[load-testing]]).

**The server itself slows down.** The model keeps service time fixed.
Real servers get slower as load grows: more requests in flight means
more memory, more threads, more file descriptors, and CPU caches used
less well. Late replies also make clients retry, which adds load
exactly when there's none to spare. So the real curve can have a cliff
where the model has a steep slope, and past it a server can finish
less useful work than before (see [[goodput]]).

**Hidden queues.** Few queues in a server are labelled as one. Threads
waiting on a lock, tasks waiting for I/O, requests waiting for a
connection from a pool: each is a queue with a utilization and the
same curve.

**Average vs percentiles.** Queueing results are mostly about means,
and a common piece of advice is never to look at average latency. Not
everyone agrees: for tracking efficiency, the mean is the steadier
number, because the tail moves so much with utilization. Watch the
tail for overload and the mean for efficiency.

**A utilization figure is an average over time.** A server at 50% CPU
over a minute can be at 100% for a few seconds of it. The queue builds
in those seconds.

## What this means when you build

- Don't plan a latency-sensitive service to run near 100%. Pick a
  target utilization from the latency you can afford at your service
  time, and remember the curve steepens fast past 80%.
- Reduce variability where you can: separate very expensive requests
  from cheap ones, smooth bursty batch jobs, and you lower the wait at
  every utilization.
- Prefer one shared queue feeding a pool of workers to many private
  queues.
- Keep queues short and bounded, and decide what happens when they
  fill.
- When latency creeps back up after a speedup, check utilization before
  blaming the code.
- Model with M/M/1 for intuition, then measure your real curve with a
  load test. The model tells you the shape, not your numbers. Turning
  the curve into server counts is [[capacity-planning]].

## Further reading

- [Performance Modeling and Design of Computer Systems, chapter 1](https://www.cs.cmu.edu/~harchol/PerformanceModeling/chpt1.pdf), Mor Harchol-Balter, 2013. The free first chapter of the standard textbook: what queueing theory is for, and design puzzles (doubling load, open vs closed, one fast vs many slow servers).
- [Latency Sneaks Up On You](https://brooker.co.za/blog/2021/08/05/utilization.html), Marc Brooker, 2021. The ρ / (1 − ρ) curve and why efficiency gains seem to disappear as utilization climbs back.
- [The most important thing to understand about queues](https://blog.danslimmon.com/2016/08/26/the-most-important-thing-to-understand-about-queues/), Dan Slimmon, 2016. A plain explanation of why wait times explode near full utilization, with a simulation.
- [Kingman's formula](https://en.wikipedia.org/wiki/Kingman%27s_formula), Wikipedia. The approximation that shows how variability multiplies waiting time.
- [Surprising Economics of Load-Balanced Systems](https://brooker.co.za/blog/2020/08/06/erlang.html), Marc Brooker, 2020. Why many servers sharing one queue beat the same servers at the same utilization with fewer of them.
- [Site Reliability Engineering, chapter 22: Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google, 2016. Queue sizing in real servers, and what overload does to them.

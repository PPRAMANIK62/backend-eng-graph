---
id: metastable-failures
title: Metastable failures
depth: deep
phase: 13
note: >-
  The system stays down after the trigger is gone, held there by its own
  retries and queues.
needs: [retry-budgets, goodput, caching]
leads_to: []
compare_with: [cascading-failures, load-shedding, circuit-breakers]
---

# Metastable failures

A metastable failure is an outage that keeps going after whatever
started it has gone away. A short blip pushes the system into a state
where it's busy but gets almost nothing useful done, and its own
behavior, usually retries, keeps it there. You care because the usual
fix, "find the cause and remove it", doesn't work: the cause is already
gone, and the system is still down.

## A worked example: retries that won't stop

Take a web service that sends one query to a database per request. The
database answers in under 100 ms as long as it gets fewer than 300
queries a second. Past that, its latency gets about ten times worse. The
web service waits 1 second for an answer, and if none comes, it sends
the query once more. That single retry is the whole design.

On a normal day the service gets 280 requests a second. That's close to
the limit but fine: queries are fast, nothing times out, nobody retries.

Now the network switch between the two drops out for 10 seconds. Every
query and retry sent during those 10 seconds is resent when the switch
comes back, so they all arrive at once. The database is flooded, its
latency jumps, queries take longer than 1 second, and the web service
starts retrying every one of them. Offered load is now 560 queries a
second: 280 new ones plus 280 retries.

The switch is fixed. The trigger is over. But the database is still
getting 560 queries a second, far over its 300 limit, so it stays slow,
so every query still times out, so every query still gets retried. Every
query the database finishes is one the client already gave up on.
[[goodput|Goodput]], the work that finishes in time to be useful, is
zero. Nothing in this loop will change by itself.

The numbers come from a simplified model in the paper that named the
pattern, not from a measurement. The shape is what matters: the system
had one good state and one bad state at the same offered load, and a
10-second push moved it from the first to the second.

## Three states, not two

It helps to stop thinking of a system as "up" or "overloaded" and think
of three states instead.

![State diagram with three boxes. Stable: a trigger causes errors, but they clear once the trigger ends. Vulnerable: healthy, but a big enough trigger tips it over. Metastable: busy, goodput near zero, held there by a sustaining effect such as retries. Arrows: load rising takes stable to vulnerable, a trigger takes vulnerable to metastable, the sustaining effect loops metastable back onto itself, and only a strong corrective push such as cutting load returns it to stable.](img/metastable-failures-states.svg)

*The three states and what moves a system between them. Adapted from Nathan Bronson and others, "Metastable Failures in Distributed Systems", figure 1 (HotOS 2021).*

- **Stable.** Load is low enough that even the worst case, with every
  retry, fits in capacity. A trigger causes errors, and they go away
  when the trigger does. In the example, that's below 150 requests a
  second: even doubled by retries, the database can take it.
- **Vulnerable.** Load is above that line but the system is healthy.
  Nothing looks wrong on any dashboard. It only takes a big enough
  trigger. In the example, anything between 150 and 300 requests a
  second.
- **Metastable.** The bad state. The system is running flat out, goodput
  is near zero, and a feedback loop holds it there.

The line between stable and vulnerable is invisible in normal
operation. It's called hidden capacity: the load at which the
system will still heal itself. Advertised capacity is higher, the load
it can serve when all is well. In the example, advertised capacity is
300 requests a second and hidden capacity is 150.

A system can sit in the vulnerable state for months or years, then fall
over one day with no increase in load at all. Many teams run there all
the time on purpose, because it's so much more efficient than keeping
enough spare capacity to stay stable.

## The loop is the cause, the trigger is just the push

Every metastable failure has two parts. The **trigger** is whatever
starts it: a network blip, a bad deploy, a load spike, a server
restarting. The **sustaining effect** is the feedback loop that keeps it
going once the trigger is gone.

Outages like this usually get blamed on the trigger, and the fix is
aimed there. That misses the point. Many different triggers can land
the system in the same bad state, so the root cause is the loop. Fix the
trigger and the next, slightly different trigger will do the same thing.

The loop almost always means some resource runs out, and something makes
the system spend more of that resource once it's short. The common
loops:

- **Retries.** Each failure creates more work, which creates more
  failures. In a study of public incident reports from AWS, Google
  Cloud, Azure and others, retries were the sustaining effect in more
  than half of the 22 metastable failures found. See
  [[retries-with-backoff]].
- **An empty cache that can't refill.** A [[caching|look-aside cache]]
  with a 90% hit rate lets a database that can take 300 queries a
  second serve 3,000 requests a second. If the cache is emptied, every
  request goes to the database, a tenfold jump. The database times out,
  the application counts every query as failed, and so it never fills
  the cache. The cache stays empty because the database is slow, and
  the database stays slow because the cache is empty.
- **Slow error paths.** The success path is tuned to the bone. The error
  path grabs a stack trace, does a DNS lookup for the client's name,
  writes a detailed log line. Under failure, each request costs more,
  which causes more failures.
- **Capacity that drops under load.** Overload itself can lower
  capacity. A longer queue means more memory in use, which can mean more
  [[garbage-collection]] pauses, which means less work done, which means
  a longer queue.

The loop can also spread. Parts of the system that never saw the
trigger can get pulled into the failed state, because they depend on
the part that's stuck.

### A real one: DynamoDB, 2015

AWS's public summary of a DynamoDB outage in US-East shows the whole
pattern. Storage servers periodically asked a metadata service for
their "membership", the list of partitions they hold. If the answer
didn't arrive in time, a server took itself out of service and retried.
Those answers had grown much larger as customers adopted a new feature,
until processing some of them took nearly as long as the timeout.
Nobody was watching that size.

The trigger was a brief network disruption. A batch of storage servers
all asked for their membership at once, the metadata service slowed
down, answers passed the timeout, and those servers dropped out and
retried. Now healthy servers doing their routine check also timed out,
dropped out and retried too. Customer error rates settled at about 55%.

The team couldn't even add capacity to the metadata service, because it
was too overloaded to accept the admin requests to do so. What worked
was pausing requests to the metadata service entirely. That cut the
retries, the service recovered, capacity was added, and traffic was let
back in. The follow-up actions included requesting membership less
often, a longer timeout, and splitting the metadata service into many
instances, each serving only part of the fleet (the idea behind
[[cell-based-architecture]]).

## Getting out

Because the loop is self-sustaining, getting out takes a strong push
from outside:

- **Cut the load hard.** Throttle, drop requests, pause a whole class
  of traffic, as DynamoDB did. In public incident reports, recovery
  often came down to shedding load like this. [[load-shedding]] is the
  controlled version.
- **Break the loop.** Turn retries off, or turn failover off, until the
  system recovers.
- **Restart.** Rebooting clears queues and state. It's crude, and it
  works for the same reason.

Adding capacity sounds like the obvious fix but often isn't fast. A
stateful system that grows has to reconfigure itself, which costs
capacity in the short term, right when there's none to spare. And
as DynamoDB showed, the tools you'd use to scale may depend on the
system that's down.

## Staying out

The goal is to weaken the strongest loops, not remove every one.

- **Bound retries.** A [[retry-budgets|retry budget]] caps retries as a
  share of normal traffic, so a burst of failures can't double the
  load. In the example, the system recovers once retries are held under
  20 queries a second. Retrying at a lower priority than first attempts
  works too: new requests succeed, so fewer retries are needed.
- **Change policy under overload.** Serve newest-first (LIFO) so some
  requests still make their deadline, shrink internal queues, enforce
  priorities, shed a fraction of requests, or trip a
  [[circuit-breakers|circuit breaker]].
- **Tell a spike from real overload.** Watch the minimum queueing delay
  over a sliding window, as the CoDel queue manager does. If the queue
  emptied at some point in the window, it's a spike you can ride out. If
  the minimum stays high, switch to protecting goodput.
- **Let the fix finish even when the caller gives up.** A read-through
  cache with a generous timeout of its own keeps filling after the web
  request has timed out, so the hit rate climbs back and the loop
  breaks. A look-aside cache can't do that, because the application
  that fills it has already given up.
- **Make error paths cheap.** Send errors to a bounded queue for a
  logging thread, and when it's full just bump a counter. Sample stack
  traces instead of taking one per error.
- **Watch a characteristic metric.** For each loop there's usually a
  metric that the trigger moves and that only comes back after the
  failure ends: queueing delay, latency, timeout rate, cache hit rate.
  Alarm when it leaves its safe range.
- **Measure hidden capacity.** Run a load test, apply a trigger, and see
  whether the system settles by itself. If it does, that load is below
  hidden capacity. This is exactly the kind of experiment
  [[chaos-engineering]] exists to run.

## Where it gets tricky

**It isn't the same as a cascading failure.** In a
[[cascading-failures|cascading failure]], overload moves from one part
to the next until everything is down. The two overlap: "cascading
failure" is one of the names people have used for metastable outages,
and a metastable failure can spread like a cascade. The test for metastability is the one question: does it stay
down after the trigger is removed? Plain overload doesn't. A
denial-of-service attack or a livelock ends when its cause ends.

**Good changes can make it worse.** Optimizations that only help the
common case push you further into the vulnerable state. A better cache
eviction policy lowers database load, so someone reclaims database
servers, and now the system can't survive losing the cache. Adding
retries makes the daily error rate go down, which looks like a win,
while turning small outages into retry storms. The metric you review
every week can reward the change that sets up the next outage.

**Tests at small scale don't catch it.** How strong a loop is depends on
constants that change with scale, like cache hit rate, so a small
replica tells you little. The cache version is worse: a load test adds
load but keeps the usual key mix, and the bad mode needs a different,
heavier-tailed mix of keys, so the test may never show it.

**Mode switches have their own cost.** Switching to a different policy
under overload means the system has two behaviors, and the one you
rarely run is the one you understand least. Priorities help when you
can get them, but many systems have no clear order of importance, and
one system with a full priority scheme still failed when extra retries
and failover gave a worst case of over 100 times the work.

**It's an old idea with a new name.** People who build control systems
know bistable systems well, and ops teams have long had names for
pieces of this: retry storms, death spirals, persistent congestion. The
2021 paper's contribution was one framework for all of them. Nobody yet
has a systematic way to find the next one before it happens; that's
still an open research question.

## What this means when you build

- Ask of every retry, failover and cache: what happens to load if this
  fails all at once? If the answer is "it doubles", bound it.
- Use retry budgets, not just [[retries-with-backoff|backoff]]. Backoff
  spreads retries out in time; a budget limits how many there are.
- Know your hidden capacity, not just your peak throughput. Test it by
  applying a trigger under load and watching whether the system
  recovers on its own.
- Pick a characteristic metric per critical path (queueing delay is a
  good default) and alarm on it.
- Plan the big lever in advance: a switch that sheds a class of traffic
  or pauses retries, tested before you need it.
- In a [[postmortems|postmortem]], name the loop, not only the trigger.

## Further reading

- [Metastable Failures in Distributed Systems](https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf), Nathan Bronson, Abutalib Aghayev, Aleksey Charapko, Timothy Zhu, HotOS 2021. The paper that named the pattern: the three states, the retry and cache examples, hidden capacity and characteristic metrics.
- [Metastable Failures in the Wild](https://www.usenix.org/system/files/osdi22-huang-lexiang.pdf), Lexiang Huang and others, OSDI 2022. 22 real incidents from public reports, what triggered and sustained them, and how they were stopped.
- [Summary of the Amazon DynamoDB Service Disruption and Related Impacts in the US-East Region](https://aws.amazon.com/message/5467D2/), AWS, 2015. A real metastable failure told by the team, retries and all.
- [Metastability and Distributed Systems](https://brooker.co.za/blog/2021/05/24/metastable.html), Marc Brooker, 2021. A short, skeptical review of the paper: which fixes work, and why retries can hurt.
- [Caches, Modes, and Unstable Systems](https://brooker.co.za/blog/2021/08/27/caches.html), Marc Brooker, 2021. The cache version of the loop, and why load tests miss it.

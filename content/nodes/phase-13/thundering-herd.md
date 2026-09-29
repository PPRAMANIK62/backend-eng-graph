---
id: thundering-herd
title: Thundering herd
depth: short
phase: 13
note: >-
  Many clients waking up and retrying at the same moment.
needs: [retries-with-backoff]
leads_to: [cascading-failures]
compare_with: [cache-stampede]
---

# Thundering herd

A thundering herd is many clients doing the same thing at the same
moment: all retrying right after a shared failure, all reconnecting
after a restart, all running a job on the hour. Each client behaves
reasonably on its own. Together they send a spike far above normal
traffic, often at a service that has just recovered and is least able
to take it.

## How clients fall into step

Clients drift apart naturally: they start at different times and send
at different rates. A shared event lines them up again. When a backend
goes down, every client that was talking to it fails at about the same
time. If they all wait the same fixed delay before retrying, they all
retry at the same time too, and again after the next fixed delay.
Plain [[retries-with-backoff|exponential backoff]] doesn't break the
pattern on its own: clients that failed together back off by the same
amounts and still come back together, just less often.

![Two timelines after an outage. Top, "retry at the same delay": normal traffic is a row of small bars, with tall spikes at regular intervals where every client retries together. Bottom, "with jitter": the same extra retries are spread out as slightly taller bars across the whole period, with no spikes.](img/thundering-herd-retry-spikes.svg)

*Synchronized retries arrive as spikes; jittered ones arrive spread out. Schematic, no measured values.*

## The Pokémon GO launch

Pokémon GO's launch on Google Cloud's load balancer is the textbook
case. Traffic was far above anything planned, the game's backends got
slow instead of refusing requests, and requests started timing out.
The app retried each failed request once straight away, then at a
constant interval. During the outage the service sometimes answered a
large number of requests with quick errors at once, for example when a
shared backend restarted. Those errors set every client's retry timer
at the same moment. The result was waves of synchronized retries that
reached 20 times the game's previous global peak.

Google's engineers contained it by limiting how much traffic the load
balancers would accept for the game, which held demand down long
enough for the game to get back to normal and start scaling up. The lasting fix was on the clients: jitter and truncated
exponential backoff, which stopped the synchronized spikes.

## Breaking the rhythm

The fix is randomness. With jitter, each client adds a random amount
of time to its wait before retrying.
The same number of retries still happens, but spread over the whole
window instead of landing in one instant. The backend sees a raised
but steady load it can work through, instead of a wall.

The same goes for anything scheduled: timers, periodic jobs, cache
refreshes, health checks. If many machines run a job "every
minute" off well-synchronized clocks, they run it together unless you
add jitter.
Amazon adds jitter to all of these, and for scheduled work picks each
host's offset in a fixed way (the same host always gets the same
delay), so if a job causes trouble, the trouble repeats in a pattern
you can recognise.

Jitter spreads a herd out; it doesn't make it smaller. If the backend
can't handle the total retry volume however it's spread, you also need
a cap on retries ([[retry-budgets]]) and a server that can shed what it
can't serve ([[load-shedding]]).

## Where it gets tricky

**Fast errors can make it worse.** A server that fails many requests
at once, cheaply, sends all those clients into their retry wait
together. Shedding is still the right thing to do, but the clients
need jitter so the rejection doesn't become the starting gun.

**Same shape, different fixes.** A [[cache-stampede]] is also many
requests at once, all missing the same cache key. The fix there is about
who rebuilds the missing value, not about spreading requests in time.
The kernel has its own, unrelated "thundering herd" problem too (see
[[io-multiplexing]]).

## What this means when you build

- Add jitter to every retry, reconnect, timer and periodic job.
- Don't retry immediately or at a fixed interval, especially in client
  apps running on many devices.
- Cap retries, and make the server shed load it can't serve.
- After an outage, expect a wave when clients come back, and be ready
  to limit how much traffic you accept while it passes.

## Further reading

- [The Site Reliability Workbook, chapter 11: Managing Load](https://sre.google/workbook/managing-load/), Cooper Bethea, Gráinne Sheerin, Jennifer Mace and Ruth King, Google, 2018. The Pokémon GO case study: how quick errors synchronized client retries into a herd, and how it was stopped.
- [Timeouts, retries, and backoff with jitter](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf), Marc Brooker, Amazon Builders' Library, 2019. Why correlated failures need jitter, and jitter on timers and scheduled jobs.

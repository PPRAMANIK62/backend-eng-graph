---
id: retries-with-backoff
title: Retries with backoff and jitter
depth: deep
phase: 5
note: >-
  Retrying with exponential backoff and jitter so retries don't pile on.
needs: [idempotency, timeouts]
leads_to: [delivery-guarantees, dead-letter-queue, retry-budgets, thundering-herd, cascading-failures, webhooks, shuffle-sharding]
compare_with: [tcp-retransmission, error-design, deadline-propagation, hedged-requests]
---

# Retries with backoff and jitter

When a call fails, trying it again often works. Retrying well means
waiting longer after each failure (backoff), adding randomness to the
wait so clients don't retry in step (jitter), and capping how much
retrying anyone does. Get it wrong and retries turn a short blip in one
service into an overload that outlasts the blip.

## Why a second try often works

Big systems rarely fail all at once. Most failures are partial, where
some fraction of requests fail, or transient, where requests fail for a
short while. A dropped connection, one overloaded server behind a
[[load-balancing|load balancer]], a deploy restarting a process: the
next attempt lands somewhere else, or a moment later, and succeeds.
Google's load balancers lean on this. When only a few backend tasks are
overloaded, the preferred response is to retry right away, because the
retry will probably go to a different task.

So retrying is worth doing. Two things have to be true first. The call
must be safe to repeat, which is [[idempotency]]; a retry of a charge
that actually went through charges twice unless the server can spot the
duplicate, for example with an [[idempotency-keys|idempotency key]].
And you have to know when an attempt has failed, which usually means a
[[timeouts|timeout]].

## Retries are selfish

A retry asks the server to spend more of its time on your request to
raise your chance of success. When failures are rare, that trade is
cheap. When the failures are caused by overload, every retry adds load
to a server that already has too much.

Google's SRE book walks through what happens. A frontend retries
failed calls to an overloaded backend once a second. In the first
second, 100 requests a second fail and are retried. The next second,
the retries plus the new failures make 200 a second, then 300. A
shrinking share of requests succeed on their first try, the backend
does less useful work, and if it crashes, its load moves to the
remaining tasks and overloads them too. The retries can keep the
system overloaded after whatever started it has gone away. That's a
[[cascading-failures|cascading failure]].

## Backoff: wait longer each time

The first fix is to wait between attempts, and to wait longer after
each failure. The common form is capped exponential backoff:

```
sleep = min(cap, base * 2 ** attempt)
```

With a base of 100 ms, that's 100, 200, 400, 800 ms and so on, up to
the cap. The cap keeps the wait from growing without end. It brings a
problem of its own: once every client reaches it, they all retry at
the capped rate forever. So backoff always comes with a limit on the
number of attempts, after which the client gives up and reports the
failure. Usually the client would give up soon anyway, because it has
an overall timeout of its own.

## Jitter: don't retry in step

Backoff alone helps less than you'd expect. If a thousand clients fail
at the same moment, they all wait 100 ms, retry together, fail
together, wait 200 ms, and retry together again. The load arrives in
spikes with quiet gaps between them, and each spike looks like the one
that caused the failure.

![Two timelines of retries from many clients that all failed at the same moment. In the top one, exponential backoff with no jitter, the retries land in tall spikes at the same points in time with empty gaps between them. In the bottom one, full jitter, the same number of retries are spread across the time between, at a roughly even rate.](img/retries-backoff-jitter.svg)

*Backoff without jitter moves the spike; jitter flattens it. A schematic, adapted from Marc Brooker, "Exponential Backoff And Jitter" (AWS Architecture Blog, 2015).*

Jitter adds randomness to each wait. The version Marc Brooker called
"full jitter" picks a random wait between zero and the backoff:

```
sleep = random_between(0, min(cap, base * 2 ** attempt))
```

He compared it in a simulation of many clients competing to update one
database row with [[optimistic-concurrency|optimistic concurrency]]. Plain exponential backoff was the clear loser, using more
calls and more time than any jittered version. With 100 competing
clients, full jitter cut the number of calls by more than half. Two
other variants did worse or no better: "equal jitter" (keep half the
backoff, randomise the other half) took much longer, and
"decorrelated jitter" (base each wait on the previous one) made more
calls. None of them changes the underlying cost of contention; they just
stop clients from making it worse.

Jitter isn't only for retries. Anything many machines do on a timer
(a cron job at the top of the hour, a client that polls once a minute)
lines up the same way. Amazon adds jitter to timers and periodic jobs
too.

## How many retries, and at which layer

**Retries multiply across layers.** Say a user request passes through
five services, the last one calls a database, and each layer tries
three times. If the database starts failing, it sees up to 3 × 3 × 3 ×
3 × 3 = 243 times the load. The SRE book's version: three layers each
making four attempts turn one user action into 64 attempts on the
database. Both Amazon and Google end at the same rule: retry at one
place in the stack. Google puts it at the layer directly above the one
that's rejecting requests; the layers above that get an error that says
not to retry.

**Cap attempts per request.** Google allows up to three attempts per
request. If three tasks in a row were overloaded, the whole datacenter
probably is, and a fourth try won't help.

**Cap retries per client.** A per-request cap still lets retries nearly
triple the load when most requests fail. So each Google client also
tracks what fraction of its requests are retries, and stops retrying
above 10%. With that budget added, the growth drops to about 1.1× in
the general case. The SRE book also suggests a per-process budget, such
as 60 retries a minute. The AWS SDKs do the same job with a token
bucket (since 2016), and gRPC with a token count per server: each
failure takes a token, each success returns a fraction of one, and
retries stop while the count is below half. This family of limits is
[[retry-budgets]].

## What to retry

- **Only calls that are safe to repeat.** Reads, idempotent writes, and
  writes that carry an idempotency key.
- **Only errors that can go away.** A malformed request fails the same
  way every time. In HTTP terms, a 4xx says the request was wrong and
  shouldn't be sent again unchanged, while a 5xx may succeed later.
  [[eventual-consistency|Eventual consistency]] blurs this: a "not found" can turn into success
  a moment later, once a new record has reached every replica.
- **Not when the server says it's overloaded.** A server that knows
  it's overloaded should say so with a specific error, so callers back
  off instead of retrying. Google's backends go further: clients send
  an attempt count with each request, and a backend that sees many
  retries answers "overloaded; don't retry".
- **Not after the response has started.** gRPC treats a call as
  committed once the response headers arrive, and never retries it
  after that.

gRPC shows what a complete policy looks like. It's set per method: a
maximum number of attempts, an initial backoff, a multiplier, a cap, and
the status codes worth retrying, such as `UNAVAILABLE`. It adds jitter
of plus or minus 20% to every wait. Without a policy it still does
"transparent" retries, but only when it's sure the server application
never saw the call.

## Where it gets tricky

**How much jitter.** Full jitter can make a client retry almost
immediately. gRPC's ±20% keeps every wait close to the backoff. Both
spread clients out, but they trade off differently between spreading
the load and keeping a floor on each wait. There's no single right
answer; Brooker's simulation is one workload.

**Random or repeatable.** For scheduled work, Amazon deliberately picks
each host's jitter the same way every time rather than at random. If
something overloads, it happens in a repeating pattern that people can
spot and trace, not at random.

**Circuit breakers or budgets.** A [[circuit-breakers|circuit breaker]]
stops all calls to a failing service once errors pass a threshold. It's
widely recommended, but Amazon found breakers add a separate mode to
the system that's hard to test and can slow recovery. It limits retries
with a local token bucket instead. The two aren't exclusive, but they
answer "when do we stop?" differently.

**Retrying at the top wastes work.** Retrying only at the outermost
layer avoids multiplication, but throws away whatever the lower layers
already did. Retrying only just above the failing layer keeps that
work, but needs the "don't retry" signal to stop the layers above from
retrying too.

**Bad retries look like a symptom.** During an outage, a graph of retry
rates going up is easy to read as a result of the problem rather than
part of its cause. The fix is usually a code change to the retry
behaviour, or cutting load hard until the retries stop.

**TCP already retries.** Underneath your request, TCP resends lost
segments on its own timers ([[tcp-retransmission]]). Application
retries sit on top and resend whole requests after TCP has given up or
your timeout has fired. One doesn't replace the other.

## What this means when you build

- Retry only idempotent calls or calls with an idempotency key, and
  only errors that can go away.
- Use capped exponential backoff with jitter, and a small maximum
  number of attempts.
- Retry at one layer. Return a "don't retry" error to the layers above
  when you give up.
- Put a budget on retries per client or per process, so a big outage
  can't multiply your traffic.
- Add jitter to anything scheduled on many machines.
- Graph your retry rate, and read it as a possible cause during
  incidents.
- After the last attempt, decide where the work goes: an error to the
  caller, or a [[dead-letter-queue]] to replay later.
- Many clients failing and retrying together is also called the
  [[thundering-herd]] problem.

## Further reading

- [Timeouts, retries, and backoff with jitter](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf), Marc Brooker, Amazon Builders' Library, 2019. Why retries are selfish, the 243× example, token buckets vs circuit breakers, and jitter on timers.
- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), Marc Brooker, AWS Architecture Blog, 2015. The backoff and jitter formulas and a simulation comparing them.
- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google SRE book, 2016. How naive retries overload a backend, and a checklist for safe retries.
- [Handling Overload](https://sre.google/sre-book/handling-overload/), Alejandro Forero Cuervo, Google SRE book, 2016. Per-request and per-client retry limits, and retrying only at the layer above the failure.
- [Retry](https://grpc.io/docs/guides/retry/), gRPC docs. A real retry policy: attempts, backoff, jitter, retryable codes, throttling and transparent retries.
- [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency), Brandur Leach, Stripe, 2017. Retries from an API client's side: idempotency keys plus backoff and jitter, and the thundering herd.

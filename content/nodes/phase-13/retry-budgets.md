---
id: retry-budgets
title: Retry budgets
depth: short
phase: 13
note: >-
  Capping retries as a share of traffic, so retries at every layer can't
  multiply load.
needs: [retries-with-backoff]
leads_to: [metastable-failures, service-mesh]
compare_with: [circuit-breakers]
---

# Retry budgets

A retry budget caps retries as a share of a client's normal traffic,
say one retry per ten requests. A limit per
request stops one request from retrying forever, but it doesn't stop
every request from retrying at once when a whole service is failing. A
budget does: retries still cover scattered failures, and stop when
failures are everywhere.

## Why a limit per request isn't enough

[[retries-with-backoff|Retrying with backoff]] already includes a cap
on attempts. Google's clients allow three attempts per request. Now
picture a datacenter that's rejecting most of what it gets. Nearly
every request fails, so nearly every request uses all three attempts,
and the load on the datacenter grows to just under three times what
the clients wanted to send.

Rejecting is cheaper than serving, but not free: a backend can end
up overloaded while spending most of its CPU saying no.

## Counting retries against requests

Google's fix is a second limit, per client. Each client tracks what
share of its requests are retries, and only retries while that share
is below 10%. When a few tasks struggle, the budget never binds. When most
requests fail, it runs out and the rest fail straight away.
In the same worked example, load grows to about 1.1 times instead of
nearly 3.

![Bar chart of the load on a datacenter that rejects most requests, with the requests clients want to send as 1×. No retries: 1×. Up to 3 attempts per request: just under 3×. Three attempts plus a per-client budget that keeps retries under 10% of requests: about 1.1×.](img/retry-budgets-load.svg)

*A per-request cap still nearly triples the load; a budget keeps it close to normal. Adapted from Alejandro Forero Cuervo, "Handling Overload", Google SRE book (2016).*

## Three ways to count

**A share of recent requests.** Google's 10% is one. Finagle, Twitter's
RPC library, allows about 20% of requests to be retried, plus 10
retries a second on top. The floor is for clients that have just
started or send little traffic. Underneath it's a leaky token bucket
whose deposits expire after a time-to-live, so the budget reflects
recent traffic only. Finagle has two retry filters and
recommends sharing one budget between them to prevent retry storms.

**A token bucket.** The AWS SDKs' current retry behavior (opt-in when
this was written) gives each client 500 tokens. A retry after a
transient error such as a 500 costs 14 tokens, a retry after a
throttling error costs 5, and a request that succeeds first time puts 1
back. A retry that succeeds refunds its own cost. Transient errors cost
more because they often mean the whole service is in trouble. With
three attempts, the bucket starts to drain once more than
about 22% of requests keep failing with transient errors, or about 32%
with throttling. A full bucket soaks up short bursts of errors, and it never delays a
first attempt.

**A share of requests in flight.** Envoy counts concurrency instead of
rate. Its retry budget allows active retries up to a percentage of the
requests active or waiting right now, 20% by default, with a floor of 3
retries so a quiet cluster can still retry at all. When it's set, it
replaces Envoy's fixed limit on parallel retries, which defaults to 3.

## Where it gets tricky

**Each client only sees its own traffic.** Every budget above lives in
one client. Marc Brooker simulated a token-bucket budget with the same
total traffic split across 10, 100 and 1,000 clients. With many small
clients, each one's bucket stayed full too long, and the system
behaved almost like plain "retry N times". Sharing state between
clients would fix that, at the cost of clients having to find each
other. Google adds a signal from the other side: clients send
an attempt count with each request, and a backend that sees a lot of
retries answers "overloaded; don't retry".

**Budget or breaker.** Another way to limit retries is a
[[circuit-breakers|circuit breaker]] that stops retrying once the
recent failure rate passes a threshold. In Brooker's simulation it gave
no extra load at high failure rates, but it's all or nothing, and with
independent clients it tripped at about half the failure rate it was
set for. The token bucket has no such on/off switch, but adds some
tunable extra load when most calls fail.

**A budget doesn't replace retrying at one layer.** Each layer's budget
still lets some retries through, and layers stacked on top of each
other each spend their own. Google still retries only at the layer
directly above the one that's failing, and sends "don't retry" further
up.

**It's part of recovering.** Retries can hold a service down after
whatever broke it is fixed, one of the loops behind
[[metastable-failures]]. In one worked example, a 10-second network
outage left clients sending 560 queries a second instead of their usual
280, and recovery meant cutting retries or load.

## What this means when you build

- Cap retries per client as well as per request. A share of requests
  somewhere around 10 to 20% is where the systems above landed.
- Never let the budget touch first attempts.
- Share one budget across every retry path in a client.
- Graph the budget left; empty means failures are widespread.

## Further reading

- [Handling Overload](https://sre.google/sre-book/handling-overload/), Alejandro Forero Cuervo, Google SRE book, 2016. The 10% per-client budget, the 3× versus 1.1× example, and the "don't retry" signal.
- [Clients](https://twitter.github.io/finagle/guide/Clients.html), Finagle user guide, 24.2.0. A budget in a real RPC library: 20% plus 10 a second, a time-to-live on tokens, and one budget shared by all retries.
- [Retry behavior](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html), AWS SDKs and Tools reference guide. The retry quota token bucket with its costs, and the failure rates at which it drains.
- [Circuit breakers (proto)](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/circuit_breaker.proto), Envoy docs, 1.40.0-dev. A budget counted in requests in flight, with its defaults.
- [Metastable Failures in Distributed Systems](https://sigops.org/s/conferences/hotos/2021/papers/hotos21-s11-bronson.pdf), Nathan Bronson et al., HotOS 2021. How retries keep a system overloaded after the trigger is gone, and retry budgets as one way out.
- [Fixing retries with token buckets and circuit breakers](https://brooker.co.za/blog/2022/02/28/retries.html), Marc Brooker, 2022. A simulation comparing no retries, N retries, a token bucket and a retry breaker, and what the number of clients does to each.

---
id: distributed-rate-limiting
title: Distributed rate limiting
depth: short
phase: 17
note: >-
  Rate limits shared across many servers.
needs: [rate-limiting-algorithms, redis-internals, redis-transactions, clock-skew]
leads_to: []
compare_with: []
---

# Distributed rate limiting

A rate limit like "5,000 requests an hour per API key" is easy on one
server: a counter in memory. Behind twenty servers, each sees only part
of a client's traffic, so either they share a count or the limit
quietly becomes twenty times bigger.
Distributed rate limiting is how the servers share that count, and how
much accuracy, latency and availability you trade to do it.

## Twenty servers, one limit

Say every server runs its own [[rate-limiting-algorithms|token bucket]]
per client. A client whose requests are spread across twenty servers
fills twenty buckets, and gets through up to twenty times the limit.
Fine for rough flood protection; wrong for a limit you promised a
customer, or one that protects a database many hosts call.

There are three ways out:

1. **A shared store, checked on every request**, usually Redis.
2. **Local first, shared second.** A local bucket absorbs bursts; only
   what passes it hits the shared limit.
3. **Count asynchronously**, and block the client once the shared count
   says it's over.

![Three designs. Left: each server keeps its own counter, so a client spread across three servers gets three times the limit. Middle: every server runs an atomic check-and-increment script against a shared Redis shard for each request, which is accurate but adds a network round trip and makes Redis a dependency. Right: each server first applies a local token bucket, and only requests that pass go on to the shared global check, which absorbs bursts before they reach the shared store.](img/distributed-rate-limiting-designs.svg)

*Three ways to share a limit across servers. The two-stage design adapted from the Envoy docs, "Global rate limiting" (Envoy 1.40.0-dev).*

## A shared counter in Redis

The common design keeps each client's counter in Redis. Stripe runs its
per-user token buckets there. GitHub moved its API limiter there too,
and its design shows the details that matter:

- **One atomic step per request.** The check and the update run as one
  Lua script inside Redis (see [[redis-transactions]]), so two servers can't both read "4,999" and
  both let a request through. A script runs inside Redis as one
  atomic step, much as a single command does ([[redis-internals]]).
- **Shard by key, in the application.** For each rate-limit key, the
  app picks which of several Redis clusters holds it, so no single
  Redis carries every client.
- **A primary for writes, replicas for reads**, to spread the CPU
  load, and Redis TTLs to delete old windows.

GitHub moved there partly because its old Memcached, shared with
application caches, sometimes evicted live limiter data and handed
clients a fresh window early.

## Where it went wrong anyway

GitHub's write-up is mostly about two bugs.

**Two clocks.** The reset time sent to clients was Redis's TTL for the
key plus the app server's clock. Time passes between the two readings,
so the reset time sometimes jumped by a second between requests. The
fix: store the reset time as data, from one clock, and use the TTL only
for cleanup. One limit, one clock ([[clock-skew]]).

**A replica that hadn't expired the key.** A request read the count
from a [[leader-follower-replication|replica]], saw the old, full window, and prepared a rejection. The
increment then went to the primary, which expired the old window and
started a new one, so the rejection said 5,000 requests remained.
Redis replicas wait for the primary to expire keys. The fix: treat
anything past its reset time as expired in the application, and build
the response from a single call.

## Keep the shared store off the hot path

A check on every request costs a round trip, and makes the store a
dependency of every request. Two designs cut that down.

**Two stages.** Envoy puts a local token bucket in front of its global
rate limit service. The local bucket, coarse and in memory, absorbs
large bursts that could otherwise overwhelm the global service; the
global check then enforces the precise limit. For large fleets with
uneven load, Envoy also has a quota mode: instances send periodic load
reports and receive quota assignments, a fair share of the global
limit.

**Count after the fact.** Cloudflare's rate limiting counts
asynchronously, so no request waits for the counter. It also avoids a
worldwide counter: [[anycast]] sends one client's traffic to one data
centre, so each data centre counts on its own, in a store sharded
across its servers. Once a client goes over, each server caches a
"blocked until time X" flag and stops asking the store. On 400
million requests they measured 0.003% wrongly allowed or blocked. Because
counting lags behind the requests, a client can get a little past the
limit before the block starts.

## Where it gets tricky

**Accuracy costs latency.** A check on every request is exact but adds
a round trip; local or asynchronous counting is fast but lets some
excess through.

**When the store is down.** If Redis can't be reached, either every
request fails or none is limited. Stripe chose to fail open: errors in
the limiter must never take the API down. That's usually right for
limits that exist to be fair, and wrong for limits that protect
something fragile.

**Regions.** A counter shared across regions pays cross-region latency
on every check. Cloudflare counts per data centre on purpose; GitHub
avoided per-datacenter counters because they split a client's count.

## What this means when you build

- If the limit needn't be exact across servers, count locally.
- If it must be shared, do check and increment in one atomic operation
  in the store, such as a Lua script in Redis.
- Use one clock for window and reset times, and don't trust a replica's
  view of expiry.
- Shard counters by key; put a local bucket in front of the shared
  check.
- Choose fail open or fail closed on purpose, and alert when the
  limiter's store is unreachable.

## Further reading

- [How we scaled the GitHub API with a sharded, replicated rate limiter in Redis](https://github.blog/engineering/infrastructure/how-we-scaled-github-api-sharded-replicated-rate-limiter-redis/), Robert Mosolgo, GitHub, 2021. A sharded Redis limiter and the clock and replica bugs it hit.
- [Global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/other_features/global_rate_limiting), Envoy docs, 1.40.0-dev. When a global limit is needed, quotas, and the two-stage design.
- [How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/), Julien Desgats, Cloudflare, 2017. Counting per data centre and asynchronously, with measured accuracy.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe, 2017. Token buckets in Redis, and failing open.

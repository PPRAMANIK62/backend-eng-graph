---
id: hedged-requests
title: Hedged requests
depth: short
phase: 9
note: >-
  Sending a second copy of a slow request to another replica and taking
  whichever answer comes first.
needs: [tail-latency]
leads_to: []
compare_with: [retries-with-backoff]
---

# Hedged requests

A hedged request asks two replicas for the same thing and takes
whichever answer comes first. It's a way to cut the slowest few percent
of requests, the [[tail-latency|tail]], without making every server
faster. The trick is in when you send the second copy.

## Why a second copy helps

A request is usually slow not because of the request itself but
because of interference on the machine serving it: a background job, a
garbage collection pause, a queue that happened to be long. If that's
the cause, the same request sent to another replica will probably be
fast. So:

1. Send the request to the replica you'd normally pick.
2. Wait. If no answer has come after a short delay, send the same
   request to a second replica.
3. Use whichever answer arrives first, and cancel the other.

![Timeline with three lanes: replica A, the client, replica B. The client sends a request to replica A, which is stuck behind other work. After waiting about the p95 latency, the client sends the same request to replica B, which answers quickly. The client takes that first answer and cancels the request on replica A.](img/hedged-requests-timeline.svg)

*A hedged request, sent after waiting about the p95 latency.*

## Hedge late, not immediately

Sending two copies of everything would double the load. The delay is
what keeps it cheap: send the copy only once the first request has been
outstanding longer than the p95 for that kind of request. Then only
about 5% of requests get a second copy, and those are the ones most
likely stuck in the tail.

It works well. In a Google test reading 1,000 keys spread across 100
BigTable servers, hedging after 10 ms cut the p99.9 for getting all
1,000 values from 1,800 ms to 74 ms, while sending just 2% more
requests.

## Tied requests

A hedge still lets both copies run if the first one was only queued,
not slow. **Tied requests** avoid that waste. The client sends the
request to two servers at once, each tagged with the other's name.
Whichever server starts working on it first tells the other to drop its
copy. A short delay between the two sends, about twice a network
message delay, keeps both from starting at the same moment when their
queues are empty. In Google's cluster file system this cut read latency
at the p99.9 by nearly 40%, for less than 1% extra disk work.

## In RPC libraries and proxies

- **[[grpc|gRPC]]** has a `hedgingPolicy` per method, as an alternative
  to a retry policy (a method gets one or the other). After
  `hedgingDelay` with no success it sends another copy, up to
  `maxAttempts` (capped at 5 by default on the client), and cancels the
  rest when one succeeds. The design document, at its latest revision,
  lists it as implemented in Java, .NET and Node, but not in Go or the
  C core.
- **Envoy** hedges only on a per-try timeout: when a try times out, it
  sends a retry without cancelling the slow one, and takes whichever
  good answer comes first.

## Where it gets tricky

**A hedge is a retry.** It runs your request twice, so it's only for
[[idempotency|idempotent]] operations. And when the whole system slows
down, every request crosses the hedge delay, so hedging adds load right
when there's least room for it. gRPC throttles hedges with the same
token count as [[retries-with-backoff|retries]]; see also
[[retry-budgets]].

**It assumes slowness is independent.** Hedging only helps when a slow
replica doesn't mean the others are slow too. If every replica sits
behind the same overloaded switch, or a garbage collection hits them
all at once, the copy is just as slow.

## What this means when you build

- Hedge reads that are safe to repeat, after about the p95 latency for
  that call, not after a fixed guess.
- Throttle hedges like retries, so an overload doesn't double your
  traffic.
- Make sure the losing copy really gets cancelled, or you pay for it
  anyway.
- Check your library: gRPC's hedging isn't in every language, and
  Envoy's only fires on a per-try timeout.

## Further reading

- [The Tail at Scale](https://www.barroso.org/publications/TheTailAtScale.pdf), Jeffrey Dean and Luiz André Barroso, CACM, 2013. Hedged and tied requests, why they work, and the BigTable and file-system results.
- [gRPC Retry Design (A6)](https://github.com/grpc/proposal/blob/master/A6-client-retries.md), Noah Eisen and Eric Gribkoff, gRPC. How gRPC's hedging policy works, and its limits.
- [HTTP routing](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/http/http_routing), Envoy docs. Envoy's hedging on per-try timeout.

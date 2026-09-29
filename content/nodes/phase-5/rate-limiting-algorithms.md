---
id: rate-limiting-algorithms
title: Rate limiting algorithms
depth: deep
phase: 5
note: >-
  Token bucket, leaky bucket, fixed and sliding windows, GCRA: what each
  allows through.
needs: [rate-limiting]
leads_to: [distributed-rate-limiting]
compare_with: []
---

# Rate limiting algorithms

A [[rate-limiting|rate limit]] like "50 requests per minute per API
key" sounds exact, but there are several ways to count it, and they let
different traffic through. They differ in how big a burst a client can
send at once, what happens at the edge of a window, how much memory
each client costs, and how easy the count is to share between servers.
The common ones are the fixed window, the sliding log, the sliding
window counter, the token bucket, and the leaky bucket, along with
GCRA, a leaky bucket that fits in one timestamp.

## Fixed window: a counter that resets

The simplest version keeps one counter per client per minute. The key
might be `key123:12:03`. Each request increments it; if it's over 50,
refuse. When 12:04 starts, a new counter starts at zero, and the old
one expires. That costs one number per client and one atomic increment
per request.

The trouble is the edges. The window resets at fixed times, so a
client can send 50 requests at 12:03:59 and 50 more at 12:04:00: 100
requests in two seconds, and neither window is over its limit. Spikes
like that get through at every reset.

A long window makes it worse. With 5,000 requests per hour, a buggy
script can burn the whole hour in a minute and then be locked out for
59 more. And a client that always runs at its limit hits you with a
fresh burst the moment each hour starts, so you need spare capacity
for that burst that sits idle the rest of the time.

## Sliding log: remember every request

The exact fix is to store the time of every request and, on each new
one, count how many fall in the last 60 seconds. There are no edges:
the window slides with the clock.

It costs memory and work in proportion to the limit. For 50 a minute
that's fine. For 5,000 an hour, you keep up to 5,000 timestamps per
client and scan them on every request.

## Sliding window counter: two numbers and an estimate

Cloudflare needed something close to the sliding log that cost as
little as the fixed window. Their answer keeps two fixed-window
counters, this minute and the previous one, and estimates how many
requests the sliding window holds:

![Two stacked panels. Top, fixed windows: 50 requests just before the minute boundary and 50 just after, each window within its limit of 50, but 100 requests in two seconds. Bottom, sliding window counter: the previous minute had 42 requests and the current minute has 18 so far, 15 seconds in. The sliding 60-second window covers the last 45 seconds of the previous minute and the first 15 of the current one. The estimate is 42 times 45 over 60 plus 18, which is 49.5, just under the limit of 50.](img/rate-limiting-algorithms-sliding-window.svg)

*Fixed windows let a double burst through at the boundary. The sliding window counter weights the previous window by how much of it still overlaps. Adapted from Julien Desgats, "How we built rate limiting capable of scaling to millions of domains" (Cloudflare, 2017).*

It's 15 seconds into the current minute, so the last 60 seconds
cover 45 seconds of the previous minute, three quarters of it. The
estimate is 42 × 0.75 + 18 = 49.5. One more request and the client is
over.

The estimate assumes the previous minute's requests were spread
evenly, which they rarely are. In practice it holds up well. On 400
million requests from 270,000 sources, Cloudflare found 0.003% of
requests wrongly allowed or refused, an average gap of 6% between the
estimated and real rate, and no client refused while below its limit.
It needs two numbers per client, and each request is a single
increment.

## Token bucket: an allowance that refills

A token bucket gives each client a bucket that holds up to *B* tokens
and refills at *r* tokens a second. Each request takes a token. No
token, no request.

Two numbers describe it, and they mean different things:

- **r, the rate,** is the long-run average a client can sustain.
- **B, the burst,** is how much it can save up. A client idle for a
  while can send *B* requests at once, then settles to *r*.

That matches how real clients behave: quiet, then a burst, then quiet.

Envoy's local rate limit filter is a token bucket too, set by
`max_tokens`, `tokens_per_fill` and `fill_interval`. When it's empty,
Envoy answers 429, and it can add a `Retry-After` equal to the seconds
until the next token arrives.

## Leaky bucket: one name, two ideas

"Leaky bucket" is used for two different things.

**As a meter,** it's a counter that goes up by one per request and
drains at the allowed rate. The bucket's size is the burst you'll
accept. If a request would overflow it, refuse. That's a token bucket
seen upside down: the water in the leaky bucket is the tokens missing
from the token bucket. Given the same rate and burst, they let exactly
the same traffic through.

**As a queue,** the extra requests wait in the bucket and leave at the
steady rate. This is what nginx's `limit_req` does. With
`rate=1r/s burst=5`, requests over the rate are *delayed* so they go
out one a second, and only requests beyond the burst of 5 are refused
(with 503 by default). Add `nodelay` and the burst is served at once
instead of spread out. Queuing smooths the load on your backend, but
turns excess traffic into latency.

A naive leaky bucket needs a background job to "drip" every bucket on
schedule, and if that job falls behind, clients get refused who
shouldn't be.

## GCRA: a leaky bucket in one timestamp

The Generic Cell Rate Algorithm comes from ATM networks, where it
decided whether each fixed-size cell was within its rate. It behaves
like a leaky bucket but needs no drip and stores one value per client:
a **theoretical arrival time** (TAT), when the next request would be due
if the client sent at exactly the allowed rate.

Two durations set it up:

- **T, the emission interval:** the gap between requests at the allowed
  rate. At 1 request a second, T = 1 s.
- **τ, the tolerance:** how far ahead of schedule a client may run,
  which is the burst allowance.

On each request at time `now`:

1. `new_tat = max(now, tat) + T`
2. If `now < new_tat − τ`, refuse. The client may retry after
   `(new_tat − τ) − now`.
3. Otherwise allow, and store `new_tat`.

Take T = 1 s and τ = 5 s, and a client that's been quiet. Its TAT is in
the past, so the first request sets TAT to now + 1 and is allowed. If
it fires more requests at the same instant, each pushes TAT another
second ahead: now + 2, now + 3, up to now + 5, all allowed. The sixth
would set TAT to now + 6, and now + 6 − 5 is still in the future, so
it's refused, with a retry-after of 1 second. Wait a second and one more
request fits.

![A time axis. Allowed case: the stored TAT sits a little after now; new TAT is TAT plus T; new TAT minus tau falls before now, so the request is allowed. Refused case: the stored TAT is far ahead of now; new TAT minus tau falls after now, so the request is refused, and the gap between now and new TAT minus tau is the retry-after.](img/rate-limiting-algorithms-gcra.svg)

*GCRA stores one timestamp per client. A request is allowed if the next allowed time, new TAT minus τ, has already passed. Adapted from Brandur Leach, "Rate Limiting, Cells, and GCRA" (2015).*

GCRA behaves like a leaky bucket, and so like a token bucket, with the
same rate and burst. What it adds: one number per client, no drip and
no refill step, and a retry-after that falls straight out of the
subtraction. The Go library Throttled implements it in one short
function, updating the stored TAT with compare-and-swap.

## Side by side

| Algorithm | State per client | Bursts | Window edges |
|---|---|---|---|
| Fixed window | 1 counter | Up to 2× the limit across a reset | Yes |
| Sliding log | Every timestamp in the window | Exact limit | None |
| Sliding window counter | 2 counters | Close to the limit (estimate) | Smoothed |
| Token bucket | Tokens + last update time | Up to *B*, then *r* | None |
| Leaky bucket (queue) | A queue | Delayed to the rate | None |
| GCRA | 1 timestamp | Up to the tolerance, then the rate | None |

## Where it gets tricky

**Counting on more than one server.** nginx keeps its `limit_req`
counts in shared memory on one machine. Envoy's local limit is per
Envoy process by default. With ten proxies, each counting on its own, a
client whose requests spread across them gets up to ten times the
limit. Cloudflare hit this and couldn't use one central counter either:
a round trip to one place in the world for every request is too slow,
and keeping that one place available is a hard problem of its own. Their way out was
[[anycast]], which sends one client's traffic to the same data centre,
plus a shared counter store inside each data centre. Sharing counts
across servers is [[distributed-rate-limiting]].

**Read, decide, write must be atomic.** Two requests that both read "49"
and both write "50" have let 51 through. That's a
[[race-condition|race condition]]. Use a single atomic operation, such
as an increment, or compare-and-swap and retry, as Throttled does. Cloudflare picked the sliding window
counter partly because it needs only INCR, and the leaky bucket's
several steps couldn't be made atomic on memcached.

**Cloudflare also counts after the fact.** Counting in the path of every request
would slow every request down a little, and a large attack could flatten the
counter store. So their counting runs asynchronously. Once a client is
over, a "mitigate this client until time X" flag goes out, and each
server caches it in memory, so it doesn't even ask the store again for
that client until the mitigation ends.

**Clocks.** GCRA and the token bucket compare timestamps. If several
servers use their own clocks, [[clock-skew]] between them can refuse a
client that's within its limit. Use one clock, such as the shared
store's own time.

**Memory has a ceiling.** nginx keeps 64 bytes per client on 32-bit
platforms and 128 bytes on 64-bit, so one megabyte holds about 16,000 or
8,000 clients. When the zone fills, it drops the least recently used
state, and that client starts from zero.

**None of these limits concurrency.** They count requests per unit of
time. A cap on requests *in flight*, the concurrency limit from
[[rate-limiting]], is a different counter: increment when a
request starts, decrement when it ends.

## What this means when you build

- Default to a token bucket or GCRA per client, with a rate and a
  burst. Pick GCRA if you want one stored number and a free
  retry-after.
- Use a sliding window counter if your store only gives you increments,
  and you can live with an estimate.
- Avoid a plain fixed window for anything expensive: the double burst at
  each reset is real.
- Make each check atomic, and use one clock.
- Decide whether each server counts alone (simple, but the limit
  multiplies) or they share a store (accurate, but one more network
  call).
- Queue excess requests only if added latency is better than a 429 for
  your clients.

## Further reading

- [How we built rate limiting capable of scaling to millions of domains](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/), Julien Desgats, Cloudflare, 2017. Fixed windows, logs and leaky buckets compared, the sliding window counter with measured accuracy, and counting at the edge.
- [Rate Limiting, Cells, and GCRA](https://brandur.org/rate-limiting), Brandur Leach, 2015. From naive buckets to the leaky bucket to GCRA, with the timeline diagrams.
- [throttled/rate.go](https://github.com/throttled/throttled/blob/master/rate.go), Throttled authors. A short, readable GCRA in Go.
- [Module ngx_http_limit_req_module](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html), nginx docs. The queuing leaky bucket, `burst`, `nodelay`, and the memory per client.
- [Local rate limit](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/local_rate_limit_filter), Envoy docs, 1.40.0-dev. A token bucket in a proxy, counted per process.
- [Leaky bucket](https://en.wikipedia.org/wiki/Leaky_bucket), Wikipedia. Untangles the two algorithms called "leaky bucket" and shows the meter is a mirror image of the token bucket.

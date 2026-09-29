---
id: rate-limiting
title: Rate limiting
depth: short
phase: 5
note: >-
  Capping how much each client can send, where to enforce it, and
  telling the client with 429 and Retry-After.
needs: [http-semantics]
leads_to: [rate-limiting-algorithms, api-gateway]
compare_with: [graphql, load-shedding]
---

# Rate limiting

Rate limiting caps how much each client can ask of your API in a given
time: 100 requests a minute per [[api-keys|API key]], say. It keeps one client's
runaway script, traffic spike or attack from using up capacity that
everyone else needs. When a client goes over, you refuse the extra
requests and tell it so, with a 429 status and a hint about when to come
back.

## Three decisions: who, what, how much

Every rate limit is a rule of the form "this key may use this much of
this unit per this window".

**Who is "a client".** [[http-semantics|HTTP]] leaves it to you. You can key the limit on
an API key or account, a logged-in user, a session cookie, or the
client's IP address. Limits are often stacked, too: 10 a second, and
also 60 a minute, and also 1,000 an hour, so that short bursts and long
steady use are both capped. You can also count per endpoint, per server,
or across the whole service.

**What to count.** Usually requests. But a request to list a page of
results and a request to generate a big report don't cost you the same.
You can count bytes instead, or cap requests *in flight* rather than
requests per second. Stripe runs both kinds. Its main limiter allows
each user N requests a second with short bursts above that. A second
one caps each user at 20 requests in progress at once, which protects
its most expensive endpoints. Clients that hammer a slow endpoint and
retry on timeouts make it slower still, and a concurrency cap stops
that.

**How to count.** "100 a minute" can be counted in several ways that
disagree about bursts and window edges. That's
[[rate-limiting-algorithms]].

## Telling the client: 429 and Retry-After

RFC 6585 (2012) added a status for this: **429 Too Many Requests**.
The response should say what happened, and may carry a `Retry-After`
header saying how long to wait. A 429 must not be [[http-caching|cached]].

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{"title": "Too many requests", "detail": "Limit is 100 per minute per API key."}
```

A good client reads `Retry-After` and waits at least that long, and
otherwise backs off with jitter ([[retries-with-backoff]]). Make the
message actionable, too: tell the client which limit it hit.

It helps to tell clients about the limit *before* they hit it. Many
APIs send headers like `X-RateLimit-Limit`, `X-RateLimit-Remaining` and
`X-RateLimit-Reset`, but they aren't standard, and the same names mean
different things at different vendors. An IETF draft (version -11 when
this was written) defines two standard headers instead:

```http
RateLimit-Policy: "perminute";q=100;w=60
RateLimit: "perminute";r=12;t=41
```

The first says the policy: a quota of 100 in a 60-second window. The
second says what's left: 12 requests within the next 41 seconds. The
window is given as seconds, not a clock time, so client and server
clocks don't need to agree, and clients aren't all told to come back at
the same instant (a [[thundering-herd]]). If a response has both these
headers and `Retry-After`, `Retry-After` wins.

## A rate limiter is not a load shedder

A rate limiter decides per client: *you* have sent too much. A load
shedder decides from the state of the whole system: *we* are
overloaded, so drop the least important work, whoever sent it. Stripe
runs both. Its load shedders reserve a share of capacity for critical
requests (creating a charge) and turn away the rest (listing charges)
with 503 when the fleet is busy. That's [[load-shedding]], and it
rarely fires, mostly during incidents. Stripe's request rate limiter,
by contrast, fires all the time.

The status codes follow the same line: 429 for "you, slow down", 503
for "the service can't take this right now".

## Where it gets tricky

**The limiter can take you down.** A rate limiter sits in front of every
request. If its data store is down or its code throws, requests must
still go through. Stripe's rule is to fail open.

**Rolling out a limit is risky.** A limit set from a guess will block
some real customer's normal traffic. Stripe runs new limiters in dark
mode first, logging what they would block, and keeps a switch to turn
each one off.

**429 costs something too.** When one party floods you, answering every
request with a well-formed 429 still uses resources. You're allowed to
just drop connections instead; 429 isn't required.

**Proxies spend quota.** A proxy between client and server may retry a
request on its own, using up quota the client didn't know it spent.

**Counting failed logins can leak.** If 401 and 403 responses count
against a quota that's shared or visible, one client can probe it to
learn about another user's traffic.

**The numbers are hints.** A client with 12 requests "remaining" can
still be refused if the server is overloaded. Remaining quota isn't a
promise.

## What this means when you build

- Decide the key (API key, user, IP), the unit (requests, bytes, in
  flight) and the windows before choosing an algorithm.
- Return 429 with a `Retry-After` and a body that names the limit. Don't
  cache it.
- Fail open, dark-launch new limits, and alert on how often each one
  fires.
- Keep per-client limits (429) and system overload (503,
  [[load-shedding]]) separate.
- Enforce once, as early as possible, often in an [[api-gateway]]. With
  many servers, decide whether each counts on its own or they share
  counts ([[distributed-rate-limiting]]).

## Further reading

- [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585), M. Nottingham and R. Fielding, IETF, 2012. Section 4 defines 429, and section 7.2 when not to use it.
- [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters), Paul Tarjan, Stripe, 2017. Four limiters used in production, the line between rate limiting and load shedding, and how to roll them out safely.
- [RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/), R. Polli, A. Martinez and D. Miller, IETF, draft -11. The proposed standard headers, and a survey of the non-standard ones in use.

---
id: long-polling
title: Long polling
depth: short
phase: 5
note: >-
  A request the server holds open until it has something to send back.
  Push over plain HTTP.
needs: [http-semantics]
leads_to: []
compare_with: [server-sent-events, websockets, realtime-sync]
---

# Long polling

Long polling is a way to push data from a server over plain
HTTP. The client sends a request, and the server doesn't answer until
it has something to say or a wait time runs out. As soon as the answer
arrives, the client asks again, so there's nearly always one request
waiting on the server that it can answer the moment something happens.
You'll meet it in browsers and in service registries like Consul.

## The loop, step by step

Plain [[http-semantics|HTTP]] is request and response: the server can't
send anything the client didn't ask for. Short polling, asking
"anything new?" every few seconds, mostly gets "no", and the fresher you
need the data, the more empty round trips you pay for.

Long polling moves the waiting to the server:

1. The client sends a request, often with a marker for what it has
   already seen: `GET /updates?index=41`.
2. The server doesn't answer. It parks the request until there's
   something newer than 41, or until a timeout.
3. When event 42 happens, the server sends a complete, ordinary
   response with it.
4. The client sends the next request straight away, now with
   `index=42`.

If nothing happens before the timeout, the server sends a normal
response that says "no change", and the client asks again.

![Sequence diagram between a client and a server. The client sends GET /updates?index=41; the server holds the request open until event 42 happens, then answers 200 OK with event 42. Event 43 happens before the client's next request arrives, so it waits. The client polls again at once with index=42 and gets event 43 straight back. It polls with index=43; nothing happens, the wait time runs out, and the server answers 200 OK with no change. The client polls again.](img/long-polling-timeline.svg)

*The long polling loop, with an event that lands in the gap between two requests.*

The marker is what makes the loop safe. Consul puts an
`X-Consul-Index` header on each response, and the client passes it
back as `?index=`. So an event that happens while no request is waiting
(event 43 in the figure) isn't lost: the next request shows the client
is behind, and the server answers at once.

## What it costs

**Latency.** On average, an event reaches the client in about one
network transit, because a request is usually already waiting. The
worst case is an event that lands just after a response went out: it
waits for the response to arrive, the next request to come back, and
then its own response. That's over three transits.

**Headers.** Every event travels in a full HTTP response, and every
poll is a full HTTP request. For small, frequent messages the headers
can outweigh the payload. Under load this partly fixes itself: events
pile up while the client is between requests, and the next response
carries them all as a batch.

**Held requests.** Each waiting client holds a connection and an open
request on your server and every proxy in between. With a thread per
request, that's a thread per idle client. On an
[[event-loop]] server, a parked request costs little more than an
ordinary one. [[reverse-proxy|Reverse proxies]] that share a small pool
of connections to the backend can be starved by long polls, holding up
every other request behind them.

## Choosing the wait time

The timeout has to fit under the shortest idle timeout of anything on
the path. Too long, and a proxy cuts the request off with a 504, or the
server itself answers 408. RFC 6202 (2011), which documents the
pitfalls, found 30 seconds a safe value and 120 seconds workable in
some tests. Consul's API allows up to 10 minutes and
defaults to 5.

Consul also adds up to wait / 16 of random extra time to each wait,
so many clients that started waiting together don't all wake up and
reconnect in the same instant (the [[thundering-herd]] problem).

Set `Cache-Control: no-cache` on long poll requests and responses, so
no [[http-caching|cache]] on the way answers a poll with an old
response.

## Where it gets tricky

**A response doesn't mean a change.** A timeout, or a write that left
the data the same, still wakes the client. Compare the new state with
what you had before acting on it.

**Busy loops.** If the data changes constantly, or the server returns
an index the client already has, "poll again at once" turns into a
tight loop that burns CPU on both sides. Consul's fixes: reset the
index to 0 if it ever goes backwards (a snapshot restore can do that),
and put the loop behind a small token bucket (burst of 2) so it runs
freely when changes are rare and drops to steady polling when they
aren't. A fixed sleep on every loop delays every update even when
nothing is wrong. Token buckets are in [[rate-limiting-algorithms]].

**Browser connection limits.** Each tab's long poll holds one of the
few [[http-1-1|HTTP/1.1]] connections a browser allows per server (6 or
8 when RFC 6202 was written), and a browser's JavaScript can't see or
share them. The ideal is one long poll per browser, shared by all tabs,
but browser security rules make that hard.

**It's being replaced where it can be.** Consul 1.10 added a streaming
backend that replaces long polling for some endpoints and sends much
less data. Long polling survives because it works through anything
that handles HTTP, and each exchange is an ordinary request and
response.

## What this means when you build

- Put a version or index in every response and require it in the next
  request, so nothing that happens between polls gets lost.
- Keep the wait under every idle [[timeouts|timeout]] on the path, and
  add jitter to it.
- Serve long polls from a server that doesn't tie a thread to each
  waiting request.
- Rate limit the client loop so a burst of changes can't turn it into
  a busy loop.
- For many small messages, or two-way traffic, use
  [[server-sent-events]] or [[websockets]]. For shared documents
  edited live, see [[realtime-sync]].

## Further reading

- [RFC 6202](https://www.rfc-editor.org/rfc/rfc6202), Salvatore Loreto, Peter Saint-Andre, Stefano Salsano, Greg Wilkins, IETF, 2011. Long polling and HTTP streaming defined, with their latency, overhead, timeout, proxy and caching problems.
- [Blocking Queries](https://developer.hashicorp.com/consul/api-docs/features/blocking), HashiCorp, Consul v2.0.x docs. A production long polling API: the index, the wait cap and jitter, and the client-loop bugs to avoid.

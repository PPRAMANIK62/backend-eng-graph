---
id: distributed-tracing
title: Distributed tracing
depth: deep
phase: 14
note: >-
  Following one request through many services with spans and propagated
  context.
needs: [observability, http-semantics, structured-logging]
leads_to: [trace-sampling, opentelemetry, exemplars]
compare_with: []
---

# Distributed tracing

Distributed tracing follows one request through every service it
touches and records how long each step took, as a tree of timed pieces
of work called spans. The trick that makes it work is small: every
service passes a trace id and its own span id along with each call it
makes, so the pieces recorded on different machines can be put back
together. It's the request-scoped one of the three signals in
[[observability]], and it's how you find out which of ten services made
a request slow.

## One slow request, many services

A checkout request comes in through a proxy. The proxy calls the API
service. The API calls a payment service and an inventory service, and
the payment service queries a database. The user waited four seconds.
Which part was slow?

Each service's own [[metrics]] show its latency, but not how the
latencies add up for this request. The logs from five services are in
five places. And the engineer asking the question probably doesn't
know every service involved, doesn't own most of them, and can't tell
whether a slow service was slow because of this request or because of
someone else's traffic on the same machine. Google described exactly
this problem for web search, where one query fans out to many services
across thousands of machines, and built Dapper to answer it.
OpenTelemetry, the current open standard, uses the same model of spans
and ids.

## Spans, trace ids and parent ids

A **span** is one unit of work: a name, a start time, an end time, and
whatever you attach to it (attributes such as the HTTP route, events at
points in time, a status). In a typical setup there's a span for each
incoming request a service handles and for each outgoing call it
makes.

Three ids tie spans together:

- **Trace id.** Shared by every span in the request's tree. It names
  the whole trace.
- **Span id.** Unique to this span.
- **Parent id.** The span id of the span that caused this one. The
  first span, the **root span**, has none.

Put every span with the same trace id in a tree by parent id, lay them
on a time axis, and you get the waterfall view that tracing tools show:

![Top: the request passes proxy, API, payment and database, with a second call from API to inventory. Each arrow carries a traceparent header. The trace id part, 4bf92f35 and so on, is the same on every arrow; the parent id part changes at each hop to the span id of the caller. Bottom: the same request as a waterfall on a time axis. The proxy's root span covers the whole request. The API span sits under it. Under the API, the payment span and the inventory span run in parallel; the inventory span is short. Under payment, the database span takes most of the request's time and is highlighted.](img/distributed-tracing-waterfall.svg)

*One trace: the header on the wire and the tree it builds. Layout adapted from Sigelman et al., "Dapper" (Google, 2010), figures 1 and 2; header format from the W3C Trace Context spec.*

The answer to "what was slow" is now visible: the database call under
the payment service holds most of the time. The inventory call ran in
parallel and didn't matter.

## Passing the context along

For this to work, every service has to know, when it starts a span,
which trace it belongs to and which span is its parent. That small
bundle, trace id, current span id and a few flags, is the **trace
context**, and moving it around is called propagation. It has to
happen at two levels.

**Inside a process,** the current context follows the work. Dapper
kept it in thread-local storage, and made sure every callback carried
the context of the code that created it, so work handed to a thread
pool stayed in the right trace. Modern libraries do the same with
whatever the language offers for request-scoped values.

**Between processes,** the caller writes the context into the request
(inject) and the receiver reads it back out (extract). For HTTP, the
standard is the W3C Trace Context spec (a Recommendation since 2020,
revised in 2021). It defines a `traceparent` header (see
[[http-semantics]] for how headers work):

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                └ flags (01 = sampled)
             │  └ trace id (16 bytes, hex)       └ parent id (8 bytes, hex)
             └ version
```

Here's what happens at each hop:

1. The proxy gets a request with no `traceparent`. It starts a new
   trace: a fresh random trace id and a span id for its own span.
2. When it calls the API, it sends `traceparent` with that trace id and
   its own span id as the parent id.
3. The API extracts the header, starts a child span in the same trace
   with the proxy's span as parent, and when it calls payment, it sends
   the same trace id with *its* span id as the new parent id.
4. And so on down the tree.

The trace id never changes; the parent id changes at every hop. A
second header, `tracestate`, carries vendor-specific data alongside,
which lets different tracing products work on the same trace.

The spec asks every hop to at least forward both headers, even if it
records nothing itself. A proxy or library in the middle that drops
them splits one trace into two unrelated ones.

Work that isn't a direct call needs care too. When a request puts a
job on a queue ([[message-queue]]), the consumer might run long after
the request that queued it has finished. OpenTelemetry models that with producer and consumer spans, and
with **links**, which connect a span to spans in another trace when a
parent-child relationship doesn't fit.

## Where the instrumentation lives

Tracing only works if nearly every service takes part, and it breaks
if each team has to remember to add it. Dapper got around this by
putting the instrumentation in a few shared libraries: the RPC
framework, the threading library, the callback library. Any program
built on them was traced without its authors doing anything. Teams
could add their own annotations to spans, with a cap on how much each
span could hold.

OpenTelemetry follows the same idea: instrumentation libraries for
common frameworks handle propagation for you, and you add attributes
and extra spans where the defaults aren't enough. [[opentelemetry]] covers the API and the wire
format.

## Getting spans to storage

Spans are recorded where the work happens, on many machines, and put
together later. Dapper wrote spans to local log files, had daemons
collect them, and stored each trace as one row in Bigtable; the median
delay from span to storage was under 15 seconds.

It collected out of band, apart from the request, on purpose. Sending
trace data back inside responses would change the traffic it's
measuring: traces can have thousands of spans while the responses near
the root are often small. And not every call nests neatly inside its
parent; some middleware answers its caller before its own backends
have finished.

## What it costs

In Dapper's measurements on a 2.2 GHz x86 server (2010), creating and
ending a root span took 204 ns and any other span 176 ns, and each
stored span was about 426 bytes. The real cost was logging every
request: on a web search cluster, tracing every request raised average
latency by 16.3%. At one request in 16 and below, the effect was lost
in measurement noise, and one in 1,024 still gave enough data for
high-volume services.

So tracing systems keep only some traces, and decide which by the
trace id so that every service keeps or drops the same ones. The
`sampled` flag in `traceparent` carries that decision downstream. How
to choose, and what each method misses, is [[trace-sampling]].

## Where it gets tricky

**Clocks on different machines disagree.** A span's start and end come
from its own machine's clock, so a child can appear to start before
its parent. Dapper used the fact that a request is always sent before
it's received, and the reply sent before it's received, to bound the
error. See [[clock-skew]].

**Batching blames the wrong request.** If a service buffers several
requests and does one write for all of them, the write lands in one
request's trace, and that request looks responsible for work done for
everyone.

**A trace shows where, not always why.** A span can be slow because
other requests were queued ahead of it. The trace shows the wait but
not the queue. You need metrics or annotations about queue length to
explain it (see [[queueing-theory]]).

**Trace headers from outside can't be trusted.** A client can send a
forged `traceparent` to mess up your trace data, or set the sampled
flag on every request so you trace, store and pay for all of them. The
spec treats the flag as a hint, not a command, and allows restarting
the trace at a trust boundary. Going the other way, ids and vendor
data you send to third parties can reveal your internal layout.

**Headers are not a place for data.** The spec forbids personal data in
`traceparent` and `tracestate`. OpenTelemetry's baggage can carry
arbitrary key-value pairs along with the trace, and gets logged and
forwarded to places you didn't expect; keep credentials and personal
data out of it. Dapper went as far as never recording request
payloads, only method names.

**The format is still changing a little.** Level 2 of Trace Context, a
Candidate Recommendation Draft (2024), adds a flag saying the trace id
is random, which lets tools sample on the id with confidence.

## What this means when you build

- Use a tracing library that instruments your HTTP server, clients and
  database driver, so spans and propagation come for free.
- Make sure every hop forwards `traceparent`: proxies, gateways, queue
  producers and consumers, thread pools.
- Put the trace id in every log line, so you can go from a trace to its
  logs and back (see [[structured-logging]]).
- Start a fresh trace, or at least ignore the sampled flag, for
  requests from outside your system.
- Add attributes when you create a span, so the sampler can see them.

## Further reading

- [Dapper, a Large-Scale Distributed Systems Tracing Infrastructure](https://research.google/pubs/dapper-a-large-scale-distributed-systems-tracing-infrastructure/), Benjamin H. Sigelman et al., Google, 2010. The paper most tracing systems descend from: spans, trace trees, library instrumentation, out-of-band collection, overhead numbers.
- [Trace Context](https://www.w3.org/TR/trace-context/), W3C Recommendation, 2021. The `traceparent` and `tracestate` headers, how each hop updates them, and privacy and security rules.
- [Traces](https://opentelemetry.io/docs/concepts/signals/traces/), OpenTelemetry docs. What a span holds in OpenTelemetry: span context, attributes, events, links, status and kind.
- [Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/), OpenTelemetry docs. Injecting and extracting context, and the security side of accepting and sending it.

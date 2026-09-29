---
id: timeouts
title: Timeouts
depth: short
phase: 5
note: >-
  Every network call needs a limit, and picking one is harder than it
  looks. Connect, read and total timeouts.
needs: [network-latency]
leads_to: [retries-with-backoff, failure-detection, deadline-propagation, circuit-breakers]
compare_with: [tcp-keepalive]
---

# Timeouts

A timeout is the longest your code will wait for a call to another
machine before it gives up. Without one, a single slow or vanished
server can make your process wait forever, holding a thread, a
connection and memory the whole time. Every network call needs one, and
the hard part is choosing the number.

## Waiting costs something

Say your API calls a payments service. Normally it answers in a few
milliseconds. Then one day it stops answering, without closing the
connection. Each request to your API now parks a worker on a call that
will never return. Workers, memory, connections, ephemeral ports,
[[file-descriptor|file descriptors]]: whatever is limited runs out, and
your API goes down even though nothing in it is broken.

A timeout caps that cost. Servers need them on their clients too: a
client that sends its request very slowly, or never reads the answer,
holds a connection and a file descriptor for as long as you let it.

## One call, several things to wait for

An HTTP call isn't one wait. It's a string of them, and each can hang:

![A timeline of one HTTP call split into phases: DNS lookup, TCP connect, TLS handshake, sending the request, waiting for the response headers, and reading the body in chunks. Below it, bars show what each timeout covers: the connect timeout spans the TCP connect, the TLS handshake timeout the handshake, the response header timeout the wait for headers, an idle timeout the gap between body reads, and the total timeout the whole call. A note says some libraries' timeouts leave out DNS or the TLS handshake.](img/timeouts-call-phases.svg)

*The phases of one HTTP call and the timeouts that can cover them. Adapted from Filippo Valsorda, "The complete guide to Go net/http timeouts" (Cloudflare, 2016).*

Libraries offer some mix of three kinds:

- **Connect timeout.** How long to wait for the connection to open,
  which means the [[tcp-handshake|TCP handshake]]. Go also has a
  separate one for the TLS handshake.
- **Read or idle timeout.** How long to wait for the next piece of the
  response. It resets each time data arrives, so a slow but steady
  download keeps going.
- **Total timeout.** One budget for the whole call, from connecting to
  reading the last byte. In Go, `http.Client.Timeout` works this way,
  and it includes time spent following redirects.

A total timeout doesn't move when data arrives. That suits a JSON API,
where the whole answer should come back quickly. It's wrong for a
stream or a large download, which can take minutes while making
progress the whole time; those want an idle timeout.

## How long is long enough

Too long and the timeout barely helps. Too short and healthy calls
time out, each false timeout usually becomes a retry, and a small rise
in the other service's latency can push most calls over the limit at
once. Everything retries, and a slowdown becomes an outage.

A good starting point for calls inside one cloud region, used at
Amazon: decide what fraction of calls you're willing to time out by mistake, say
0.1%, and set the timeout at the matching percentile of the other
service's latency, p99.9 in that case (see [[latency-percentiles]]).
Two caveats come with it:

- It doesn't work when clients are far away, across the internet. The
  [[network-latency|network's own delay]] has to be added, for the
  worst reasonable path.
- When a service's latency is very tight, with p99.9 close to p50, a
  tiny slowdown crosses the line for many calls at once. Add some
  padding.

A timeout far above normal latency fails differently. In an example
from Google's SRE book, a frontend with 1,000 threads serves 1,000
requests a second at 100 ms each. Then 5% of requests start hanging
until a 100-second deadline. They would need 5,000 threads, the
frontend runs out, and it serves about 19.6% of requests instead of
95%. Failing fast when a backend is known to be down avoids this.

## Where it gets tricky

**The default is often no timeout.** When the Cloudflare guide was
written (Go 1.7), Go's `http.Get` and its convenience server functions
had none. Check what your library does if you set nothing.

**A timeout may not cover what you think.** Some implementations leave
out DNS resolution or the [[tls|TLS]] handshake. Linux's `SO_RCVTIMEO`
isn't an end-to-end limit on a call. Amazon had a timeout of about 20 ms that also covered opening a
new secure connection. Connections were normally reused, so it rarely
fired. Right after a deployment, new servers needed new connections,
the handshake took longer than 20 ms, and a few calls timed out. The
fix was to open connections when the process starts, before it takes
traffic.

**A timeout says nothing about what happened on the other side.** The
call may have failed, or it may have worked and the answer got lost.
If you retry, the other side may do the work twice. That's why retries
need [[idempotency]].

**TCP keepalive is a different tool.** [[tcp-keepalive|Keepalive
probes]] notice a dead peer on an idle connection; they don't limit a
request in progress. You want both.

**A timeout is a guess.** When one fires, you don't know if the server
is dead, slow or cut off. Deciding a machine is down is
[[failure-detection]].

## What this means when you build

- Put a timeout on every network call, even between processes on one
  machine. Prefer a well-tested client's timeouts, and check which
  phases they cover.
- Start from the other service's high percentile and your acceptable
  false-timeout rate, not from a round number.
- Use a total timeout for request-response calls and an idle timeout
  for streams.
- Pass what's left of the budget down to the calls a request makes
  ([[deadline-propagation]]).
- After a timeout, retry only with [[retries-with-backoff|backoff and a
  limit]], and only if the call is safe to repeat. A backend that keeps
  timing out may need a [[circuit-breakers|circuit breaker]].

## Further reading

- [Timeouts, retries, and backoff with jitter](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf), Marc Brooker, Amazon Builders' Library, 2019. Picking a timeout from latency percentiles, its pitfalls, and the 20 ms story.
- [The complete guide to Go net/http timeouts](https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/), Filippo Valsorda, Cloudflare, 2016. Every phase of an HTTP call and which timeout covers it; deadlines vs idle timeouts. Written for Go 1.7.
- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google SRE book, 2016. Picking deadlines, and the bimodal latency example of a deadline set far too high.

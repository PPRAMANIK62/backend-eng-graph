---
id: backpressure
title: Backpressure
depth: deep
phase: 4
note: >-
  Making a fast producer slow down to what the consumer can handle,
  instead of piling up.
needs: [event-loop, tcp-flow-control]
leads_to: [bounded-queues, load-shedding]
compare_with: [stream-processing]
---

# Backpressure

Backpressure is how a slow consumer makes a fast producer slow down to
its pace, instead of letting data pile up in between. Every server has
somewhere data can build up: a socket buffer, a reply buffer, a job
queue. Backpressure decides whether that pile has a ceiling, or grows
until memory runs out.

## A client that reads slowly

Take the phase 4 lab server, which speaks [[resp-protocol|RESP]]. A
client pipelines thousands of `GET` commands but reads the replies
slowly, maybe because it writes each one to a slow disk first. The
server can compute replies much faster than the client takes them.
Follow the replies from the server to the client, and watch what
happens as they back up:

![Four boxes left to right: the server loop (reads commands, writes replies), the server kernel's send buffer, the client kernel's receive buffer, and the client app, which reads replies slowly. Replies flow right. Numbered steps flow left: 1, the client's receive buffer fills and its window closes to 0; 2, the server's TCP stops sending and its send buffer fills; 3, write() blocks or returns EAGAIN; 4, the server's choice. Below, the three choices: backpressure (stop reading commands, so the client's own sends block and memory stays bounded), buffering replies in the process (memory grows as long as the client lags), or shedding (drop the data or close the connection, as Redis does to a Pub/Sub client past its output buffer limit).](img/backpressure-chain.svg)

*One slow reader, and how the "slow down" travels back to the server.*

1. **The client's receive buffer fills.** The client's kernel holds
   incoming bytes until the app calls `read`. The window it advertises
   is its free buffer space, so as bytes build up the window closes,
   and at zero the server's TCP stops sending new data (apart from
   small probes to see if it has reopened). That's [[tcp-flow-control]].
2. **The server's send buffer fills.** The server's kernel can't send,
   so bytes the server writes stay in its send buffer.
3. **`write` stops accepting.** When the send buffer is full, `write`
   (or `send`) blocks a blocking socket. On a
   [[non-blocking-io|non-blocking]] socket it fails at once with
   `EAGAIN`.
4. **The server has to choose.** This is the point where backpressure
   either continues or stops.

Up to step 3 the kernel did everything. Step 4 is your code, and there
are only three things it can do.

## Three answers to "too much"

**Slow the producer down (backpressure).** The server stops reading
new commands from this client until it can write the replies it owes.
Now the client's commands pile up in the server's receive buffer, the
server's window closes, and the client's own `write` calls block. The
pressure has travelled all the way back to the program that caused it.
Nothing grew without limit anywhere: every buffer on the way is a fixed
size.

**Buffer.** The server keeps reading commands and holds the replies in
its own memory, to send later. This is fine for a short burst. For a
client that's slow for minutes, the buffer grows for minutes.

**Drop.** Throw data away or close the connection. That's
[[load-shedding]]: the producer isn't slowed, the excess is refused.

There's no fourth option. A queue in between only picks when you find
out: it holds a burst, but under overload that lasts it fills and you're
back to choosing between slowing down and dropping. An unbounded queue
chooses by running out of memory. A queue added to fix overload makes
failures rarer, and bigger when they come.

## Backpressure on an event loop

With a [[thread-per-connection|thread per connection]], backpressure comes almost free: the
thread's `write` blocks, so it stops reading, so the client's sends
block. With an [[event-loop]] nothing blocks, and you have to build it
by hand.

Node.js streams show the pattern clearly. A writable stream has an
internal buffer and a threshold called `highWaterMark`. `write()`
returns `true` while the buffer is under it and `false` once it's
reached. The producer is supposed to stop on `false` and wait for a
`'drain'` event, which fires when the buffer has emptied, then resume.
`pipe()` does this for you, so memory per pipe stays bounded.

The common mistake is the one-liner that ignores the return value:
`readable.on('data', data => writable.write(data))`. Every chunk goes
into the writable's buffer whether it's ready or not. The Node.js
project tried exactly this, patching `write()` to always return `true`
while gzipping a file of about 9 GB. Run time barely changed, but peak
memory went from about 88 MB to about 1.5 GB, and the garbage
collector worked far harder.

In an epoll server the same rule reads: when a connection's outgoing
buffer is above your high-water mark, stop watching that connection
(or its source) for readable events; when it drains below a low-water
mark, watch again. That's where [[io-multiplexing]] meets backpressure.

## Pull instead of push

Another way to get backpressure is to never push more than was asked
for. In the Reactive Streams specification, a subscriber calls
`request(n)` to ask for n more items, and a publisher must never
deliver more than the total requested.
The subscriber knows how many it asked for and how many it has
processed, so it knows exactly how many can still arrive, and its
buffer can be sized to match.

Requesting one item at a time works like stop-and-wait: one round trip
per item. Requesting many at once, and asking for more before the
buffer runs dry, keeps data flowing without waiting on each round trip.
If this sounds like TCP's receive window, it is the same idea: credit
granted by the receiver, spent by the sender.

A source that can't be slowed, such as clock ticks or mouse movement,
still has to respect the demand: the publisher has to buffer or drop
to stay within what was requested. Backpressure only works if the
producer can wait.

## When you can't push back

Some producers can't wait. Redis Pub/Sub is a clear case: one
publisher, many subscribers. If one subscriber reads slowly, slowing
the publisher would punish every other subscriber. So Redis buffers
replies per client, and caps the buffer. For Pub/Sub clients the
default is a hard limit of 32 MB and a soft limit of 8 MB held for 60
seconds; past either, Redis closes the connection. That's shedding,
chosen on purpose.

For normal clients Redis sets no limit by default, because most
clients send one command and wait for the reply. A client that
pipelines without reading breaks that assumption, so pipeline in
batches (see [[resp-protocol]]). Since Redis 7.0 there's also
`maxmemory-clients`, a cap on memory across all clients that
disconnects the biggest first. It's off by default.

## Where it gets tricky

**Slowness is backpressure you didn't design.** In most systems the
only backpressure is that things get slow: a call takes longer, so the
caller sends less. That slowness is often what keeps the whole stack
alive. Adding a queue to make the slow part "fast" removes the signal
and hides the overload until the queue overflows.

**Backpressure moves the problem, it doesn't remove it.** Each hop
pushes back to the one before, until it reaches something that can't
wait: a user, a sensor, a publisher. There, someone has to drop or
reject. Designing backpressure means deciding where that edge is.

**Both sides can wait on each other.** Suppose a client writes all its
commands before reading any replies, and the server stops reading
because it can't write. The server waits for the client to read, the
client waits for the server to read. With large enough batches that's a
[[deadlock]] between two correct programs. Reading and writing at the same
time, or pipelining in bounded batches, avoids it.

**A threshold isn't a limit.** Node's `highWaterMark` only says when
`write()` starts returning `false`. Code that keeps writing anyway
still buffers without bound. The default also changed: Node 22 raised
it from 16 KiB to 64 KiB for byte streams (outside Windows), so older
guides quote the old number.

## What this means when you build

- Know every buffer between your input and your output, and give each
  one a limit ([[bounded-queues]]).
- On an event loop, stop reading from a source while its destination is
  over a high-water mark, and resume on drain.
- Decide where pressure stops and turns into rejection, and make that
  rejection fast and visible.
- Read replies while you pipeline, or pipeline in bounded batches.
- In tests, add a slow reader and watch the server's memory. If it
  grows for as long as the reader lags, you have a buffer, not
  backpressure.

## Further reading

- [Backpressuring in Streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams), Node.js docs. What goes wrong without backpressure, with a memory benchmark, and the `write()`/`'drain'` pattern.
- [Stream](https://nodejs.org/api/stream.html), Node.js v26 API docs. What `highWaterMark` does and doesn't promise, and the current defaults.
- [Reactive Streams for the JVM](https://github.com/reactive-streams/reactive-streams-jvm/blob/master/README.md), Reactive Streams, 1.0.4. Demand-based backpressure with `request(n)`, and bounded buffers by design.
- [Queues Don't Fix Overload](https://ferd.ca/queues-don-t-fix-overload.html), Fred Hebert, 2014. Why a queue only delays the choice between backpressure and load shedding.
- [Redis client handling](https://redis.io/docs/latest/develop/reference/clients/), Redis. Output buffer limits: what a server does when it can't push back.
- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293), IETF, 2022. The receive window as free buffer space, and what the sender does when it hits zero (section 3.8.6).
- [send(2)](https://man7.org/linux/man-pages/man2/send.2.html), Linux man-pages. What `send` and `write` do when the socket's send buffer is full.

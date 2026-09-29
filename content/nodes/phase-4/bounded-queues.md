---
id: bounded-queues
title: Bounded queues
depth: short
phase: 4
note: >-
  A queue with a limit, and what to do when it's full: block, drop or
  reject.
needs: [backpressure]
leads_to: [load-shedding]
compare_with: [littles-law]
---

# Bounded queues

A bounded queue has a fixed limit on how many items it holds. That
forces a decision most code never makes on purpose: what happens when
work arrives and the queue is full? You can make the sender wait,
turn the work away, or throw something out. An unbounded queue makes
that decision for you, by growing until the process runs out of
memory.

## A worker pool with a queue in front

The phase 4 lab builds one version of its server with a fixed pool of
workers. Picture connections arriving on one goroutine and handed to
the workers through a queue. While the workers keep up, the queue
stays near empty.

Now clients send faster than the workers can serve, on average, for
minutes. Something has to give:

- **With no limit**, the queue grows for as long as the overload lasts.
  Memory grows with it, and every new item waits behind all the old
  ones, so the wait gets longer the longer it goes on (see
  [[littles-law]]).
- **With a limit**, the queue fills and stops. Memory is capped and so
  is the time an item can wait in it. The price is that you now have
  to choose what to do with the next item.

![A queue of five slots, all full, between a "new item" and the workers. Below, five things that can happen to the new item: block (the sender waits until a slot frees up, like a send on a full Go channel), reject (the sender gets an error right away, like Java's AbortPolicy or a Go select with default), drop newest (the new item is thrown away, DiscardPolicy), drop oldest (the item at the head is thrown away and the new one queued, DiscardOldestPolicy), caller runs (the sender does the work itself and so slows down, CallerRunsPolicy).](img/bounded-queues-full-policies.svg)

*The choices when a bounded queue is full, with the names Java's `ThreadPoolExecutor` and Go use for them.*

## The choices when it's full

**Block.** The sender waits until there's room. This passes the
pressure back to whoever is producing, which is [[backpressure]]. It's
the right default inside a program, where the producer can afford to
slow down. In Go, a send on a full buffered channel blocks until a
receiver takes something.

**Reject.** The sender gets an error at once and deals with it:
return an error to the client, retry later, try another server.
Java's default policy (`AbortPolicy`) throws an exception. In Go, a
`select` with a `default` case does the same: if the send can't go
through right now, the `default` branch runs instead. When the sender
is a remote client, rejecting fast is usually kinder than making it
wait, and it's the start of [[load-shedding]].

**Drop the newest.** The new item is thrown away and nobody is told.
It only fits work nobody relies on finishing: metrics or debug logs,
not orders.

**Drop the oldest.** Throw out the item that has waited longest and
queue the new one. That's rarely acceptable, but it fits data where
only the latest value matters, like a position update that
the next one replaces.

**Caller runs.** Java's `CallerRunsPolicy` runs the task on the
thread that tried to submit it. The submitter is busy doing the work,
so it can't submit more: a simple way to slow producers down.

## How big should it be?

There's no formula, but there is a trade-off. A big queue in front of
a small pool keeps CPU use and [[context-switch|context switching]]
low but can cap throughput. A small queue needs a bigger
pool to keep the CPUs busy, and too many threads bring their own
scheduling overhead.

A useful way to think about the limit: it's the most waiting you're
willing to put your users through. If the workers finish a certain
number of items a second, a queue of N items means the last one waits
roughly N divided by that rate. Pick N from the delay you can accept,
not from the memory you can spare.

A limit of zero works too: an unbuffered Go channel, or Java's
`SynchronousQueue`, hands each item straight from sender to receiver.

## Where it gets tricky

**Unbounded queues hide in plain sight.** A goroutine per request, an
in-memory slice you append jobs to, a list of pending writes for a
slow client: each is a queue with no limit. Starting a goroutine per
request doesn't remove the queue, it moves it into the scheduler.

**Blocking is wrong on an event loop.** On an [[event-loop]] thread,
"block until there's room" freezes every other connection too. There
you reject, or stop reading from the producer until the queue drains.

**A queue doesn't add capacity.** It absorbs bursts. Under sustained
overload any queue fills; the limit decides when you find out.

**The kernel has one too.** Every listening socket has a queue of
established connections waiting for `accept`, sized by the backlog
you passed to `listen`. When it's full, a new client may get
`ECONNREFUSED`, or its request is ignored so a retry can get in later:
the kernel's own reject and drop. [[tcp-handshake]] has the details.

## What this means when you build

- Put a limit on every queue, channel and buffer between two parts of
  your server. Treat "unlimited" as a bug unless you can say why.
- Choose the full-queue policy on purpose: block inside the program,
  reject at the edge, drop only what nobody needs.
- Size the queue from the waiting time you can accept.
- Count rejections and drops. A queue that's always full is telling you
  something.

## Further reading

- [ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html), Java SE 21 API docs. Direct handoff, unbounded and bounded queues, sizing trade-offs, and the four policies for a full queue.
- [The Go Programming Language Specification](https://go.dev/ref/spec), The Go Authors, go1.27. How buffered channels block, and how `select` with `default` avoids it.
- [listen(2)](https://man7.org/linux/man-pages/man2/listen.2.html), Linux man-pages. The accept queue behind every listening socket, and what happens when it's full.

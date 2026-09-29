---
id: deadline-propagation
title: Deadline propagation
depth: short
phase: 13
note: >-
  Passing the remaining time budget down every call, so nobody keeps
  working on a request the caller gave up on.
needs: [timeouts, grpc]
leads_to: []
compare_with: [retries-with-backoff]
---

# Deadline propagation

Deadline propagation means a request gets one deadline when it enters
your system, and every call it sets off inherits whatever time is left
of it. Without it, a service three hops down can spend seconds on a
request the user gave up on long ago, using threads and CPU that live
requests need.

## One deadline for the whole tree

Start with the example from Google's SRE book. A request reaches
server A, which gives it 30 seconds. A works on it for 7 seconds, then
calls server B. B doesn't get a fresh 30 seconds, or any number of its
own choosing. It gets the 23 seconds that are left. B works for 4
seconds and calls C, which gets 19. Every call in the tree shares one
absolute deadline, set once at the top.

![Two timelines. Top: with propagation, server A sets a 30-second deadline and works 7 seconds, then calls B, which gets 23 seconds left and works 4 seconds, then calls C, which gets 19 seconds left; all three end at the same deadline line at 30 seconds. Bottom: without propagation, A calls B with a 10-second deadline. B is busy for 8 seconds and then calls C with a hard-coded 20 seconds. C's request sits in a queue for 5 seconds, then C starts working at 13 seconds believing it has 15 seconds to spare, although A gave up at 10 seconds; all of C's work is wasted.](img/deadline-propagation-budget.svg)

*One shared deadline versus a made-up one per hop. Adapted from Mike Ulrich, "Addressing Cascading Failures", Google SRE book (2016).*

The bottom half shows what goes wrong when a server makes up its own
number. A gives B 10 seconds. B takes 8 seconds to get going, then
calls C with a hard-coded 20-second [[timeouts|timeout]]. C's queue is
backed up, and it picks the request up 5 seconds later. As far as C
knows, it has 15 seconds to spare. In fact A stopped waiting 3 seconds
ago, and nothing C does now will ever be used.

Work finished after the caller gave up earns nothing, but it still
held a thread, a connection and memory while it ran. The caller may also have [[retries-with-backoff|retried]]
by then, so the dead request and its replacement compete for the same
capacity. In an overloaded system, that's how a slowdown turns into a
[[cascading-failures|cascading failure]].

## How the deadline travels

A deadline is a point in time. Machines' clocks disagree, though (see
[[clock-skew]]), so sending "stop at 12:00:30" to another machine only
works if both clocks match. [[grpc|gRPC]] avoids this by sending the
time that's left instead. The client turns its deadline into a
duration, already minus the time spent so far, and sends that. The
receiving side turns it back into a deadline by adding it to its own
clock. gRPC does this for outgoing calls automatically
in Java and Go; in C++ you have to switch it on.

In Go, the deadline lives in a `context.Context`. An incoming request
creates one, and every function and outgoing call takes it as its
first argument. A child context made with `WithDeadline` can only move
the deadline earlier, never later, so no layer can quietly give itself
more time than its caller has. Cancelling a context cancels every
context made from it, which is how "stop" reaches the whole tree.

Proxies can pass the deadline along too. Envoy sends the upstream a
header, `x-envoy-expected-rq-timeout-ms`, saying how long it expects
the request to take, so the service can give up early.

## The receiving side has to act on it

When the deadline passes, gRPC cancels the call, but your server code
has to notice and stop whatever it started.

- **Check before each stage.** If a request goes through parsing, a
  backend call and processing, check the time left before each one.
  If there isn't enough for the next stage, fail now.
- **Leave room for the trip back.** Shave a little off the outgoing
  deadline, a few hundred milliseconds in the SRE book's advice, for
  network time and for the caller to process the answer.
- **Retries come out of the same budget.** In Envoy, the route timeout
  covers every retry. With a 3-second timeout and a first attempt that
  takes 2.7 seconds, the retry and its backoff get 0.3 seconds. That's
  deliberate: otherwise each retry would start a fresh timeout, and
  retries and timeouts at every layer would multiply.

## Where it gets tricky

**A deadline alone doesn't stop a doomed tree.** Say one deep call
fails in a way no retry can fix, while the top-level deadline still has
20 seconds on it. With deadlines only, every other branch keeps working
until time runs out. Cancellation propagation fixes this: send the
error up and cancel the other calls in the tree.

**Some work should outlive the request.** A long catch-up job that
saves checkpoints is better off checking the deadline after each
checkpoint than throwing away half-done work. Go 1.21 added
`context.WithoutCancel` for work that must carry on after the request
is cancelled.

**The first hop has to pick a number.** gRPC sets no deadline by
default, so without one a call can wait effectively forever.
Propagation only passes down what the edge chose; picking that number
is the [[timeouts]] problem.

**Caps on outgoing deadlines need care.** Limiting how long you'll wait
on a non-critical backend makes sense, but a cap that suits most
traffic can make one kind of request, a large payload or a heavy
computation, fail every time.

## What this means when you build

- Set a deadline at the edge, and pass the remaining time to every call
  a request makes. Never invent a fresh one mid-stack.
- Send it as time left, not as a clock time.
- Check the time left before each expensive step, and stop work when
  the request is cancelled.
- Make retries fit inside the same deadline.
- Propagate cancellation, not just the deadline.

## Further reading

- [Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/), Mike Ulrich, Google SRE book, 2016. The 30/23/19 example, the hard-coded-deadline counter-example, checking at each stage, and cancellation propagation.
- [Deadlines](https://grpc.io/docs/guides/deadlines/), gRPC docs. How gRPC sends the deadline as time left, which languages propagate it automatically, and what the server must do.
- [context package](https://pkg.go.dev/context), The Go Authors, go1.27.1. How Go carries a deadline and cancellation through every call, and why a child can't extend its parent's deadline.
- [Router filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter), Envoy docs, 1.40.0-dev. A proxy's view: the route timeout covers all retries, and the header that tells the upstream how long it has.

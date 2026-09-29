---
id: cpu-bound-vs-io-bound
title: CPU-bound vs I/O-bound work
depth: short
phase: 4
note: >-
  Whether work waits on the CPU or on I/O, and why it changes the right
  design.
needs: [thread]
leads_to: [async-await, thread-pool, event-loop]
compare_with: []
---

# CPU-bound vs I/O-bound work

Work is CPU-bound when it spends its time computing, and I/O-bound when
it spends its time waiting for a disk, a database or another service
to answer. The difference decides what helps. CPU-bound work only goes
faster with more or faster cores. I/O-bound work mostly needs a way to
have many waits going at once. Getting this wrong is how you end up
with a thread pool that's too big, or an event loop that freezes.

## Two requests, two shapes

Picture a server with two endpoints. One hashes a password with scrypt.
The other looks up a user in a database.

![Two timelines for one request each. The CPU-bound one, hashing a password, is on the CPU for its whole length. The I/O-bound one, a database lookup, is on the CPU briefly to send the query, then waits with the thread asleep for most of its length, then is on the CPU briefly to parse the reply.](img/cpu-bound-vs-io-bound-timeline.svg)

*Where one request's time goes.*

The hash keeps a core busy from start to finish. The lookup uses the
CPU for a moment to send the query, then its [[thread]] sleeps until
the reply arrives, and the core is free for anything else.

## Why it changes the design

**CPU-bound work is capped by cores.** A CPU-heavy task only makes
progress while it's actually running on a core. With 4 logical cores
and 5 workers doing CPU work, one of them can't make progress at any
moment; you pay its memory and scheduling cost for nothing. So for CPU
work, more busy threads than cores buys nothing, and each extra one
costs [[context-switch|context switches]].

**I/O-bound work is capped by how many waits you can hold open.** An
I/O task makes progress even while its thread isn't running: the
database or the disk is working on it. So you can have far more I/O
tasks in flight than cores. That's what
[[thread-per-connection]], [[thread-pool|bigger thread pools]],
[[event-loop|event loops]] and [[green-threads]] are all ways of doing.

**Languages bake the split in.** In CPython, the global interpreter
lock lets only one thread run Python code at a time. So in Python,
threads are fine for running many I/O-bound tasks at once, but for
using several cores you want [[process|processes]] (`multiprocessing` or
`ProcessPoolExecutor`). Python 3.13 added free-threaded builds that
can turn the lock off, but not by default.

**Event loops punish CPU work hardest.** Node.js runs all your
JavaScript on one event loop thread and serves many clients from it.
While one callback computes, every other client waits. The loop should
orchestrate requests, not do the heavy work itself. Node sends
CPU-heavy built-ins like `crypto.scrypt()` and zlib compression to a
separate worker pool, and you should do the same with your own heavy
work, or split it into small steps.

## How to tell which one you have

Compare CPU time with wall-clock time. The kernel counts, per process,
the time spent running in user mode and in kernel mode (`getrusage`
returns both). If CPU time is close to wall time (per busy thread),
the work is CPU-bound. If it's a small slice of wall time, the rest
was waiting.

Context switch counts tell the same story. A **voluntary** context
switch means the process gave up the CPU early, usually to wait for
something: lots of them means I/O-bound. An **involuntary** one means
it was preempted, because its time slice ran out or something more
urgent needed the core: lots of them means threads fighting over CPUs.
The phase 4 lab compares its four servers' context switch counts.

## Where it gets tricky

**It depends on the load, not only the code.** The same database
lookup is I/O-bound when the data comes from disk and closer to
CPU-bound when it's already in the [[page-cache]]. Measure under the
load you expect, not on an idle machine.

**Don't mix them in one pool.** A pool sized for I/O (many threads)
lets CPU tasks crowd each other; a pool sized for CPU (one per core)
lets a few slow I/O calls block all of it. Node.js, which has one
shared worker pool for both, runs into exactly this.

**Waiting isn't free forever.** Each open wait still holds memory: a
thread stack, a connection, a buffer. That's the problem [[c10k]] is
about.

## What this means when you build

- Measure CPU time against wall time before choosing a concurrency
  model or a pool size.
- Size CPU pools near the core count. Let I/O concurrency be much
  higher, and bound it with [[bounded-queues]] rather than with threads.
- Never run heavy computation on an event loop thread. Offload it.
- Keep CPU and I/O work in separate pools when they share a process.

## Further reading

- [Don't Block the Event Loop (or the Worker Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), Node.js docs. How CPU-heavy and I/O-heavy tasks behave on an event loop and a worker pool, and why to keep them apart.
- [threading](https://docs.python.org/3/library/threading.html), Python 3.14 docs. The GIL, threads for I/O-bound work, processes for CPU-bound work, and free-threaded builds.
- [getrusage(2)](https://man7.org/linux/man-pages/man2/getrusage.2.html), Linux man-pages. User and system CPU time, and voluntary vs involuntary context switches.

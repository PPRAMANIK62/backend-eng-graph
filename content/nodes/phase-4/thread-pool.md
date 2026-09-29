---
id: thread-pool
title: Thread pools
depth: short
phase: 4
note: >-
  A fixed set of threads taking work from a queue, and how many threads
  to have.
needs: [thread, cpu-bound-vs-io-bound]
leads_to: [bulkheads]
compare_with: [thread-per-connection, event-loop, async-await]
---

# Thread pools

A thread pool is a fixed set of [[thread|threads]] that take work from
a shared queue. It fixes two problems at once: you stop paying to
create a thread for every task, and you put a ceiling on how many
threads can exist. The hard questions are how many threads to have, and
what happens when work arrives faster than they can finish it.

## Workers and a queue

Picture a server that, instead of starting a thread per request (see
[[thread-per-connection]]), puts each request on a queue. Four worker
threads loop forever: take a task off the queue, run it, take the next.
If all four are busy, new tasks wait in the queue. If the queue is
empty, the workers sleep.

![A new task goes from the submitter into a bounded work queue with 5 slots, 3 of them full. Four worker threads take tasks from the queue; three are running and one is blocked on I/O; finished tasks leave as done. If the queue is full, the submitter must pick what happens: reject the task with an error, run it on the submitter's own thread, which slows it down, drop the new task, or drop the oldest queued task and try again.](img/thread-pool-queue.svg)

*A pool of four workers behind a bounded queue, and the choices when it fills. The four choices are the rejection policies of Java's ThreadPoolExecutor.*

Java's `ThreadPoolExecutor` spells out the rules most pools follow in
some form. It has a core size, a maximum size and a queue:

1. While fewer than the core number of threads exist, each new task
   gets a new thread.
2. After that, new tasks go into the queue.
3. Only when the queue is full does the pool add threads, up to the
   maximum.
4. When the queue is full and the pool is at its maximum, the task is
   rejected.

Set core and maximum to the same number and you get a fixed-size pool.

## How many threads

It depends on what the tasks do while they run ([[cpu-bound-vs-io-bound]]).

- **Tasks that compute.** A core can run one thread at a time. Past
  the number of cores, extra threads only take turns, and the switching
  costs something. More threads only help while others are blocked and
  a core would otherwise sit idle.
- **Tasks that wait.** If tasks often block on I/O, the machine can
  keep more threads busy than it has cores, because some are always
  asleep.

For [[db-connection-pooling|database connections]], the PostgreSQL
project's starting formula is twice the core count plus the number of
disks. It's a place to start testing, not an answer. The
same goes for any pool: pick a number from the shape of the work, then
measure around it.

Too small has a cost too. libuv, the library under Node.js's event
loop, runs all file system calls and DNS lookups on one shared pool
with a default of four threads (the `UV_THREADPOOL_SIZE` environment
variable raises it, up to 1,024). Four slow DNS lookups fill it, and
every file read in the process waits behind them. More threads there
mean more throughput and more memory.

## When the queue fills

The queue is where a pool hides overload, so its size matters as much
as the thread count. There are three choices:

- **No queue (direct handoff).** Each task goes straight to a thread or
  a new thread is created. Needs an unbounded maximum, so the number of
  threads can grow without limit if work keeps arriving faster than it
  finishes.
- **An unbounded queue.** The pool never grows past its core size, and
  the queue can grow forever instead.
- **A bounded queue.** Prevents running out of memory, but is harder to
  tune. A big queue with few threads keeps CPU use and switching low but
  can cap throughput; a small queue with many threads keeps the CPUs
  busy but can drown in scheduling overhead.

With a bounded queue you have to decide what a full queue means. Java
ships four answers: throw an error (the default), run the task on the
thread that submitted it, silently drop it, or drop the oldest queued
task and retry. Running it on the submitter is the interesting one: the
thread producing work has to do some itself, so it slows down. That's
[[backpressure]] in its simplest form, and [[bounded-queues]] covers
the choices in general.

## Where it gets tricky

**An unbounded queue turns overload into latency.** Nothing gets
rejected, so everything looks fine, while the queue and every task's
wait time grow. By the time you notice, the backlog is huge.

**Tasks that wait on other tasks.** If a task in the pool submits
another task to the same pool and waits for it, and every thread is
doing the same, nothing can run. Direct handoff avoids these lockups,
which is part of why Java suggests it as a default; the other fix is
not to wait inside the pool at all. This is a [[deadlock]] in pool form.

**One slow dependency takes the whole pool.** If a shared pool serves
both quick requests and calls to a slow backend, the slow calls can
occupy every thread. Separate pools for long-running and real-time
work fix this; [[bulkheads]] makes that a design rule.

## What this means when you build

- Start near the core count for CPU work and higher for blocking work,
  then measure throughput and latency around that number.
- Bound the queue, and choose the rejection policy on purpose.
- Give work with very different latency its own pool.
- Watch queue length and time spent waiting in the queue, not only
  thread count.

## Further reading

- [ThreadPoolExecutor](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html), Oracle, Java SE 21. How core size, maximum size and the queue interact, the three queuing strategies and the four rejection policies.
- [About Pool Sizing](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing), HikariCP wiki. Why more threads than cores only helps when others are blocked, and a starting formula to test around.
- [Thread pool work scheduling](https://docs.libuv.org/en/v1.x/threadpool.html), libuv documentation, v1.x. A real pool inside an event loop: what runs on it, its default size and its limits.

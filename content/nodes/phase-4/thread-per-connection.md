---
id: thread-per-connection
title: Thread per connection
depth: short
phase: 4
note: >-
  One thread for each client. Simple, until there are many clients.
needs: [thread, ports-and-sockets]
leads_to: [c10k]
compare_with: [event-loop, thread-pool, green-threads]
---

# Thread per connection

The simplest way to write a server: accept a connection, start a
[[thread]] for it, and let that thread make ordinary blocking reads and
writes until the client goes away. The code for each client reads top
to bottom, and the kernel's [[cpu-scheduler|scheduler]] takes care of juggling them. It
works well up to a point, and knowing where that point is tells you
whether you need anything fancier.

## One thread, one client, blocking calls

Here's the whole design, for a small key-value server:

```
listener = listen(port 6379)
loop:
    conn = accept(listener)        # waits for a new client
    start a thread that runs:
        loop:
            req = read(conn)       # waits for this client only
            if the client closed: break
            write(conn, handle(req))
        close(conn)
```

The main thread does nothing but `accept` (see [[ports-and-sockets]]).
Every client gets its own thread, and that thread spends most of its
life blocked in `read`, waiting for the client's next request. While it
waits, the kernel runs other threads, so a slow client only holds up
its own thread. The operating system overlaps one client's computation
with another's I/O by switching among threads, and your code never has
to think about it.

That's the appeal. Each connection's state (where it is in the
protocol, half-read requests, its buffers) lives in local variables on
its thread's stack. There's no state machine to write and no callback
to register. Go's standard HTTP server works this way too: it starts a
new goroutine for every accepted connection, though a goroutine is a
much cheaper thing than an OS thread ([[green-threads]]).

## What each connection costs

**A stack.** Every thread has one. On Linux the default is 8 MiB, but
that's [[virtual-memory]]; RAM is used only for the pages the thread
touches. In Eli Bendersky's 2018 test, a process with 10,000 threads
showed about 80 GiB of virtual memory and about 80 MiB resident.

**Context switches.** Each time data arrives for a different client,
the kernel has to switch to that client's thread. The same test
measured 1.2 to 1.5 µs per switch between threads pinned to one core
(Haswell i7-4771), about 2.2 µs unpinned, and that's only the direct
cost; the cache damage comes on top ([[context-switch]]).

**A heavy object for a light job.** A connection is a socket
descriptor and a few buffers. Giving it a whole thread, with its own
stack and a slot in the scheduler, is a lot of machinery to keep a
mostly idle client company.

## Where it breaks

The costs grow with the number of threads, not with the amount of work.
The SEDA paper (2001) showed what that does: in a threaded server doing
the same small task per request, throughput rose as threads were added,
then fell off sharply once there were many of them, while response
times grew without limit. The causes it lists are cache and TLB misses,
scheduling overhead and lock contention. That was Linux 2.2 on a 500 MHz
Pentium III, so the point where it breaks is much higher today, but the
shape of the curve is the lesson.

The two usual ways out:

- **Cap the threads.** A fixed [[thread-pool]] takes connections or
  requests from a queue. The server no longer collapses, but when every
  thread is busy, new clients queue up and can wait a very long time.
- **Stop tying a thread to a connection.** An [[event-loop]] serves
  many connections from one thread, using [[io-multiplexing]] to find
  the ones with work. The history of that move is [[c10k]].

## Where it gets tricky

**Idle connections still cost a thread.** A keep-alive connection that
sends a request now and then holds a thread the whole time. What matters
is how many connections are open, not how many are busy.

**The limit moved.** Much of the early-2000s folklore about how few
threads a machine can take no longer holds. On a 64-bit machine with
lazily backed stacks, Bendersky's 2018 conclusion was that 10,000
threads in one process is practical in production. Measure before you rewrite a working threaded server.

**Shared state means locks.** Threads that share a cache or a counter
need synchronization, and every lock is a place for a
[[race-condition]] or contention.

## What this means when you build

- Thread per connection is a fine default for internal services and
  modest connection counts. It's the easiest design to read and debug.
- Never let the thread count grow without a limit. Past some number,
  throughput falls instead of rising.
- Put [[timeouts]] on idle connections, since each one pins a thread.
- If connections run into the tens of thousands, or most are idle, look
  at an [[event-loop]] or a runtime with cheap threads.

## Further reading

- [SEDA: An Architecture for Well-Conditioned, Scalable Internet Services](https://www.sosp.org/2001/papers/welsh.pdf), Matt Welsh, David Culler, Eric Brewer, 2001. Section 2 and Figure 2: why a thread-per-request server collapses under load, and the trade-offs of bounded pools.
- [Measuring context switching and memory overheads for Linux threads](https://eli.thegreenplace.net/2018/measuring-context-switching-and-memory-overheads-for-linux-threads/), Eli Bendersky, 2018. What a Linux thread really costs in memory and switching time.
- [net/http](https://pkg.go.dev/net/http), The Go Authors, go1.27.1. Go's server starts a goroutine per connection.

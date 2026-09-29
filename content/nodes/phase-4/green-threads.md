---
id: green-threads
title: Green threads
depth: deep
phase: 4
note: >-
  Cheap user-space threads run on a few OS threads. Go's scheduler and
  Java's virtual threads.
needs: [context-switch, io-multiplexing]
leads_to: []
compare_with: [async-await, thread-per-connection, c10k]
---

# Green threads

Green threads are threads that a language runtime implements itself,
in user space, instead of asking the kernel for one. The runtime runs
many of them on a small number of OS threads and switches between them
on its own. Go's goroutines and Java's virtual threads are the two you'll
meet most. They let you write one blocking-style
[[thread-per-connection|thread per connection]]
and still serve as many connections as an event loop.

## Why not just use OS threads

A server that gives each request its own [[thread]] is easy to write
and easy to debug: the code reads top to bottom, and when something goes
wrong the stack trace shows exactly where. The trouble is what an OS
thread costs:

- **Switching.** Moving a core from one thread to another is a
  [[context-switch]], done by the kernel, with a trip into kernel mode
  each time.
- **Memory.** Each OS thread gets a large stack reserved up front,
  sized for the deepest call chain it might ever have.

So the number of OS threads you can run caps how many requests you can
have in flight, and with a thread per request that caps throughput. By
[[littles-law]], if requests take longer, you need more of them in
flight to keep the same throughput, and the thread limit often arrives
long before the CPU or network is busy.

The other way out is an [[event-loop]] with callbacks or
[[async-await]]: a few threads, each juggling many requests. That
scales, but splits your code into pieces, and stack traces, debuggers
and profilers lose track of which request a piece of work belongs to.
Green threads try to keep the thread programming model and make the
thread cheap.

## Many user threads on a few OS threads

Early versions of Java had "green threads" that all ran on a single OS
thread (M:1). They were eventually outperformed by plain OS threads
(1:1), and Java switched. Modern green threads are
M:N: a large number (M) of user threads scheduled onto a smaller number
(N) of OS threads, so they can use every core.

That means the runtime needs its own scheduler, sitting on top of the
kernel's [[cpu-scheduler]]. The kernel schedules the few OS threads onto
cores. The runtime decides which green thread each OS thread runs.

## How Go does it: G, M and P

Go's scheduler has three kinds of objects:

- **G**, a goroutine.
- **M**, a machine: an OS thread.
- **P**, a processor: the right to run Go code. There are exactly
  `GOMAXPROCS` of them. An M must hold a P to
  run Go code, but it can sit blocked in a system call without one.

![Diagram of Go's scheduler. A global run queue at the top holds goroutines. Below it, P0 has a local run queue of goroutines and is attached to M0, an OS thread running one goroutine. P1's queue was empty, so it steals half of P0's queue; P1 is attached to M1, which runs a goroutine. On the right, the netpoller holds goroutines parked on sockets and puts ready ones back on run queues, and M2 is blocked in a system call with no P.](img/green-threads-go-gmp.svg)

*Go's G, M and P. Adapted from Dmitry Vyukov, "Scalable Go Scheduler Design Doc" (2012), and the comments in Go 1.26's runtime/proc.go.*

Each P has its own run queue of up to 256 goroutines, which it reads
without a lock. When you write `go handle(conn)`, the new goroutine goes
on the current P's queue. When a P runs out of work, it steals half of
another P's queue. There's also a global queue, which every P checks
once every 61 scheduling rounds so nothing there starves.

The P exists because of system calls. Before this design (2012), there
was one global run queue behind one mutex, and threads
blocked in system calls held on to memory caches they didn't need. One
Go server of the time topped out at 70% CPU on 8 cores, with 14% of its
time spent in the runtime's `futex` calls. Splitting
"the right to run Go code" (P) from "an OS thread" (M) lets a blocked
thread give up its P so another thread can use it.

## What happens when a goroutine blocks

This is where green threads earn their keep. Your code calls
`conn.Read` and looks like it blocks. What happens underneath depends on
what it's waiting for.

**A socket.** Go registers every socket with the runtime's netpoller,
which is epoll on Linux, armed edge-triggered (see [[io-multiplexing]]). If the read would
block, the goroutine is parked on that socket's descriptor, and the M
picks another goroutine from its P's queue. No OS thread waits. When
epoll reports the socket ready, the netpoller returns the parked
goroutines and they go back on a run queue. A goroutine-per-connection
Go server is, underneath, an epoll event loop that the runtime writes
for you.

Java's virtual threads do the same thing. When a virtual thread calls a
blocking I/O method in the `java.*` library, the runtime makes a
non-blocking call and suspends the virtual thread until it can continue.
The OS thread it was running on, its "carrier", is free for another
virtual thread.

**A real blocking [[system-call|system call]].** Some calls can't be made non-blocking,
most file system operations among them. Then the OS thread really
blocks in the kernel. Go's background monitor thread (sysmon) notices a
P stuck in a system call for more than one of its ticks (at least
20 µs), takes the P away and hands it to another M. Java compensates the same way: when a blocking
operation captures a carrier, the scheduler temporarily adds threads.

**A channel or a [[mutex|lock]].** The goroutine is parked until another
goroutine readies it. A goroutine readied this way goes into its P's
`runnext` slot and runs next, so two goroutines passing messages back
and forth get scheduled as a pair.

A switch between goroutines happens in user space, without a trip into
the kernel. That's the main reason it's cheaper than a thread switch;
[[context-switch]] has measured numbers for both.

## Small stacks that grow

The other cost was the stack. The smallest goroutine stack is 2 KiB.
A new goroutine starts either at that size or, by default in Go 1.26,
at the average stack size the runtime measured during the last garbage
collection, so it rarely has to grow right away. Every function checks, on entry, whether the stack has room for its
frame. If not, the runtime allocates a new stack twice the size, copies
the old one over, and fixes up every pointer that pointed into it. When
a goroutine later uses less than a quarter of its stack, the runtime
shrinks it by half.

Copying works in Go because pointers into a goroutine's stack can only
live on that same stack, so the runtime knows where to find them all.
Go and Rust both first tried segmented stacks, a linked list of small
chunks, and both gave them up: a function call in a hot loop that
happened to cross a chunk boundary allocated and freed a chunk on every
iteration, and nobody could see it in the code.

Java's virtual threads keep their stacks on the garbage-collected heap,
as chunks that grow and shrink as the thread runs.

## Taking the CPU back

A green thread that computes for a long time without blocking holds its
OS thread. Go gives each goroutine a 10 ms time slice. Originally Go
could only preempt at a function call, where the stack check runs. A
tight loop with no calls could hog its thread, delay [[garbage-collection]],
or even [[deadlock]] the scheduler. Go 1.14 added
asynchronous preemption: the runtime sends the thread a [[signals|signal]],
checks that the goroutine is at a safe point, and switches it out.

Java's virtual thread scheduler (JDK 21) doesn't time-slice at all.
Virtual threads aren't cooperative in the async/await sense, since you
never write an explicit yield, but one that computes without blocking
keeps its carrier until it blocks or finishes.

## Where it gets tricky

**Pinning.** A green thread that can't be moved off its OS thread
blocks that thread when it waits. In Java 21, a virtual thread was
pinned while inside a `synchronized` block or a native call, so
blocking I/O under `synchronized` held a carrier, and the scheduler
didn't compensate. JDK 24 (JEP 491) removed the `synchronized` case.
Native code that calls back into Java and blocks, and blocking inside a
class initializer, still pin.

**Calling C is expensive.** C code expects to run on a normal OS thread
stack, not a small growable one. Switching stacks at every foreign call
costs enough to matter. Go just accepts the cost, and C# dropped a green threads experiment over it. It's a
large part of why Rust removed its green threads in 2014, before 1.0,
and built [[async-await]] instead. Rust also has no garbage collector to
find and fix pointers when copying a stack, so its green threads had to
use big stacks, which took away their main advantage.

**They aren't faster threads.** A green thread runs code no faster than
an OS thread. It helps when you have thousands of concurrent tasks that
mostly wait. For [[cpu-bound-vs-io-bound|CPU-bound]] work, more threads
than cores doesn't help, green or not.

**Don't pool them.** [[thread-pool|Thread pools]] exist because OS threads are
expensive. Green threads aren't, so create one per task. If you were
using a pool of 20 threads to limit calls to a fragile service, use a
semaphore instead. And watch for code that caches an expensive object in
a thread-local: with a new thread per task, it gets created per task.

**The OS can't see them.** OS tools see only the OS threads, far fewer
than the green threads running on them. You need the runtime's own tools
to see what each green thread is waiting on; Java added a new thread
dump format for virtual threads because the old flat list doesn't work
for millions of them.

**Signals and EINTR.** Go's preemption signals mean that since 1.14, a
Go program making raw system calls through `syscall` or
`golang.org/x/sys/unix` sees more slow calls fail with `EINTR`, and has
to retry them.

**Stackful vs stackless.** Green threads are stackful: each task has a
real stack. [[async-await]] is stackless: the compiler saves only the
live variables in an object. Green threads avoid colored functions and
keep stack traces; stackless futures are exactly the size they need and
cost nothing to call from C. Which is better depends on the language.

## What this means when you build

- In the phase 4 lab, the goroutine-per-connection version and the
  hand-written epoll version end up doing similar work underneath,
  since Go's netpoller is epoll. Expect the difference to show in
  scheduling and memory, not in how the kernel is asked about sockets.
- Blocking file I/O and cgo calls still use up OS threads in Go. Many
  of them at once means many Ms.
- A CPU-heavy goroutine can still hold a thread for up to its 10 ms time
  slice before it's preempted. Keep CPU-heavy work separate from
  request handling if latency matters.
- Limit concurrency with a semaphore or a bounded channel, not by
  limiting how many goroutines or virtual threads you start.
- On Java, use JDK 24 or later with virtual threads if your libraries
  use `synchronized` around I/O.

## Further reading

- [Go runtime source, src/runtime (Go 1.26)](https://github.com/golang/go/tree/release-branch.go1.26/src/runtime), The Go Authors. The comments in proc.go, stack.go, preempt.go and netpoll.go describe the scheduler, stack growth, preemption and the netpoller from the code itself.
- [Scalable Go Scheduler Design Doc](https://docs.google.com/document/d/1TTj4T2JO42uD5ID9e89oa0sLKhJYD0Y_kqxDv3I3XMw/edit), Dmitry Vyukov, 2012. Why Go added P, per-P run queues and work stealing.
- [Go 1.14 Release Notes](https://go.dev/doc/go1.14), The Go Authors, Go 1.14. Asynchronous preemption and its EINTR side effect.
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444), Ron Pressler and Alan Bateman, 2023. Java's case for cheap threads over async code, and how carriers, mounting and pinning work.
- [JEP 491: Synchronize Virtual Threads without Pinning](https://openjdk.org/jeps/491), Patricio Chilano Mateo and Alan Bateman, JDK 24. The end of pinning in `synchronized`, and the cases that remain.
- [Why async Rust?](https://without.boats/blog/why-async-rust/), without.boats, 2023. Segmented vs copied stacks, the FFI cost, and why Rust removed its green threads.

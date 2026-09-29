---
id: io-uring
title: io_uring
depth: deep
phase: 4
note: >-
  Queues shared with the kernel: submit I/O, collect results, few system
  calls. Completion instead of readiness.
needs: [io-multiplexing]
leads_to: []
compare_with: [io-multiplexing, non-blocking-io, zero-copy]
---

# io_uring

io_uring is Linux's interface for asynchronous I/O: your program puts
requests in a queue it shares with the kernel, the kernel does them, and
the results come back in a second shared queue. Many operations can go
in with one system call, sometimes none. It arrived in Linux 5.1 (2019),
and unlike Linux's older asynchronous interface it works for ordinary
buffered file I/O, not only for [[direct-io|`O_DIRECT`]] files.

## Readiness versus completion

The tools in [[io-multiplexing]] answer one question: "which of my
sockets can I read without waiting?" You still make the `read` yourself,
one system call per socket, after `epoll_wait` said it was ready. That's
the **readiness** model.

io_uring works the other way round. You say "read up to 4 KB from this
socket into this buffer, and tell me when it's done". Later you get
back "done, 512 bytes". The kernel did the waiting and the copying.
That's the **completion** model, and it changes what your loop looks
like: you don't react to "ready", you hand over work and collect
results.

Completion also works where readiness can't. A regular file on disk has
no useful "ready" state, and [[non-blocking-io|O_NONBLOCK]] does nothing
for it. Before io_uring, Linux's own asynchronous interface (aio) only
did unbuffered `O_DIRECT` I/O, could still block while submitting, and
cost at least two system calls per I/O. Programs that wanted
asynchronous file reads ended up building their own [[thread-pool|pool of threads]] to
do blocking reads for them.

## Two rings shared with the kernel

The design starts from a goal: no copying of requests or results
between your program and the kernel, and no locks shared with it. So
both sides share memory. `io_uring_setup` creates an instance and
returns a [[file-descriptor|file descriptor]]; you map its memory into your process with
[[mmap]]. Inside are two ring buffers, each with one producer and one
consumer, kept in step with memory barriers instead of locks
([[memory-model]]):

- **The submission queue (SQ).** You're the producer. Each entry, an
  SQE, describes one operation: an opcode (read, write, accept, send,
  [[fsync]] and many more), a file descriptor, a buffer address and length,
  an offset, and a 64-bit `user_data` value of your choosing. Each SQE
  is roughly the system call you would otherwise have made.
- **The completion queue (CQ).** The kernel is the producer. Each entry,
  a CQE, carries your `user_data` back untouched, and `res`, which is
  what the equivalent system call would have returned: a byte count, or
  a negative error such as `-EIO`. `errno` isn't used.

![Your program fills an SQE (READ fd=7 len=4096 user_data=42) and moves the submission queue's tail. Both rings are memory shared with the kernel. The kernel takes SQEs from the SQ head, does the I/O into your buffer, and adds a CQE at the completion queue's tail; your program reads the CQE (user_data=42 res=512) from the head. One io_uring_enter call says how many entries were added and how many results to wait for; with SQPOLL none is needed while busy.](img/io-uring-rings.svg)

*The two rings. Adapted from Jens Axboe, "Efficient IO with io_uring" (2019), sections 4 and 5.*

One call, `io_uring_enter`, tells the kernel "I've added N entries" and
can also wait for M completions, so a loop that submits new work and
collects finished work pays one system call per turn. You can also read
the CQ without any system call: the kernel moves the tail, you look at
it. By default the CQ has twice as many slots as the SQ.

Results can arrive in any order. Requests are started in order but
nothing guarantees they finish that way, so you match each CQE to its
request with `user_data`, typically a pointer to your own per-request
state.

## Fewer system calls, sometimes none

Every system call costs a trip into the kernel, and the Spectre and
Meltdown fixes made that trip dearer on affected hardware (see
[[system-call]]). io_uring cuts the number of trips three ways:

- **Batching.** Put a batch of SQEs in the ring and submit them all
  with one `io_uring_enter`.
- **Reading completions from memory.** No `epoll_wait`, no `read` to
  collect the result.
- **SQPOLL.** With this setup flag the kernel starts a thread that
  watches the SQ for new entries. While your program keeps it busy, it
  can submit and reap I/O without a single system call. After an idle
  period the thread sleeps and sets a flag, and your next submission
  has to wake it with `io_uring_enter`. SQPOLL needed root at first; Linux
  5.11 allowed it with `CAP_SYS_NICE`, and 5.13 dropped the requirement.

For file data that's already in the [[page-cache]], io_uring does the
read on the spot, so the completion is in the CQ by the time the submit
call returns. A home-made pool of I/O threads can't know whether data
is cached, so it pays for handing every request to another thread and
back, at least two [[context-switch|context switches]], even when the
read would have been instant.

Axboe's own numbers show where it came from: random 4 KB reads from a
[[block-device|block device]] on his test machine reached about 1.7 million per
second with polling, 1.2 million without, against 608,000 for the old
aio. Those are storage numbers on one box when the interface was new;
they say nothing about sockets.

Other options trade more setup for less per-request work: registering
a set of files or buffers once so the kernel doesn't take a reference
or map pages on every I/O, linking SQEs so one starts only after the
previous one succeeds (`IOSQE_IO_LINK`), and busy-polling the device
instead of waiting for an interrupt (`IORING_SETUP_IOPOLL`).

## Networking needs a different loop

For storage, moving to io_uring is mostly mechanical, because storage
code already thinks in completions. Network servers were written for
readiness, usually around epoll. You can keep that loop and just ask
io_uring for readiness instead of epoll, and you'll save some system
calls, but you miss most of what io_uring offers. The loop has to
change.

Two features show why:

- **Multishot requests.** A normal SQE gives exactly one CQE. A
  multishot accept (Linux 5.19) is submitted once and posts a CQE for
  every new connection; multishot receive (6.0) posts one every time
  data arrives. Each CQE says whether more are coming.
- **Provided buffers.** In the readiness model you pick a buffer at the
  moment data is ready. In the completion model a receive is submitted
  in advance, so it needs a buffer in advance, and a server with
  hundreds of thousands of idle connections can't pin a buffer to each
  one. Instead you
  give the kernel a pool of buffers, and it picks one only when data
  actually arrives, telling you which in the CQE (ring-mapped buffer
  pools since 5.19). If the pool runs dry, the request fails with
  `-ENOBUFS`.

## Where it gets tricky

**Your buffers belong to the kernel until the CQE arrives.** A buffer
you passed for a read or write must stay valid, and untouched, until
its completion is back. Freeing it, reusing it or letting a garbage
collector move it earlier is a memory bug. Readiness APIs never had this
problem, because the copy happened inside your own `read` call.

**Order isn't kept for you.** On one TCP socket, having two sends or two
receives in flight at once is generally unsafe: the kernel may run them
out of order. Keep one of each per socket, or chain them with
`IOSQE_IO_LINK` in a single batch.

**The attack surface.** io_uring is a fairly new part of the kernel,
still changing fast, and it has had severe vulnerabilities. In Google's
kernel exploit reward program, 60% of submissions in its 2023 report
exploited io_uring, and io_uring bugs were used in every submission
that got around Google's mitigations. Google turned it off on its
production servers and on ChromeOS, and blocks Android apps from it.
Linux 6.6 added a sysctl, `kernel.io_uring_disabled`: 1 limits new
rings to privileged processes and members of `kernel.io_uring_group`,
2 forbids new rings entirely. So a server
built on io_uring may land on a machine where `io_uring_setup` fails
with `EPERM`, and needs a fallback.

**It's Linux-only and version-sensitive.** Features arrive release by
release (multishot accept 5.19, multishot receive 6.0), and the man
pages list the kernel each flag needs. Check the running kernel's
features at startup rather than assuming them.

**Readiness isn't dead.** epoll is simpler to program against, and for
a server whose bottleneck isn't system calls it may be all you need.

## What this means when you build

- Reach for io_uring when system calls or file I/O are your bottleneck:
  lots of small file reads, or a network loop where profiles show time
  in the kernel entry path.
- Use liburing (or your language's wrapper) rather than the raw rings;
  the memory barriers are easy to get wrong.
- Design the loop around completions: `user_data` pointing at
  per-request state, buffers owned by the kernel while in flight,
  provided buffers for receives.
- Probe for io_uring at startup and keep an epoll path for when it's
  disabled.
- For [[storage-benchmarks|storage benchmarks]], remember Axboe's figures are block-device
  numbers; measure your own workload.

## Further reading

- [Efficient IO with io_uring](https://kernel.dk/io_uring.pdf), Jens Axboe, 2019. The design document: why aio failed, the two rings, the system calls, SQPOLL, and first performance numbers.
- [io_uring(7)](https://man7.org/linux/man-pages/man7/io_uring.7.html), liburing project. The programming model, ordering rules for sockets, buffer lifetimes, and why fewer system calls matter.
- [io_uring_setup(2)](https://man7.org/linux/man-pages/man2/io_uring_setup.2.html), liburing project. Every setup flag with the kernel that added it, the SQPOLL privilege changes, and the `EPERM` from `io_uring_disabled`.
- [io_uring and networking in 2023](https://github.com/axboe/liburing/wiki/io_uring-and-networking-in-2023), Jens Axboe, 2023. Why a network loop has to change, multishot requests and provided buffers.
- [Learnings from kCTF VRP's 42 Linux kernel exploits submissions](https://security.googleblog.com/2023/06/learnings-from-kctf-vrps-42-linux.html), Tamás Koczka (Google), 2023. The security case against io_uring and where Google turned it off.
- [Linux 5.1](https://kernelnewbies.org/Linux_5.1), Kernel Newbies, 2019. The release that merged io_uring, and what was wrong with aio.
- [Linux 6.6](https://kernelnewbies.org/Linux_6.6), Kernel Newbies, 2023. The release that added the sysctl to disable io_uring.

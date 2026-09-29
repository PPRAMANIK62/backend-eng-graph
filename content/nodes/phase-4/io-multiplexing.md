---
id: io-multiplexing
title: I/O multiplexing
depth: deep
phase: 4
note: >-
  select, poll, epoll, kqueue: one thread watching thousands of sockets.
  Level vs edge triggered.
needs: [non-blocking-io, file-descriptor]
leads_to: [io-uring, event-loop, green-threads]
compare_with: [io-uring]
---

# I/O multiplexing

I/O multiplexing is how one [[thread]] watches thousands of sockets at
once: it asks the kernel "which of these can I use right now without
waiting?" and sleeps until the answer isn't empty. `select` and `poll`
are the old portable ways to ask, `epoll` is Linux's, and `kqueue` is
the BSDs'. Every [[event-loop]] sits on top of one of them, and the
differences between them decide how far one thread can go.

## The question you're asking the kernel

Picture a chat server with 10,000 open connections. At any moment most
clients are idle; a few dozen have just sent a message. With
[[non-blocking-io]] the server can read from any socket without getting
stuck, but it still needs to know *which* sockets to read. Trying all
10,000 in a loop would burn a core finding nothing.

So the server hands the kernel a set of [[file-descriptor|file descriptors]]
and waits. A descriptor counts as **ready** when an I/O call on it
wouldn't block: there's data to read, there's room to write, or, on a
listening socket, a new connection is waiting (see [[ports-and-sockets]]). The wait
returns as soon as at least one is ready, and tells the server which.
The server then does its reads and writes on just those, and goes back
to waiting.

That's the whole idea. The interesting part is what it costs to ask.

## select and poll: hand over the whole list every time

`select` dates from 4.2BSD. You pass it three bitmaps of descriptors
(read, write, exceptional conditions). It overwrites them with the
answer, so a loop has to rebuild them before every call. Worse, the
bitmaps are a fixed size. In glibc they cover descriptor numbers 0 to
1023, and that limit will not change. A
server with more than about a thousand connections can't use `select`
at all.

`poll` (in Linux since 2.1.23) fixes the size problem. You pass an array
of `struct pollfd`, one entry per descriptor with the events you want,
and the kernel fills in which ones happened. No limit on descriptor
numbers.

Both share a deeper problem: they're stateless. The kernel remembers
nothing about what you're interested in between calls. Here's what
that costs on each call:

1. Your whole list is copied into the kernel.
2. The kernel checks every entry. If none is ready, it registers the
   thread with each one and sleeps; when something happens, it walks the
   list again to see what.
3. The whole list is copied back out.
4. Your code walks the whole list to find the few entries marked ready.

For the chat server that's 10,000 entries in and out, and several walks
over all of them, to learn that a few dozen sockets have data. In
practice only a few hundred of many thousands of descriptors are
typically active, so almost all of that work is wasted. It grows
with the number of connections you watch, not with the number that are
busy.

![Two panels. Left, poll or select: the program's whole list of N descriptors is copied into the kernel, the kernel checks every one, the whole list is copied back out, and back in the program the code scans all N to find the ready few. Work grows with every fd watched. Right, epoll: the program calls epoll_ctl once per fd to put it on the interest list inside the kernel; the kernel moves descriptors to a ready list as data arrives; epoll_wait hands back only the ready ones, here 5 and 8.](img/io-multiplexing-poll-vs-epoll.svg)

*Asking the whole question every time versus registering interest once. Adapted from Jonathan Lemon, "Kqueue: A generic and scalable event notification facility" (2000), section 2, and the epoll(7) man page.*

## epoll and kqueue: register once, collect only what's ready

The fix is to let the kernel keep state. With `epoll`, you create an
epoll instance, a kernel object you refer to by its own file descriptor.
It holds two lists:

- the **interest list**, every descriptor you've registered, and
- the **ready list**, the ones that are ready now, which the kernel
  fills in as I/O happens on them.

`epoll_ctl` adds, changes or removes an entry on the interest list, once
per descriptor rather than once per wait. `epoll_wait` sleeps until the
ready list isn't empty, then hands back entries from it. The chat server
registers each connection when it accepts it and gets back a few dozen
entries per wait, whatever the total. The cost moves into kernel memory
instead: each registered descriptor takes roughly 160 bytes on a 64-bit
kernel.

`kqueue`, committed to FreeBSD in 2000, two years before epoll was
written, had the same insight. One `kevent` call both applies your
changes to the registered set and returns pending events, which saves a
[[system-call|system call]] per loop. epoll arrived in Linux 2.5.44.

Registration isn't free. When kqueue was new, adding a descriptor to a
kqueue took about twice as long as one `poll` call on it (measured on
FreeBSD 4.3), so for a descriptor you only check once, the stateful
design gains nothing. It
wins when the same connections are watched over and over, which is
exactly what a server does.

## Level-triggered and edge-triggered

Once the kernel keeps state, there's a choice about when to report a
descriptor. The epoll man page uses a pipe to show it, and it works the
same for a socket:

1. 2 kB arrive on the socket.
2. `epoll_wait` returns it as readable.
3. The server reads only 1 kB.
4. The server calls `epoll_wait` again.

**Level-triggered** (epoll's default, and what `poll` and `select` do)
reports a descriptor for as long as the condition holds. There's still
1 kB in the buffer, so step 4 returns it straight away. In this mode
epoll is simply a faster `poll`.

**Edge-triggered** (`EPOLLET`) reports only changes. Nothing new has
arrived since step 2, so step 4 may sleep forever, with 1 kB sitting
unread and a client waiting for a reply to it.

![A timeline: 2 kB arrive, epoll_wait returns the fd as readable, the program reads 1 kB leaving 1 kB, then calls epoll_wait again. Level-triggered: it returns at once because 1 kB is still there. Edge-triggered: nothing new arrived, so it may wait forever and the client waits too. The rule for edge-triggered is to keep reading until EAGAIN, then wait.](img/io-multiplexing-level-edge.svg)

*The epoll(7) man page's example, redrawn for a socket.*

So edge-triggered comes with a rule: use non-blocking descriptors, and
after an event keep reading (or writing) until the call fails with
`EAGAIN`; only then wait again. In return, the kernel doesn't keep
telling you about a descriptor you already know is ready. How a
runtime like Go's builds its network poller on this is covered in
[[green-threads]].

kqueue's designer, Jonathan Lemon, made level-triggered its default
for correctness: a
program that does a partial read still hears about the rest. epoll
offers both. A third option, `EPOLLONESHOT`, reports one event and then
disables the descriptor until you re-arm it with another `epoll_ctl`
call.

## Where it gets tricky

**Ready is a hint, not a promise.** On Linux, `select` can report a
socket as readable and a read can still block, for instance when the
data that arrived had a bad checksum and was thrown away. This is why
every multiplexing loop uses non-blocking sockets, even in
level-triggered mode.

**epoll tracks the open file, not your descriptor number.** A
registration belongs to the kernel's open file description (see
[[file-descriptor]]). If the descriptor was duplicated, by `dup` or
across `fork`, closing your copy doesn't remove it from the interest
list, and events keep arriving for a number you already closed. Remove
it with `EPOLL_CTL_DEL` before you duplicate or close it.

**Many threads, one listening socket.** Put one listening socket in
several threads' epoll sets and a new connection wakes all of them in
level-triggered mode; one wins `accept`, the others get `EAGAIN` and go
back to sleep, having wasted a wakeup. Edge-triggered is no better: it
can hand every connection to the same thread. Linux 4.5 added
`EPOLLEXCLUSIVE`, which wakes one or more waiters instead of all, and
it's the flag to use for this case. (This kernel "thundering herd" is a
different problem from [[thundering-herd|clients retrying in sync]].) How this plays out
across a server's worker processes is in [[event-loop]].

**Starving your own connections.** In edge-triggered mode you drain a
socket until `EAGAIN`. If one client sends a flood, draining it can keep
you from ever getting to the others. The fix is to keep your own list
of ready connections and take turns among them.

**It's for sockets and pipes, not disk files.** A read from a regular
file still waits for the drive, whatever the flags; [[non-blocking-io]]
covers why, and [[io-uring]] is Linux's answer that works for files
too.

**None of it is portable.** `epoll` is Linux-only and `kqueue` is from
FreeBSD; only `select` and `poll` are in POSIX. Code that runs on
several systems needs a layer that picks the right one per system.

## What this means when you build

- Use `epoll` on Linux (`kqueue` on BSD). Don't use `select`: it breaks
  past descriptor 1023.
- Start level-triggered. Switch to edge-triggered only when every
  handler reliably reads and writes until `EAGAIN`.
- Make every watched socket non-blocking, and handle `EAGAIN` after a
  "ready" report.
- Register a connection when you accept it and remove it before you
  close it.
- Give each thread its own epoll instance. If several threads accept
  from one listening socket, use `EPOLLEXCLUSIVE`.
- Take turns among busy connections so one client can't hog the loop.

## Further reading

- [select(2)](https://man7.org/linux/man-pages/man2/select.2.html), man-pages 6.19. The FD_SETSIZE warning, sets rebuilt every call, and spurious readiness on Linux.
- [poll(2)](https://man7.org/linux/man-pages/man2/poll.2.html), man-pages 6.19. The pollfd array and its history.
- [epoll(7)](https://man7.org/linux/man-pages/man7/epoll.7.html), man-pages 6.19. Interest and ready lists, the level vs edge example, and the Q&A on closing and duplicating descriptors.
- [epoll_ctl(2)](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html), man-pages 6.19. EPOLLET, EPOLLONESHOT and EPOLLEXCLUSIVE.
- [Kqueue: A generic and scalable event notification facility](https://people.freebsd.org/~jlemon/papers/kqueue.pdf), Jonathan Lemon, 2000. Why select and poll don't scale, and the case for a stateful, level-triggered design.
- [Epoll is fundamentally broken 1/2](https://idea.popcount.org/2017-02-20-epoll-is-fundamentally-broken-12/), Marek Majkowski, 2017. What goes wrong when threads share an epoll set on one listening socket, step by step.

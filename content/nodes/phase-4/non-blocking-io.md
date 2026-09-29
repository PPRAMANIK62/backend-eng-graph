---
id: non-blocking-io
title: Non-blocking I/O
depth: short
phase: 4
note: >-
  A blocking read holds its thread until data arrives; a non-blocking
  one returns "nothing yet" (EAGAIN) right away.
needs: [system-call, ports-and-sockets]
leads_to: [io-multiplexing]
compare_with: [io-uring]
---

# Non-blocking I/O

A normal `read` on a socket waits until data arrives, and the [[thread]]
that called it can't do anything else in the meantime. Switch the socket
to non-blocking mode and the same call comes back at once, with the
error `EAGAIN`, when there's nothing to read yet. That one flag is what
lets a single thread look after many connections, and every [[event-loop|event loop]]
is built on it.

## A blocking read parks the thread

Take a small server that has just accepted a client and wants its
request. It calls `read(fd, buf, 4096)`. That's a [[system-call]], so
the thread goes into the kernel, and one of two things happens:

- If bytes are waiting in the socket's receive buffer, the kernel copies
  them out and returns. You get whatever is there, up to 4,096 bytes,
  which may be less than the client sent.
- If the buffer is empty, the kernel puts the thread to sleep until data
  arrives.

From your program's side, the second case just looks like a slow call.
It might come back at once or many minutes later; that's up to the
client. This is blocking I/O, and it's how every socket starts out.

Blocking is fine while a thread has one client to look after. It stops
being fine when the same thread should also accept a new client or
answer one that's already waiting. A thread asleep in `read` on client A
can't notice client B. One answer is a thread for every client
([[thread-per-connection]]). The other answer starts with a flag.

## Non-blocking: "nothing yet" instead of waiting

`O_NONBLOCK` is a flag on the socket's open file description, the
kernel object behind the descriptor (see [[file-descriptor]]). You turn
it on with `fcntl` and its `F_SETFL` operation. After that, no I/O call
on the descriptor makes the thread wait:

- A `read` or `recv` with data waiting behaves exactly as before.
- With the buffer empty, the call returns `-1` right away and sets
  `errno` to `EAGAIN` or `EWOULDBLOCK`. POSIX lets a system return
  either one and doesn't require them to be the same number, so
  portable code checks for both.
- `accept` on a listening socket with no connection queued fails with
  `EAGAIN` instead of sleeping.

![Two timelines of one thread. With a blocking socket, the thread calls read and sits asleep in the kernel until data arrives, then read returns 512 bytes; it can't serve anyone while it waits. With a non-blocking socket, read returns -1 with EAGAIN at once, the thread serves client B and accepts client C, and after data arrives it calls read again and gets 512 bytes.](img/non-blocking-io-read.svg)

*The same read on a blocking and a non-blocking socket. The data arrives at the same moment; only what the thread does meanwhile changes.*

`EAGAIN` isn't a failure. It means "not now". The connection is fine,
and the data might show up a moment later.

## Now you need to know when to try again

Non-blocking calls on their own don't get you far. If a thread just
loops over its sockets, calling `read` on each until one returns data,
it keeps a core busy doing nothing useful. What you want is to sleep
until *some* socket among many has something, then make only the calls
that will succeed.

That's what `select`, `poll` and `epoll` do: you hand the kernel a set
of descriptors and it wakes you when one of them is ready. That's
[[io-multiplexing]]. `recv` itself points you there for finding out when
more data arrives. The two pieces fit together: multiplexing says which
socket to look at, and non-blocking mode makes sure looking never gets
the thread stuck.

The flag doesn't change what those calls report. They answer "would a
blocking call on this descriptor block right now?", whether or not
`O_NONBLOCK` is set.

## Where it gets tricky

**Regular files ignore it.** `O_NONBLOCK` has no effect on regular files
and [[block-device|block devices]]. A read from a file that needs the disk still waits
for the drive, flag or no flag. An event loop can't make disk reads
non-blocking this way; that's a job for a [[thread-pool]] or
[[io-uring]].

**The flag is shared.** Because it sits on the open file description,
not on your descriptor number, every thread in your [[process]] sees the
change, and so does any other process holding a descriptor to the same
description. If you only want one call not to wait, `recv` takes a
per-call flag, `MSG_DONTWAIT`, that leaves the shared setting alone.

**Accepted sockets start out blocking.** On Linux, the socket `accept`
returns does not inherit `O_NONBLOCK` from the listening socket. Set it
on every new connection. One forgotten socket can stall a whole event
loop the first time a read on it finds nothing ([[ports-and-sockets]]
covers `accept`).

**A short read isn't the end of the message.** A receive returns what's
there, which can be less than you asked for and less than the client
meant to send. Non-blocking code keeps partial data in a buffer per
connection and carries on when more arrives.

## What this means when you build

- Put every socket an event loop touches in non-blocking mode,
  including each one `accept` returns.
- Treat `EAGAIN` and `EWOULDBLOCK` as "not now", never as an error, and
  check for both.
- Keep a buffer and some state per connection, because a read can stop
  partway through a message.
- Don't expect `O_NONBLOCK` to help with files on disk.
- Pair non-blocking sockets with [[io-multiplexing]]. Retrying in a
  tight loop only burns CPU.

## Further reading

- [recv(2)](https://man7.org/linux/man-pages/man2/recv.2.html), man-pages 6.19. What a receive does when there's no data, EAGAIN vs EWOULDBLOCK, and MSG_DONTWAIT against O_NONBLOCK.
- [open(2)](https://man7.org/linux/man-pages/man2/open.2.html), man-pages 6.19. The O_NONBLOCK flag, what it does to later I/O, and why it does nothing for regular files.
- [accept(2)](https://man7.org/linux/man-pages/man2/accept.2.html), man-pages 6.19. Accepting on a non-blocking listener, and why accepted sockets don't inherit O_NONBLOCK on Linux.

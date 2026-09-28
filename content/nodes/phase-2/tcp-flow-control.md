---
id: tcp-flow-control
title: TCP flow control
depth: short
phase: 2
note: >-
  The receiver's window: the sender never has more unacknowledged data
  out than the other side has room for.
needs: [tcp]
leads_to: [bandwidth-delay-product]
compare_with: [congestion-control]
updated: 2026-09-29
---

# TCP flow control

Flow control is how TCP stops a fast sender from burying a slow
receiver. Every ACK carries a window: how many more bytes the receiver
will accept right now, and the sender never has more than that
unacknowledged. It's what pushes back when your program reads slowly,
and what caps throughput when buffers are too small.

## The window is free space in the receive buffer

Say your server streams a large export to a client that writes each
chunk to a slow disk before reading the next. The client's kernel keeps
incoming bytes in the socket's receive buffer until the program calls
`read`.

Each ACK carries the next byte the client expects (see [[tcp]]) and a
window: how many bytes from there it will take. The window is meant to
match the free space in the receive buffer.

![A long bar for one socket's receive buffer, split into three parts: bytes received and ACKed but not yet read by the application, the advertised window starting at the ACK number, and free space not yet advertised. The application's read drains the first part; new segments land in the window.](img/tcp-flow-control-receive-buffer.svg)

*The receive buffer and the window the receiver advertises. Adapted from the RCV.BUFF diagram in RFC 9293, "Transmission Control Protocol" (IETF, 2022), section 3.8.6.2.2.*

The sender tracks how much of the window it can still use: the right
edge (last ACK number plus window) minus what it has already sent, or
`U = SND.UNA + SND.WND - SND.NXT` in the spec's variables. At zero it
stops and waits for an ACK that moves the edge.

As the client's buffer fills, its window shrinks, and the server can
only send as fast as the client reads. Nothing has to be dropped.

## A zero window, and how it reopens

When the buffer is full, the client advertises a window of zero and the
server stops. When the program reads, the client sends a window update.
If that update were lost, both sides would wait on each other forever.

So the sender probes. Once a zero window has lasted one retransmission
timeout, it sends a probe (a byte of new data, if it has any), and it
waits longer and longer between probes. The receiver answers each probe
with its current window, so a reopened window always gets through. A
receiver may keep its window closed as long as it likes; while it
answers probes, the connection stays open.

## Silly window syndrome

If the client reads 10 bytes at a time and advertises each 10 bytes it
frees, the sender fills them with 10-byte segments. Headers swamp the
data, and the pattern doesn't fix itself. This is silly window
syndrome.

Both sides guard against it:

- **The receiver** keeps the right edge of its window where it is until
  it can open it by at least one full segment or half the buffer,
  whichever is smaller.
- **The sender** waits until it can send a full segment, half the
  largest window it has seen, or everything it has queued, with a
  timer of 0.1 to 1.0 seconds to force data out. Nagle's algorithm
  adds its own hold on small writes ([[nagle-and-delayed-ack]]).

## The 64 KiB ceiling and window scaling

The window field in the TCP header is 16 bits, so on its own it can't
say more than 64 KiB. At one window per round trip, that caps a long,
fast path well below what the link can carry. How big a
window a path needs is the [[bandwidth-delay-product]].

RFC 7323 (2014, replacing RFC 1323) fixes this with the window scale
option. Each side sends a shift count in its SYN, and from then on its
window field is multiplied by 2 to that power. The largest shift is 14,
which allows windows up to 1 GiB. Because the option only travels in
the SYN, the scale is fixed for the life of the connection
([[tcp-handshake]]). Linux turns window scaling on by default.

## How Linux sizes the buffer

The receive buffer, and so the largest window, comes from
`net.ipv4.tcp_rmem`, three numbers: min, default and max. In the kernel
documentation for 7.3-rc5 (2026), the default buffer is 131,072 bytes,
which gives an initial window of 65,535, and the max ranges from
131,072 bytes to 32 MB depending on how much RAM the machine has.

From there Linux autotunes (`tcp_moderate_rcvbuf`, on by default),
growing each socket's buffer toward what the path needs, up to that
max. Setting `SO_RCVBUF` yourself turns autotuning off for that socket,
and only takes effect if done before `listen` or `connect`.

## Where it gets tricky

**Flow control isn't congestion control.** The window protects the
receiver. [[congestion-control]] protects the network in between, with
a separate window the sender keeps for itself. The sender obeys
whichever of the two is smaller, so a big receive window doesn't mean
the sender will use it.

**Setting the buffer by hand can make things worse.** It turns
autotuning off, so a value picked for one path can be too small for the
next. Linux also allocates twice what you ask for, so reading it back
gives a different number.

**The docs disagree on defaults.** The tcp(7) man page (man-pages 6.19,
2026) gives 87,380 bytes as the default `tcp_rmem`; the kernel's own
documentation says 131,072. Check `/proc/sys/net/ipv4/tcp_rmem` on your
machine.

## What this means when you build

- A slow reader slows its sender. If a [[packet-capture]] shows a zero
  window, the receiving program isn't keeping up; look there first.
- Leave autotuning on unless you've measured a reason not to.
- On long, fast paths, check that the max in `tcp_rmem` covers the
  bandwidth-delay product of the paths you care about.

## Further reading

- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293), IETF, 2022. The window field, zero-window probing and silly window syndrome (sections 3.1 and 3.8.6).
- [RFC 7323: TCP Extensions for High Performance](https://www.rfc-editor.org/rfc/rfc7323), IETF, 2014. Why a 16-bit window isn't enough, and the window scale option.
- [RFC 5681: TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681), IETF, 2009. How the receiver's window and the congestion window combine (section 3.1).
- [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel documentation, 2026. Current `tcp_rmem` defaults and receive buffer autotuning.
- [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html), Linux man-pages, 2026. Window scaling on Linux and setting buffer sizes per socket.

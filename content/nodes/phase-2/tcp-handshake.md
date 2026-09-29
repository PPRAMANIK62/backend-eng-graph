---
id: tcp-handshake
title: The TCP handshake
depth: short
phase: 2
note: >-
  SYN, SYN-ACK, ACK: what opening a connection costs, and how SYN
  floods abuse it.
needs: [tcp]
leads_to: [time-wait, connection-pooling, quic]
compare_with: []
---

# The TCP handshake

Before a [[tcp]] connection carries any data, the two sides trade three
segments: SYN, SYN-ACK, ACK. That exchange costs a full round trip on
every new connection, and it's the moment a server first spends memory
on a client it knows nothing about, which is what SYN floods attack.

## Three segments, two starting numbers

Each side of a TCP connection numbers its bytes from its own starting
point, the initial sequence number. The handshake exists so each side
learns the other's number and gets its own confirmed.

![Sequence diagram. Client in CLOSED, server in LISTEN. The client sends SYN with seq 100 and moves to SYN-SENT; the server moves to SYN-RECEIVED and replies SYN-ACK with seq 300, ack 101. The client moves to ESTABLISHED and sends ACK with seq 101, ack 301; the server moves to ESTABLISHED. The client then sends data with seq 101.](img/tcp-handshake-sequence.svg)

*The three-way handshake, with the numbers from the spec's example. Adapted from Wesley Eddy (editor), RFC 9293, "Transmission Control Protocol (TCP)", figure 6 (2022).*

1. **SYN.** The client picks 100 and sends a segment with the SYN flag
   and sequence number 100. It's now in SYN-SENT.
2. **SYN-ACK.** The server picks 300 and replies with SYN and ACK set:
   "my number is 300, and I expect your byte 101 next". The SYN took up
   sequence number 100, so the acknowledgment is 101. The server is in
   SYN-RECEIVED.
3. **ACK.** The client acknowledges 301 and is ESTABLISHED. When the
   server gets this, it's ESTABLISHED too.

The client's first data byte is number 101. A bare ACK doesn't use up a
sequence number, so the data segment right after the ACK also starts at
101.

Logically there are four steps: each side sends its number and each
side confirms the other's. The server's confirmation and its own SYN
fit in one segment, so it's three.

## Why not just two

A SYN can sit in the network for a while and arrive long after the
client gave up on it. The server has no way to tell an old duplicate SYN
from a new one. So it doesn't trust the SYN; it answers and waits for
the client to confirm. If the SYN was stale, the client sees a SYN-ACK
for a number it never sent, replies with RST, and the server drops the
half-made connection and goes back to listening. Stopping old duplicate
connection attempts from causing confusion is the main reason the
handshake has three steps.

## What it costs

The client can't send its request until the SYN-ACK is back, so every
new connection pays one round trip before the first byte of the
request leaves. The longer the round trip (see [[network-latency]]),
the more that costs, and it's the main reason to keep connections open
and reuse them.

On the server, Linux keeps two queues per listening socket. The **SYN
queue** holds half-open connections in SYN-RECEIVED and resends the
SYN-ACK if the final ACK doesn't come: by default 5 times, giving up
after 63 seconds. When the ACK arrives, the kernel builds a full
connection and moves it to the **accept queue**, where it waits for
your program to call `accept` (see [[ports-and-sockets]]). If your
program is slow and the accept queue fills up, Linux drops new SYNs and
handshake ACKs on purpose. The client will retry, and by then your
program has hopefully caught up.

## SYN floods and SYN cookies

A SYN flood sends a stream of SYNs, usually from forged source
addresses, and never answers the SYN-ACKs. Each one takes a slot in the
SYN queue, and once the queue is full, real clients are turned away.
Before 1996 it could take down almost any TCP server with very little
bandwidth.

The defense Linux uses is **SYN cookies**. When a listener's SYN queue
overflows, the server stops storing anything for new SYNs. Instead it
packs what it needs to remember into the sequence number it sends in
the SYN-ACK: a few bits of time, a few bits for the client's maximum
segment size, and a cryptographic hash of the connection's addresses
and ports. A real client echoes that number plus one in its ACK. The
server checks the hash and builds the connection from the ACK alone. A
forged SYN costs the server one reply and no memory.

The catch is that 32 bits don't hold much. TCP options the client
offered, like selective acknowledgments and window scaling, are lost
unless TCP timestamps are on and carry a few extra bits. So Linux turns
SYN cookies on only when a queue overflows. Since Linux 4.4 the kernel can send millions of SYN cookies
per second. Floods bigger than that, like the ones Cloudflare sees at
over 200 million packets per second, get dropped by firewall rules
before they reach TCP at all.

## Where it gets tricky

**A brief stall looks like an attack.** An accept queue can overflow for
a fraction of a second when your program pauses, and the kernel counts
the dropped SYNs (`ListenOverflows` and `ListenDrops` in `nstat`) even
though nothing was attacking you.

**Queue sizing depends on the kernel version.** The accept queue is
capped by the `listen` backlog and `somaxconn`. How the SYN queue is
sized has changed between kernel versions, so check the kernel you run
rather than an old tuning guide.

## What this means when you build

- Reuse connections (pools, keep-alive) so you pay the round trip once.
- If `ListenOverflows` climbs, your program isn't calling `accept` fast
  enough: raise the backlog and fix the stall.
- Leave `net.ipv4.tcp_syncookies` at its default.

## Further reading

- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293), Wesley Eddy (editor), IETF, 2022. Sections 3.4.1 and 3.5: why the handshake has three steps, with worked examples.
- [SYN packet handling in the wild](https://blog.cloudflare.com/syn-packet-handling-in-the-wild/), Marek Majkowski, Cloudflare, 2018. The SYN and accept queues on Linux, overflow behavior, and how SYN cookies work and what they cost.

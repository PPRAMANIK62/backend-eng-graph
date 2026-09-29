---
id: head-of-line-blocking
title: Head-of-line blocking
depth: short
phase: 2
note: >-
  One lost packet holds up everything behind it in an ordered stream.
needs: [tcp-retransmission]
leads_to: [http2, quic]
compare_with: []
---

# Head-of-line blocking

Head-of-line blocking is what happens when a queue must be served in
order and the item at the front is stuck: everything behind it waits,
even items that are ready. In TCP, one lost packet holds back every
byte that arrived after it, because TCP hands data to your program only
in order. When you put many independent requests on one connection,
that loss delays all of them.

## One lost segment, many waiting requests

[[tcp]] gives your program a single ordered byte stream. Say a client
has three requests in flight on one connection, A, B and C, and the
server's responses go out as segments 1 to 4. Segment 2, carrying part
of B's response, is dropped.

Segments 3 and 4 arrive fine. The client's kernel has them, but it
can't give them to the program: the program reads a stream, and byte
order says segment 2 comes first. So they wait until the sender notices
the loss and resends segment 2. That takes at least another round trip,
and much longer if the loss is only found by a retransmission timeout
([[tcp-retransmission]]).

Parts of A and C, which had nothing to do with the lost packet, are
delayed along with B.

![Two rows. Top: segments 1 to 4 carrying requests A, B, C and A on one TCP stream; segment 2 is lost, so the application gets segment 1 and segments 3 and 4 wait for the retransmission. Bottom: the same requests on separate QUIC streams; the packet for stream B is lost, and only stream B waits while A and C are delivered.](img/head-of-line-blocking-streams.svg)

*One lost packet on a TCP connection stalls every request behind it; on separate QUIC streams only the affected stream waits.*

## The same problem, one layer up

Head-of-line blocking also happens above TCP, in the application
protocol. [[http-1-1|HTTP/1.1]] pipelining let a client send several requests
without waiting, but it still suffered from head-of-line blocking at
the application layer: a response stuck at the front held up the ones
behind it. Clients worked around it by opening several
connections, which has its own cost: each connection runs its own
[[congestion-control]] and they don't share what they learn.

[[http2|HTTP/2]] (RFC 9113, 2022) fixed the application-layer version by
multiplexing many requests over one connection as interleaved frames.
But it runs on TCP, and TCP's loss recovery can't see those separate
requests. A single lost or reordered packet stalls every active request
on the connection. HTTP/2 left TCP head-of-line blocking unsolved, and
its spec is open about that.

## How QUIC avoids it

[[quic|QUIC]] (RFC 9000, 2021) runs over [[udp]] and builds streams into the
transport itself. Each stream is ordered on its own, and when a packet
is lost, only the streams whose data was in that packet wait for the
retransmission; the others keep going. [[http3|HTTP/3]] (RFC 9114, 2022) runs
HTTP over QUIC streams for exactly this reason. QUIC gets
its own article in phase 3.

## Where it gets tricky

**QUIC doesn't remove it, it narrows it.** Inside one stream, data is
still delivered in order, so a loss still blocks that stream. And if one
QUIC packet carries data from several streams, losing it blocks all of
them. The QUIC spec advises packing as few streams per packet as it can
without sending underfilled packets.

**It can come back through header compression.** Header compression
can cause head-of-line blocking of its own. HTTP/3's header compression,
QPACK, gives the sender control over how much of that blocking it
allows, trading compression for latency.

**Multiplexing trades one problem for another.** One connection with
many requests is cheaper to set up and shares congestion control. Many
connections avoid TCP head-of-line blocking but each starts from scratch.
Which is better depends on how lossy the path is.

## What this means when you build

- If you multiplex many independent calls over one TCP connection
  (HTTP/2, or your own protocol), a single loss delays all of them. On
  lossy paths, expect tail latency to suffer for that reason.
- In your own protocols, don't force responses into request order unless
  they need to be. Tag each response with its request so a slow one
  doesn't hold back the rest.
- When one TCP connection's latency spikes for every request at once,
  check for retransmissions in a [[packet-capture]] before looking at
  the server.

## Further reading

- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293), IETF, 2022. TCP's reliable, in-order byte stream and why a lost segment must be resent (section 2.2).
- [RFC 9114: HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), IETF, 2022. Why HTTP/2 over TCP stalls on loss, and why HTTP/3 moved to QUIC (section 1).
- [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000), IETF, 2021. How QUIC streams limit a loss to the streams in the lost packet (section 13).
- [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), IETF, 2022. HTTP/1.1's application-layer head-of-line blocking, and HTTP/2 leaving TCP's unsolved (section 1).

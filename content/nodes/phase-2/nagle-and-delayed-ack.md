---
id: nagle-and-delayed-ack
title: Nagle's algorithm and delayed ACKs
depth: short
phase: 2
note: >-
  Two sensible TCP features that together can stall small writes by
  tens of milliseconds. TCP_NODELAY.
needs: [tcp]
leads_to: []
compare_with: []
---

# Nagle's algorithm and delayed ACKs

Nagle's algorithm makes a [[tcp]] sender hold back small writes while
earlier data is still unacknowledged. Delayed ACKs make a TCP receiver
wait a little before acknowledging, hoping to combine the ACK with a
reply. Each saves packets on its own. Together, on a request-response
connection, they can leave both sides waiting on each other until a
timer fires, which on Linux means at least 40 ms added to a request
that should take a fraction of that.

## Nagle: don't send tiny packets while waiting

In 1984 John Nagle was fighting what he called the small-packet
problem. Someone typing into a remote terminal sent one character per
packet: 1 byte of data wrapped in 40 bytes of headers, a 41-byte packet
for every keystroke, a 4000% overhead. On a busy network that overhead
could add to congestion.

His fix was one rule with no timer: if any data you've sent is still
unacknowledged, don't send a new small segment. Buffer the new data
until the ACK comes back or you have a full segment's worth. On an idle
connection nothing is unacknowledged, so the first write goes out at
once. After that, small writes pile up and go together, one batch per
round trip.

RFC 9293 (2022), the current TCP standard, still says a TCP SHOULD
implement Nagle, and that there MUST be a way to turn it off per
connection.

## Delayed ACK: wait, in case there's a reply

On the receiving side, sending an ACK for every segment wastes packets
when the receiver is about to send something back anyway. So receivers
delay the ACK. If the application answers quickly, the ACK rides along
with the answer for free.

The standard puts limits on this: the delay must be under 0.5 seconds,
and a receiver should ACK at least every second full-sized segment. In
Linux the delayed-ACK timer runs between 40 ms and 200 ms; those are
the `TCP_DELACK_MIN` and `TCP_DELACK_MAX` constants in the kernel
source (7.3-rc5, 2026).

## Put them together

A client sends a request in two writes: first the header, then the
body. The server needs both before it can answer.

![A timeline with a client and a server. The client writes the header, which goes out at once. The client then writes the body, which Nagle holds because the header isn't acknowledged. The server has the header but can't reply, so it delays its ACK until the timer fires. Only then does the ACK reach the client, the body goes out, and the server sends its response.](img/nagle-and-delayed-ack-stall.svg)

*The write-write-read pattern that stalls on Nagle plus delayed ACK.*

1. The header goes out at once: the connection was idle.
2. The body is small and the header isn't acknowledged yet, so Nagle
   holds it.
3. The server has the header. It has nothing to send back yet (it
   needs the body), so it delays its ACK.
4. Both sides wait. The client waits for an ACK; the server waits for
   its timer.
5. The timer fires, the ACK goes out, Nagle releases the body, and the
   server finally replies.

No packet was lost and nothing was slow. The delay is just the
delayed-ACK timer. The trouble for request-response applications is
well known, even in the TCP standard, and many applications simply
turn Nagle off.

## Turning it off, and the other knobs

On Linux (tcp(7), man-pages 6.19):

- **`TCP_NODELAY`** disables Nagle for the socket: segments go out as
  soon as possible, even if small. Setting it also flushes anything
  pending.
- **`TCP_CORK`** does the opposite on purpose: hold partial frames
  until you uncork, for example to put a header in front of a file sent
  with `sendfile`. Linux caps corking at 200 ms. It's Linux-only.
- **`TCP_QUICKACK`** asks for ACKs to go out right away instead of
  being delayed, but it isn't permanent. The kernel can drop back to
  delaying ACKs on its own, and the option isn't portable.
- **`tcp_autocorking`** (on by default since Linux 3.14) lets the kernel
  merge consecutive small writes when a packet for the flow is already
  waiting to be sent.

## Where it gets tricky

**Should Nagle be on by default?** The standard still says yes. Some
people who build distributed systems say no. Their argument: servers
today rarely send one-byte messages, batching has moved into
application protocols, and holding data back even one round trip isn't
worth it when a server can do a lot of work in that time. The practical
advice from that camp is to set `TCP_NODELAY` on latency-sensitive
connections without worrying about it.

**`TCP_QUICKACK` isn't a fix.** It fixes the receiver side only, only
for a while, and only on Linux. The sender is still holding data you
asked it to write.

**The stall hides in averages.** It only happens when a small write
follows unacknowledged data and the other side has nothing to send.
So the same code can be fast when a message fits in one write and
slow when it happens to be split.

## What this means when you build

- Set `TCP_NODELAY` on sockets that carry requests and responses: RPC,
  database connections, anything interactive. If you use a client
  library, check whether it sets it for you.
- Better still, don't split a message across writes. Build the whole
  request and write it once.
- If a request takes almost exactly 40 ms (or 200 ms) more than it
  should, suspect this before anything else.

## Further reading

- [RFC 896: Congestion Control in IP/TCP Internetworks](https://www.rfc-editor.org/rfc/rfc896), John Nagle, 1984. The small-packet problem and the original rule, in Nagle's words.
- [RFC 9293: Transmission Control Protocol](https://www.rfc-editor.org/rfc/rfc9293), IETF, 2022. Nagle (3.7.4), delayed ACKs (3.8.6.3), and the note on their bad interaction (Appendix A.3).
- [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html), Linux man-pages, 2026. `TCP_NODELAY`, `TCP_CORK`, `TCP_QUICKACK` and autocorking.
- [include/net/tcp.h](https://raw.githubusercontent.com/torvalds/linux/master/include/net/tcp.h), Linux kernel source, 2026. The delayed-ACK timer bounds.
- [It's always TCP_NODELAY. Every damn time.](https://brooker.co.za/blog/2024/05/09/nagle.html), Marc Brooker, 2024. The case for turning Nagle off by default.

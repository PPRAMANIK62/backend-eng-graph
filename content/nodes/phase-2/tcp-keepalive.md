---
id: tcp-keepalive
title: TCP keepalive and dead peers
depth: short
phase: 2
note: >-
  How a connection notices the other side is gone: keepalive probes and
  TCP_USER_TIMEOUT.
needs: [tcp, nat]
leads_to: []
compare_with: []
updated: 2026-09-29
---

# TCP keepalive and dead peers

An idle [[tcp|TCP]] connection can't tell a quiet peer from a dead
one. The machine at the other end can lose
power, or a NAT in between can forget the connection, and your side
keeps it open for hours. Keepalive probes and the `TCP_USER_TIMEOUT`
socket option are how you put a limit on that.

## Silence looks the same as death

On Linux, an idle ESTABLISHED socket has no timer running at all. TCP
only finds out something is wrong when it sends. If the peer rebooted
and lost the connection, it answers with a reset. If the peer or the
path is gone, your data goes unacknowledged and TCP retransmits it with growing gaps
([[tcp-retransmission]]) until `tcp_retries2` runs out, around 15
minutes with the defaults.

The network in between has its own clock. A [[nat]] must keep an
idle established TCP binding for at least 2 hours 4 minutes (RFC 5382,
2008), but some reap idle ones sooner. Load balancers are often much
shorter: an AWS Network Load Balancer forgets a TCP flow after 350
seconds of silence by default (configurable from 60 to 6000, per its
docs read 2026-09-29), and a client that sends after that gets a reset.

## Keepalive probes

A keepalive probe is an empty segment with a sequence number one below
what the peer expects. It carries nothing, but the peer's TCP has to
answer it: an ACK if it still has the connection, a reset if it lost
it. No answer at all means the peer or the path may be gone.

![A timeline. After the last data, the connection sits idle for tcp_keepalive_time, 2 hours by default, drawn with a break because it's not to scale. Then nine probes go out, 75 seconds apart (tcp_keepalive_intvl). None is answered, and one interval after the ninth the connection is given up with ETIMEDOUT. A bracket under the probes says about 11 minutes of probing with Linux defaults.](img/tcp-keepalive-probes.svg)

*Linux keepalive with default settings, when the peer never answers.*

RFC 1122 (1989) makes keepalives optional, off by default, set per
connection, and at least two hours apart by default. One missed probe
isn't proof of death, since empty ACKs can be lost. Linux follows that:

- `SO_KEEPALIVE` turns them on for a socket.
- `tcp_keepalive_time` (7200 s), `tcp_keepalive_intvl` (75 s) and
  `tcp_keepalive_probes` (9) set the defaults: two hours of silence,
  then about 11 more minutes of probing.
- `TCP_KEEPIDLE`, `TCP_KEEPINTVL` and `TCP_KEEPCNT` override them per
  socket (Linux 2.4 and later, not portable).

In a 2019 Cloudflare test with those set to 5, 3 and 3 seconds, probes
went out at about 5, 8 and 11 seconds, and the connection died with
`ETIMEDOUT` at about 14.

Keepalives only run on a truly idle socket. If there's unacknowledged
data, the retransmission timer is in charge; if the peer's window is
zero, the persist timer is. In both cases keepalive settings change
nothing.

## TCP_USER_TIMEOUT

`TCP_USER_TIMEOUT` (Linux 2.6.37 and later) caps how long sent data may
stay unacknowledged, in milliseconds, before the kernel closes the
connection with `ETIMEDOUT`. That's the fix for the busy case: set it
and `tcp_retries2` no longer applies. It changes only when TCP gives up,
not when it sends.

On an idle connection it does nothing by itself. Combined with
keepalive, it takes over the give-up decision, and the probe count is
ignored: with a 30-second user timeout and `TCP_KEEPCNT` of 3,
Cloudflare saw six probes go out. So pick the two together.

## Heartbeats in the application

Both tools check the TCP connection and nothing more. The probe is
answered by the peer's TCP stack, so a program that's hung but whose
kernel is fine still looks alive. And a TCP load balancer ends your
connection: gRPC's docs point out that `TCP_USER_TIMEOUT` then only
watches the hop to the balancer.

A heartbeat inside the protocol crosses the balancer and reaches the
program. gRPC sends HTTP/2 PING frames and closes the connection if one
isn't answered within its timeout (20 seconds by default). Servers
decide how often they'll accept pings (by default no more than once per
5 minutes without other traffic), and a server that won't take them
eventually closes the connection with a GOAWAY frame. gRPC advises
against client intervals much below a minute.

## Where it gets tricky

**Keepalives can kill good connections.** That's one reason RFC 1122
left them optional: a brief outage that TCP would have ridden out ends
the connection if the probes fail during it.

**Nobody agrees on the user timeout value.** To keep the probe count
meaningful, Cloudflare's post says to set it to `TCP_KEEPIDLE +
TCP_KEEPINTVL × TCP_KEEPCNT` in one place and slightly lower in
another. gRPC sets it to its PING timeout instead.

**The defaults don't fit today's middleboxes.** RFC 5382's NAT minimum
of 2 hours 4 minutes is built around the 2-hour keepalive default, but
a load balancer isn't bound by it, and a two-hour keepalive never
refreshes a 350-second timeout.

## What this means when you build

- On long-lived connections (database pools, message brokers,
  websockets), turn on keepalive with an idle time below the shortest
  idle timeout on the path.
- Set `TCP_USER_TIMEOUT` too, sized against the keepalive settings, so
  a busy connection to a dead peer doesn't hang for 15 minutes.
- If a proxy or load balancer sits in the middle, add a heartbeat in
  the protocol.
- Don't use an application timer that kills transfers just for being
  slow; Cloudflare had exactly that bug.

## Further reading

- [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html), Linux man-pages 6.19, 2026. The keepalive sysctls and socket options, and what `TCP_USER_TIMEOUT` does and doesn't change.
- [When TCP sockets refuse to die](https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/), Marek Majkowski, Cloudflare, 2019. Packet traces of keepalive, the busy and zero-window cases, and how `TCP_USER_TIMEOUT` overrides the probe count.
- [RFC 1122](https://www.rfc-editor.org/rfc/rfc1122), Braden (ed.), IETF, 1989. Section 4.2.3.6: the keepalive rules, how the probe works, and why TCP left keepalives out.
- [RFC 5382](https://www.rfc-editor.org/rfc/rfc5382), Guha (ed.) et al., IETF, 2008. The minimum idle timeout a NAT must give a TCP connection.
- [Network Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/network-load-balancers.html), AWS docs, 2026. A concrete load balancer idle timeout, and the reset you get after it.
- [Keepalive](https://grpc.io/docs/guides/keepalive/), gRPC docs, 2025. PING-based heartbeats, their limits, and why `TCP_USER_TIMEOUT` stops at a TCP load balancer.

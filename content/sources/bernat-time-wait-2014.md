---
id: bernat-time-wait-2014
title: Coping with the TCP TIME-WAIT state on busy Linux servers
author: Vincent Bernat
url: https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux
published: 2014-02-24
accessed: 2026-09-28
kind: blog
primary: false
---

## Summary

A network engineer's careful look at TIME-WAIT on Linux: why it
exists, the three costs it has (a slot in the connection table, memory,
CPU), and what the fixes really do, including why tcp_tw_recycle was
dangerous. Written in 2014, updated in September 2017 when
tcp_tw_recycle was removed.

## Key claims

- Don't enable tcp_tw_recycle; it was removed in Linux 4.12. "Do not enable net.ipv4.tcp_tw_recycle—it doesn’t even exist anymore since Linux 4.12." (TL;DR)
- Most TIME-WAIT sockets are harmless. "Most of the time, TIME-WAIT sockets are harmless." (TL;DR)
- Only the side that closes first enters TIME-WAIT. "Only the end closing the connection first will reach the TIME-WAIT state." (About the TIME-WAIT state)
- Purpose one: keep delayed segments out of a later connection on the same four numbers. "The most known one is to prevent delayed segments from one connection being accepted by a later connection relying on the same quadruplet (source address, source port, destination address, destination port)." (Purpose)
- Purpose two: make sure the other end has closed; if the last ACK is lost the peer sits in LAST-ACK. "The other purpose is to ensure the remote end has closed the connection." (Purpose)
- If the peer is still in LAST-ACK, a new SYN on the same four numbers gets a RST. "Without the TIME-WAIT state, a connection could be reopened while the remote end still thinks the previous connection is valid." (Purpose)
- On Linux TIME-WAIT lasts a fixed 60 seconds. "On Linux, this duration is not tunable and is defined in include/net/tcp.h as one minute" (Purpose)
- The real cost is the slot: the same four numbers can't be used again for a minute. "A connection in the TIME-WAIT state is kept for one minute in the connection table. This means another connection with the same quadruplet (source address, source port, destination address, destination port) cannot exist." (Connection table slot)
- Between a load balancer and one web server, that limits you to about 500 new connections per second with about 30,000 ports. "This means that only 30,000 connections can be established between the web server and the load-balancer every minute, so about 500 connections per second." (Connection table slot)
- On the client side the symptom is EADDRNOTAVAIL from connect(). "The call to connect() will return EADDRNOTAVAIL and the application will log some error message about that." (Connection table slot)
- The fix is more quadruplets: more client ports, more server ports, more addresses. "The solution is more quadruplets." (Connection table slot)
- Memory is small: a TIME-WAIT socket is 168 bytes versus 1776 for a full TCP socket in that kernel. "A struct tcp_timewait_sock is only 168 bytes" and, from the gdb output, "print sizeof(struct tcp_sock) $ 2 = 1776" (Memory)
- The memory used is negligible. "The overhead of TIME-WAIT connections is negligible." (Memory)
- 40,000 inbound TIME-WAIT sockets use under 10 MiB. "If you have about 40,000 inbound connections in the TIME-WAIT state, it should eat less than 10 MiB of memory." (Memory)
- tcp_tw_recycle affected incoming connections too. "This mechanism also relies on the timestamp option but affects both incoming and outgoing connections." (net.ipv4.tcp_tw_recycle)
- Clients behind one NAT don't share a timestamp clock. "because they do not share the same timestamp clock." (net.ipv4.tcp_tw_recycle)
- Servers are better placed to hold TIME-WAIT. "Clients will not have to deal with the TIME-WAIT state pushing the responsibility to servers which are better suited to handle this." (Summary)
- A big count of TIME-WAIT sockets isn't a problem on its own. "is not a problem per se!" (Problems)
- SO_LINGER with a zero timeout closes with a RST, skipping TIME-WAIT but throwing away unsent data. "the connection will be closed with a RST (and therefore, the peer will detect an error) and will be immediately destroyed. No TIME-WAIT state in this case." (Socket lingering)
- tcp_tw_reuse lets an outgoing connection reuse a TIME-WAIT slot after 1 s, relying on TCP timestamps. "an outgoing connection in the TIME-WAIT state can be reused after just one second." (net.ipv4.tcp_tw_reuse)
- Old duplicates are then rejected by their stale timestamps. "Thanks to the use of timestamps, such duplicate segments will come with an outdated timestamp and therefore be discarded." (net.ipv4.tcp_tw_reuse)
- tcp_tw_recycle broke clients behind NAT, and after Linux 4.10's random timestamp offsets it broke everyone; removed in 4.12. "When the remote host is a NAT device, the condition on timestamps will forbid all the hosts except one behind the NAT device to connect during one minute" (net.ipv4.tcp_tw_recycle); "It has been completely removed from Linux 4.12." (Update 2017-09)
- tcp_tw_reuse does nothing for incoming connections. "Enabling net.ipv4.tcp_tw_reuse is useless for incoming connections." (Summary)
- Protocol design advice: let the server close first. "Moreover, when designing protocols, do not let clients close first." (Summary)

## Visuals worth redrawing

- The TCP state diagram, and two sequence diagrams: a delayed segment
  accepted by a new connection when TIME-WAIT is too short, and a new
  SYN hitting a peer stuck in LAST-ACK.

## My notes

- His reason for "do not let clients close first": the TIME-WAIT then
  lands on the server, which is better suited to hold it.
- tcp_tw_reuse default has changed since 2014: kernel docs now say 2
  (loopback only).

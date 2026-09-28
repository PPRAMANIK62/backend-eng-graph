---
id: cloudflare-tcp-sockets-refuse-to-die-2019
title: When TCP sockets refuse to die
author: Marek Majkowski, Cloudflare
url: https://blog.cloudflare.com/when-tcp-sockets-refuse-to-die/
published: 2019-09-20
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

Tests (on Linux 5.2) of how long a TCP socket takes to notice the
other side is gone, in each state: SYN-SENT, SYN-RECV, idle
ESTABLISHED, busy ESTABLISHED and zero window. Each case is shown with
tcpdump and ss output. Ends with advice to use keepalives plus
TCP_USER_TIMEOUT.

## Key claims

- A connect() to a host that drops SYNs retries 6 times and fails after about 130 s. "By default, the whole process takes 130 seconds, until the kernel gives up with the ETIMEDOUT errno." (SYN-SENT)
- SYN retries are at 1, 3, 7, 15, 31 and 63 s. "The retries are staggered at 1s, 3s, 7s, 15s, 31s, 63s marks (the inter-retry time starts at 2s and then doubles each time)." (SYN-SENT)
- The server resends SYN+ACK at 1, 3, 7, 15, 31 s and drops the half-open socket at 64 s. "With default settings, the SYN+ACK is re-transmitted at 1s, 3s, 7s, 15s, 31s marks, and the SYN-RECV socket disappears at the 64s mark." (SYN-RECV)
- Losing the client's final ACK just delays the server. "Losing this ACK doesn't change anything - the server socket will just take a bit longer to move from SYN-RECV to ESTAB." (Final handshake ACK)
- An idle established connection has no timer and lives forever. "These sockets have no running timer by default - they will remain in that state forever, even if the communication is broken." (Idle ESTAB is forever)
- TCP only notices a broken path when it sends. "The TCP stack will notice problems only when one side attempts to send something." (Idle ESTAB is forever)
- With unacknowledged data and every packet dropped, the sender retransmitted 15 times and gave up at about 940 s (15:39 in the trace). "The connection indeed died at ~940 seconds." (Busy ESTAB socket is not forever)
- In that trace the gaps between retransmissions roughly double, starting around 200 ms, and level off at about two minutes. (Busy ESTAB socket is not forever, tcpdump timestamps 00:00.206 to 13:38.524)
- TCP_USER_TIMEOUT overrides tcp_retries2. "With the user timeout set the tcp_retries2 value is ignored." (Busy ESTAB socket is not forever)
- Recommendation: keepalives plus TCP_USER_TIMEOUT. "Set TCP_USER_TIMEOUT to TCP_KEEPIDLE + TCP_KEEPINTVL * TCP_KEEPCNT." (Note about using application timeouts)

Added 2026-09-29 for `tcp-keepalive` (re-opened):

- Keepalive trace with TCP_KEEPIDLE 5, TCP_KEEPINTVL 3, TCP_KEEPCNT 3: probes at about 5, 8 and 11 s, RST at about 14 s, ETIMEDOUT. "After a total of three sent probes, and a further three seconds of delay, the connection dies with ETIMEDOUT, and final the RST is transmitted." (Idle ESTAB is forever)
- Keepalives only run when the send buffer is empty. "For keepalives to work, the send buffer must be empty." (Idle ESTAB is forever)
- TCP_USER_TIMEOUT alone does nothing for idle connections. "On its own, it doesn't do much in the case of idle connections." (Keepalives with TCP_USER_TIMEOUT are confusing)
- The user timeout is checked only when a keepalive timer fires, after the first probe. "The check for user timeout is done only after the first probe went out." (Keepalives with TCP_USER_TIMEOUT are confusing)
- With a large user timeout (30 s, KEEPCNT 3), six probes went out: the count is ignored. "With TCP_USER_TIMEOUT set, the TCP_KEEPCNT is totally ignored." (Keepalives with TCP_USER_TIMEOUT are confusing)
- A busy socket (unacknowledged data) ignores keepalives. "It doesn't matter at all if we set SO_KEEPALIVE - when the "on" timer is running, keepalives are not engaged." (Busy ESTAB socket is not forever)
- Zero-window sockets also ignore keepalives; the persist timer runs instead. "The SO_KEEPALIVE settings don't make any difference when window probing is engaged." (Zero window ESTAB is... forever?)
- Cloudflare's own bug: an application timeout killed slow but healthy downloads. "We abruptly dropped slow downloads, even though this wasn't our intention." (Note about using application timeouts)
- The summary advice says slightly lower than the keepalive total, which differs from the "set to" line in the recommendation list. "should be set to a value slightly lower than TCP_KEEPIDLE + TCP_KEEPINTVL * TCP_KEEPCNT. Otherwise it will affect, and potentially cancel out, the TCP_KEEPCNT value." (Summary)
- SO_KEEPALIVE is ignored during connect (SYN-SENT); TCP_USER_TIMEOUT isn't. "At this moment in the lifetime of a connection, SO_KEEPALIVE settings are ignored, but TCP_USER_TIMEOUT is not." (SYN-SENT)

## Visuals worth redrawing

- The busy-socket retransmission timeline: 15 retries with doubling gaps,
  capped, then ETIMEDOUT.

## My notes

- Tested on Linux 5.2. Defaults may have moved since (see
  kernel-ip-sysctl for today's tcp_syn_retries note: 131 s).

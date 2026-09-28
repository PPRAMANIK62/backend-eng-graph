---
id: man7-tcp
title: tcp(7), Linux manual page
author: Michael Kerrisk and man-pages contributors
url: https://man7.org/linux/man-pages/man7/tcp.7.html
published: 2026-04-19
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The Linux man page for TCP (man-pages 6.19): the /proc/sys/net/ipv4
knobs and the TCP socket options. Useful for window scaling, buffer
sizes, TCP_NODELAY, TCP_QUICKACK, TCP_CORK and choosing a congestion
control algorithm per socket.

## Key claims

- Window scaling allows windows over 64 kB, but only if you raise the buffer sizes. "To make use of them, the send and receive buffer sizes must be increased." (DESCRIPTION)
- Per-socket buffer sizes must be set before listen or connect. "On individual connections, the socket buffer size must be set prior to the listen(2) or connect(2) calls in order to have it take effect." (DESCRIPTION)
- TCP allocates twice the requested buffer size, using the extra for bookkeeping. "Note that TCP actually allocates twice the size of the buffer requested in the setsockopt(2) call" (DESCRIPTION)
- Without scaling, the 16-bit field limits the window. "Normally, the 16 bit window length field in the TCP header limits the window size to less than 64 kB." (tcp_window_scaling)
- tcp_rmem is [min, default, max], and TCP adjusts the receive buffer within that range. "TCP dynamically adjusts the size of the receive buffer from the defaults listed below, in the range of these values, depending on memory available in the system." (tcp_rmem)
- The man page gives 87380 bytes as the tcp_rmem default. "The default value is 87380 bytes." (tcp_rmem, default)
- TCP_NODELAY turns Nagle off. "If set, disable the Nagle algorithm. This means that segments are always sent as soon as possible, even if there is only a small amount of data." (TCP_NODELAY)
- TCP_CORK overrides TCP_NODELAY, and setting TCP_NODELAY flushes pending output. "setting this option forces an explicit flush of pending output, even if TCP_CORK is currently set." (TCP_NODELAY)
- TCP_QUICKACK sends ACKs right away, but isn't permanent. "This flag is not permanent, it only enables a switch to or from quickack mode." (TCP_QUICKACK, since Linux 2.4.4)
- TCP_QUICKACK isn't portable. "This option should not be used in code intended to be portable." (TCP_QUICKACK)
- TCP_CORK holds partial frames, with a 200 ms ceiling. "As currently implemented, there is a 200 millisecond ceiling on the time for which output is corked by TCP_CORK." (TCP_CORK, since Linux 2.2)
- tcp_autocorking coalesces small consecutive writes when a packet is already queued. "Coalescing is done if at least one prior packet for the flow is waiting in Qdisc queues or device transmit queue." (tcp_autocorking, since Linux 3.14)
- TCP_CONGESTION picks the congestion control algorithm per socket. "This option allows the caller to set the TCP congestion control algorithm to be used, on a per-socket basis." (TCP_CONGESTION, since Linux 2.6.13)

Added 2026-09-28 for the transport core nodes (tcp, time-wait):

- Linux TCP implements RFC 793, 1122 and 2001 with NewReno and SACK. "This is an implementation of the TCP protocol defined in RFC 793, RFC 1122 and RFC 2001 with the NewReno and SACK extensions." (DESCRIPTION)
- In order, retransmitted, checksummed. "TCP guarantees that the data arrives in order and retransmits lost packets. It generates and checks a per-packet checksum to catch transmission errors." (DESCRIPTION)
- No message boundaries. "TCP does not preserve record boundaries." (DESCRIPTION)
- Linux supports timestamps, window scaling and PAWS. "Linux supports RFC 1323 TCP high performance extensions. These include Protection Against Wrapped Sequence Numbers (PAWS), Window Scaling and Timestamps." (DESCRIPTION)
- A socket becomes "fully specified" only after connect or accept, and only then can it send. "A socket which has had accept(2) or connect(2) successfully called on it is fully specified and may transmit data." (DESCRIPTION)
- tcp_retries2 defaults to 15, which the man page puts at 13 to 30 minutes. "The default value is 15, which corresponds to a duration of approximately between 13 to 30 minutes, depending on the retransmission timeout." (tcp_retries2)
- TCP_USER_TIMEOUT (since Linux 2.6.37) caps how long sent data may stay unacknowledged before the connection is closed with ETIMEDOUT. "it specifies the maximum amount of time in milliseconds that transmitted data may remain unacknowledged, or buffered data may remain untransmitted (due to zero window size) before TCP will forcibly close the corresponding connection and return ETIMEDOUT to the application." (TCP_USER_TIMEOUT)
- Without it, failure can take up to 20 minutes. "Otherwise, failure may take up to 20 minutes with the current system defaults in a normal WAN environment." (TCP_USER_TIMEOUT)
- tcp_tw_recycle existed from Linux 2.4 to 4.11 and broke with NAT. "Enabling this option is not recommended as the remote IP may not use monotonically increasing timestamps (devices behind NAT, devices with per-connection timestamp offsets)." (tcp_tw_recycle, "Linux 2.4 to Linux 4.11")
- tcp_tw_reuse is listed as a Boolean, "default: disabled"; the kernel doc now says default 2 (loopback only). "Allow to reuse TIME_WAIT sockets for new connections when it is safe from protocol viewpoint." (tcp_tw_reuse)
- SYN cookies are a last resort. "This should be used as a last resort, if at all." (tcp_syncookies)

Added 2026-09-28 for `nagle-and-delayed-ack` audit:

- TCP_CORK is useful for putting headers in front of sendfile data, and isn't portable. "This is useful for prepending headers before calling sendfile(2) , or for throughput optimization." and "This option should not be used in code intended to be portable." (TCP_CORK)
- After TCP_QUICKACK, the kernel moves in and out of quickack mode on its own. "Subsequent operation of the TCP protocol will once again enter/leave quickack mode depending on internal protocol processing" (TCP_QUICKACK)
- tcp_autocorking is on by default. "tcp_autocorking (Boolean; default: enabled; since Linux 3.14)" (tcp_autocorking)

Added 2026-09-29 for `tcp-keepalive`:

- tcp_keepalive_time: idle seconds before the first probe, default 7200, only with SO_KEEPALIVE. "The number of seconds a connection needs to be idle before TCP begins sending out keep-alive probes. Keep-alives are sent only when the SO_KEEPALIVE socket option is enabled." (tcp_keepalive_time, since Linux 2.2)
- With the defaults, a dead idle connection is dropped about 11 minutes after probing starts. "An idle connection is terminated after approximately an additional 11 minutes (9 probes an interval of 75 seconds apart) when keep-alive is enabled." (tcp_keepalive_time)
- tcp_keepalive_intvl default 75 s; tcp_keepalive_probes default 9. "The number of seconds between TCP keep-alive probes." (tcp_keepalive_intvl); "The maximum number of TCP keep-alive probes to send before giving up and killing the connection if no response is obtained from the other end." (tcp_keepalive_probes)
- Per-socket versions TCP_KEEPIDLE, TCP_KEEPINTVL, TCP_KEEPCNT (since Linux 2.4), not portable. "The time (in seconds) the connection needs to remain idle before TCP starts sending keepalive probes, if the socket option SO_KEEPALIVE has been set on this socket." (TCP_KEEPIDLE)
- TCP_USER_TIMEOUT also covers data stuck behind a zero window, and overrides keepalive's give-up rule. "when used with the TCP keepalive (SO_KEEPALIVE) option, TCP_USER_TIMEOUT will override keepalive to determine when to close a connection due to keepalive failure." (TCP_USER_TIMEOUT)
- It doesn't change when packets are sent, only when TCP gives up. "The option has no effect on when TCP retransmits a packet, nor when a keepalive probe is sent." (TCP_USER_TIMEOUT)
- Accepted sockets inherit it from the listener. "This option, like many others, will be inherited by the socket returned by accept(2), if it was set on the listening socket." (TCP_USER_TIMEOUT)
- It only applies in synchronized states (ESTABLISHED through LAST-ACK). "effective only during the synchronized states of a connection" (TCP_USER_TIMEOUT)

## Visuals worth redrawing

None.

## My notes

- The tcp_rmem default here (87380) is older than the kernel's own doc
  (131072, see kernel-ip-sysctl). Trust the kernel doc for current
  defaults.

---
id: kernel-ip-sysctl
title: IP Sysctl (Linux kernel documentation)
author: Linux kernel developers
url: https://docs.kernel.org/networking/ip-sysctl.html
published: 2026 (page built from 7.3.0-rc5)
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The kernel's own list of /proc/sys/net/ipv4 settings with their
defaults. Used for receive buffer autotuning, window scaling and the
congestion control setting. The page served on 2026-09-28 was built
from 7.3.0-rc5.

## Key claims

- tcp_rmem default is 131072 bytes, which gives an initial window of 65535. "This value results in initial window of 65535." (tcp_rmem, default)
- tcp_rmem max depends on RAM. "Default: between 131072 and 32MB, depending on RAM size." (tcp_rmem, max)
- Setting SO_RCVBUF turns autotuning off for that socket. "Calling setsockopt() with SO_RCVBUF disables automatic tuning of that socket’s receive buffer size, in which case this value is ignored." (tcp_rmem, max)
- tcp_wmem max also depends on RAM; SO_SNDBUF disables send autotuning. "Default: between 64K and 4MB, depending on RAM size." (tcp_wmem, max)
- Receive autotuning sizes the buffer to what the path needs, up to tcp_rmem[2]. "If enabled, TCP performs receive buffer auto-tuning, attempting to automatically size the buffer (no greater than tcp_rmem[2]) to match the size required by the path for full throughput." (tcp_moderate_rcvbuf, default 1)
- Window scaling is on by default. (tcp_window_scaling, "Default: 1 (enabled)")
- tcp_adv_win_scale is obsolete. "Obsolete since linux-6.6" (tcp_adv_win_scale)
- tcp_congestion_control sets the algorithm for new connections; reno is always there; the default comes from the kernel build. "The algorithm “reno” is always available, but additional choices may be available based on kernel configuration. Default is set as part of kernel configuration." (tcp_congestion_control)
- Accepted connections inherit the listener's choice, which a program can set per socket. "For passive connections, the listener congestion control choice is inherited." (tcp_congestion_control, which points to setsockopt with TCP_CONGESTION)
- tcp_available_congestion_control lists the registered algorithms; more may exist as unloaded modules. "Shows the available congestion control choices that are registered." (tcp_available_congestion_control)
- tcp_slow_start_after_idle (default 1) times out the congestion window after an idle period of one RTO. "If enabled, provide RFC2861 behavior and time out the congestion window after an idle period." (tcp_slow_start_after_idle)

Added 2026-09-28 for the transport core nodes (ports-and-sockets, tcp-handshake, time-wait, tcp-retransmission):

- The ephemeral port range defaults to 32768-60999. "The default values are 32768 and 60999 respectively." (ip_local_port_range)
- ip_local_reserved_ports keeps listed ports out of automatic assignment. "These ports will not be used by automatic port assignments (e.g. when calling connect() or bind() with port number 0)." (ip_local_reserved_ports)
- somaxconn caps the listen() backlog; 4096 since Linux 5.4. "Limit of socket listen() backlog, known in userspace as SOMAXCONN. Defaults to 4096. (Was 128 before linux-5.4)" (somaxconn)
- tcp_max_syn_backlog limits half-open requests per listener. "Maximal number of remembered connection requests (SYN_RECV), which have not received an acknowledgment from connecting client." and "This is a per-listener limit." (tcp_max_syn_backlog)
- A half-open request is small. "A SYN_RECV request socket consumes about 304 bytes of memory." (tcp_max_syn_backlog)
- SYN-ACK retries: 5, final timeout 63 s. "Default value is 5, which corresponds to 31seconds till the last retransmission with the current initial RTO of 1second. With this the final timeout for a passive TCP connection will happen after 63seconds." (tcp_synack_retries)
- SYN retries: 6, final timeout 131 s. "With this the final timeout for an active TCP connection attempt will happen after 131seconds." (tcp_syn_retries)
- SYN cookies turn on when a listener's SYN queue overflows; default 1. "Send out syncookies when the syn backlog queue of a socket overflows. This is to prevent against the common ‘SYN flood attack’ Default: 1" (tcp_syncookies)
- SYN cookies are a fallback, not a tuning knob. "It MUST NOT be used to help highly loaded servers to stand against legal connection rate." (tcp_syncookies)
- SYN cookies drop TCP extensions. "syncookies seriously violate TCP protocol, do not allow to use TCP extensions, can result in serious degradation of some services" (tcp_syncookies)
- tcp_abort_on_overflow (default off) resets connections when the app accepts too slowly; leave it off. "Enabling this option can harm clients of your server." (tcp_abort_on_overflow)
- tcp_tw_reuse: 0 off, 1 on, 2 loopback only; default 2. "Enable reuse of TIME-WAIT sockets for new connections when it is safe from protocol viewpoint." and "Default: 2" (tcp_tw_reuse)
- tcp_tw_reuse_delay defaults to 1 s and relies on the peer's timestamp clock. "The delay in milliseconds before a TIME-WAIT socket can be reused by a new connection, if TIME-WAIT socket reuse is enabled." and "Default: 1000 (milliseconds)" (tcp_tw_reuse_delay)
- tcp_max_tw_buckets caps TIME-WAIT sockets; lowering it is wrong. "This limit exists only to prevent simple DoS attacks, you _must_ not lower the limit artificially" (tcp_max_tw_buckets)
- Past the cap, TIME-WAIT sockets are destroyed at once. "If this number is exceeded time-wait socket is immediately destroyed and warning is printed." (tcp_max_tw_buckets)
- tcp_fin_timeout is about orphaned FIN_WAIT_2 sockets, not TIME-WAIT; default 60 s. "The length of time an orphaned (no longer referenced by any application) connection will remain in the FIN_WAIT_2 state before it is aborted at the local end." and "Default: 60 seconds" (tcp_fin_timeout)
- tcp_retries2 default 15 gives about 924.6 s before an unacknowledged connection is killed. "The default value of 15 yields a hypothetical timeout of 924.6 seconds and is a lower bound for the effective timeout." (tcp_retries2)
- tcp_retries1 defaults to 3, as RFC 1122 recommends. "RFC 1122 recommends at least 3 retransmissions, which is the default." (tcp_retries1)
- Minimum RTO is 200 ms by default. "Minimal TCP retransmission timeout (in microseconds)." and "Default: 200000" (tcp_rto_min_us)
- Maximum RTO is 120 s by default. "Maximal TCP retransmission timeout (in ms)." and "Default: 120,000" (tcp_rto_max_ms)
- RACK is the only loss detection Linux supports. "currently, setting this bit to 0 has no effect, since RACK is the only supported loss detection algorithm." (tcp_recovery)
- Tail loss probe is on by default (value 3). "Tail loss probe (TLP) converts RTOs occurring due to tail losses into fast recovery (RFC8985)." (tcp_early_retrans, "Default: 3")
- SACK is on by default. (tcp_sack, "Default: 1 (enabled)")
- TCP Fast Open: client side on by default, server side off. "The client support is enabled by flag 0x1 (on by default)." and "The server support is enabled by flag 0x2 (off by default)." (tcp_fastopen)

Added 2026-09-28 for `ip-routing`:

- A Linux box doesn't forward packets between interfaces unless you turn it on. "Forward Packets between interfaces." and "Default: 0 (disabled)" (ip_forward)
- Changing ip_forward switches between host and router defaults. "This variable is special, its change resets all configuration parameters to their default state (RFC1122 for hosts, RFC1812 for routers)" (ip_forward)
- Default TTL for packets this host sends is 64. "Default: 64 (as recommended by RFC1700)" (ip_default_ttl)
- Strict reverse path filtering drops a packet if the interface it arrived on isn't the best route back to its source. "Each incoming packet is tested against the FIB and if the interface is not the best reverse path the packet check will fail." (rp_filter, 1)
- Loose mode is recommended for asymmetric routing. "If using asymmetric routing or other complicated routing, then loose mode is recommended." (rp_filter)
- rp_filter defaults to 0, but distributions may turn it on. "Default value is 0. Note that some distributions enable it in startup scripts." (rp_filter)

Added 2026-09-29 for `pacing` and `bufferbloat`:

- TCP sets each socket's pacing rate from its current rate, with a ratio. "sk->sk_pacing_rate is set by TCP stack using a ratio applied to current rate. (current_rate = cwnd * mss / srtt)" (tcp_pacing_ss_ratio)
- In slow start the ratio is 200%, so the pace can keep up with a window that doubles. "If TCP is in slow start, tcp_pacing_ss_ratio is applied to let TCP probe for bigger speeds" and "Default: 200" (tcp_pacing_ss_ratio)
- In congestion avoidance the ratio is 120%. "tcp_pacing_ca_ratio is applied to conservatively probe for bigger throughput." and "Default: 120" (tcp_pacing_ca_ratio)
- TCP Small Queues cap how much one socket can park in the local qdisc and NIC, to cut local queuing. "tcp_limit_output_bytes limits the number of bytes on qdisc or device to reduce artificial RTT/cwnd and reduce bufferbloat." and "Default: 4194304 (4 MB)" (tcp_limit_output_bytes)
- A bulk sender left alone queues a lot on its own machine. "TCP bulk sender tends to increase packets in flight until it gets losses notifications." (tcp_limit_output_bytes)
- Slow start after idle times out the congestion window after an idle period of one RTO. "If enabled, provide RFC2861 behavior and time out the congestion window after an idle period." (tcp_slow_start_after_idle)

Added 2026-09-29 for `tcp-retransmission` (deep) and `tcp-keepalive` (re-opened; page still built from 7.3.0-rc5):

- The RTO floor can be set per route and per socket, which beat the sysctl; 200 ms or less is called the recommended practice. "Note that the rto_min route option has the highest precedence for configuring this setting, followed by the TCP_BPF_RTO_MIN and TCP_RTO_MIN_US socket options, followed by this tcp_rto_min_us sysctl." and "The recommended practice is to use a value less or equal to 200000 microseconds." (tcp_rto_min_us)
- TCP_RTO_MAX_MS socket option beats tcp_rto_max_ms; changing it may need tcp_retries2 changed too. "Note that TCP_RTO_MAX_MS socket option has higher precedence." (tcp_rto_max_ms)
- tcp_retries2 counts backed-off RTOs starting from the minimum RTO; RFC 1122's 100 s corresponds to at least 8. "Given a value of N, a hypothetical TCP connection following exponential backoff with an initial RTO of TCP_RTO_MIN would retransmit N times before killing the connection at the (N+1)th RTO." and "RFC 1122 recommends at least 100 seconds for the timeout, which corresponds to a value of at least 8." (tcp_retries2)
- RACK's reordering window can be made static at min_rtt/4 (bit 0x2). "makes RACK’s reordering window static (min_rtt/4)." (tcp_recovery)
- TLP needs RACK. "Note that TLP requires RACK to function properly (see tcp_recovery below)" (tcp_early_retrans)
- D-SACK is on by default. "Allows TCP to send “duplicate” SACKs." and "Default: 1 (enabled)" (tcp_dsack)
- F-RTO (RFC 5682) is on by default, sender-side only, for paths where RTT jumps around. "It is particularly beneficial in networks where the RTT fluctuates (e.g., wireless). F-RTO is sender-side only modification." and "By default it’s enabled with a non-zero value." (tcp_frto)
- Timestamps are on by default, with a random offset per connection. (tcp_timestamps, "Default: 1")
- Keepalive defaults: every 2 hours, 9 probes, 75 s apart, about 11 minutes of probing. "How often TCP sends out keepalive messages when keepalive is enabled. Default: 2hours." (tcp_keepalive_time); "Default value: 9." (tcp_keepalive_probes); "Default value: 75sec i.e. connection will be aborted after ~11 minutes of retries." (tcp_keepalive_intvl)

## Visuals worth redrawing

None.

## My notes

- Doesn't say which algorithm distributions pick as the default.
  RFC 9438 says CUBIC is the default in Linux.

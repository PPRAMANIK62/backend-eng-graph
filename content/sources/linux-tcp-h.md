---
id: linux-tcp-h
title: include/net/tcp.h (Linux kernel source)
author: Linux kernel developers
url: https://raw.githubusercontent.com/torvalds/linux/master/include/net/tcp.h
kind: code
primary: true
---

## Summary

The Linux TCP header with the stack's timing constants. Read at
torvalds/linux master, whose Makefile said 7.3.0-rc5.
Used for the delayed-ACK timer bounds and the initial congestion
window.

## Key claims

- The shortest delayed-ACK timeout is HZ/25 jiffies, which is 1/25 of a second (40 ms) whatever HZ is, as long as HZ >= 100. "#define TCP_DELACK_MIN	((unsigned)(HZ/25))	/* minimal time to delay before sending an ACK */" (line 154)
- The longest is HZ/5 jiffies, 1/5 of a second (200 ms). "#define TCP_DELACK_MAX	((unsigned)(HZ/5))	/* maximal time to delay before sending an ACK */" (line 150)
- The minimum retransmission timeout is also HZ/5 (200 ms). "#define TCP_RTO_MIN	((unsigned)(HZ / 5))" (line 162)
- The initial congestion window is 10 segments, following RFC 6928. "/* TCP initial congestion window as per rfc6928 */" then "#define TCP_INIT_CWND		10" (lines 268-269)

Added for `time-wait`:

- TIME-WAIT lasts a fixed 60 seconds, set at compile time (60*HZ jiffies), with no sysctl. "#define TCP_TIMEWAIT_LEN (60*HZ) /* how long to wait to destroy TIME-WAIT" (line 140; the comment goes on "state, about 60 seconds")

## Visuals worth redrawing

None.

## My notes

- HZ is the number of kernel timer ticks per second, so HZ/25 jiffies
  is always 40 ms. The ms values are our arithmetic from the source.
- This is the master branch; line numbers will drift.

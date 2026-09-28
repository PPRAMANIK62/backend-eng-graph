---
id: man7-tc-fq
title: "tc-fq(8): Fair Queue traffic policing"
author: iproute2 project (FQ written by Eric Dumazet)
url: https://man7.org/linux/man-pages/man8/tc-fq.8.html
published: 2015-09-10 (page date; man7 copy from iproute2 git, 2026-08-04)
accessed: 2026-09-29
kind: docs
primary: true
---

## Summary

The man page for Linux's `fq` queueing discipline, the packet
scheduler that does per-flow pacing for locally generated traffic. It
lists the parameters and defaults and names `SO_MAX_PACING_RATE`, the
socket option an application uses to cap its own pacing rate.

## Key claims

- fq is built for per-flow pacing of local traffic, and respects the pacing TCP asks for. "It is designed to achieve per flow pacing. FQ does flow separation, and is able to respect pacing requirements set by TCP stack." (DESCRIPTION)
- Each socket is a flow. "All packets belonging to a socket are considered as a 'flow'." (DESCRIPTION)
- Applications can cap their rate with SO_MAX_PACING_RATE; fq adds delay between packets to hold it. "An application can specify a maximum pacing rate using the SO_MAX_PACING_RATE setsockopt call. This packet scheduler adds delay between packets to respect rate limitation set on each socket." (DESCRIPTION)
- Since Linux 4.20, TCP stamps each packet with its departure time (EDT). "Note that after linux-4.20, linux adopted EDT (Earliest Departure Time) and TCP directly sets the appropriate Departure Time for each skb." (DESCRIPTION)
- fq is non-work-conserving: it can hold packets back even when the link is free. "FQ is non-work-conserving." (DESCRIPTION)
- Pacing helps flows that go idle, where the window would otherwise release a big burst, and replaces slow start after idle. "TCP pacing is good for flows having idle times, as the congestion window permits TCP stack to queue a possibly large number of packets. This removes the 'slow start after idle' choice" (DESCRIPTION)
- Pacing is on by default. "Enable or disable flow pacing. Default is enabled." ([no]pacing)
- A new flow gets an initial credit of 10 MTUs so the initial window of 10 goes out without delay. "This is specifically meant to allow using IW10 without added delay. Default is 10 * interface MTU, i.e. 15140 for 'standard' ethernet." (initial_quantum)
- maxrate caps every flow; a per-socket SO_MAX_PACING_RATE only wins if it's lower. "Application specific setting via SO_MAX_PACING_RATE is ignored only if it is larger than this value." (maxrate)
- Default limits: 10000 packets total, 100 per flow. "Default is 10000 packets." (limit) "Default value is 100." (flow_limit)

## Visuals worth redrawing

None.

## My notes

- socket(7) on man7.org (checked 2026-09-29) doesn't document
  SO_MAX_PACING_RATE; this page is where it's named.
- Enabling: `tc qdisc add dev eth0 root fq` (EXAMPLES shows the form
  with ce_threshold).

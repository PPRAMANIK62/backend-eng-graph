---
id: dumazet-tcp-internal-pacing-2017
title: "tcp: internal implementation for pacing (Linux commit 218af599fa63)"
author: Eric Dumazet
url: https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=218af599fa635b107cfe10acf3249c4dfe5e4123
published: 2017-05-16
accessed: 2026-09-29
kind: code
primary: true
---

## Summary

The Linux commit that lets TCP pace packets itself when the `fq`
qdisc isn't on the outgoing path. Before it, BBR's pacing depended on
fq. Kernelnewbies' Linux 4.13 changelog lists "Internal implementation
for pacing" under networking, so it shipped in Linux 4.13 (2017).

## Key claims

- BBR depends on pacing, which fq did until then. "BBR congestion control depends on pacing, and pacing is currently handled by sch_fq packet scheduler for performance reasons, and also because implemening pacing with FQ was convenient to truly avoid bursts." (commit message)
- Requiring fq wasn't practical everywhere, e.g. routers running fq_codel. "Some routers use fq_codel or other AQM, but still would like to use BBR for the few TCP flows they initiate/terminate." (commit message)
- The fallback is automatic. "This patch implements an automatic fallback to internal pacing." (commit message)
- What turns pacing on. "Pacing is requested either by BBR or use of SO_MAX_PACING_RATE option." (commit message)
- fq wins when present. "If sch_fq happens to be in the egress path, pacing is delegated to the qdisc, otherwise pacing is done by TCP itself." (commit message)
- Pacing in TCP gives better RTT samples. "One advantage of pacing from TCP stack is to get more precise rtt estimations, and less work done from TX completion" (commit message)

## Visuals worth redrawing

None.

## My notes

- Version from https://kernelnewbies.org/Linux_4.13 (opened
  2026-09-29), which lists the commit under TCP changes.

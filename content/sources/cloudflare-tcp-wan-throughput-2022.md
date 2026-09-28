---
id: cloudflare-tcp-wan-throughput-2022
title: Optimizing TCP for high WAN throughput while preserving low latency
author: Mike Freemon (Cloudflare)
url: https://blog.cloudflare.com/optimizing-tcp-for-high-throughput-and-low-latency/
published: 2022-07-01
accessed: 2026-09-28
kind: blog
primary: true
---

## Summary

Cloudflare had capped tcp_rmem at 4 MiB to avoid latency spikes from
the kernel's receive-queue "collapse" work, which also capped
throughput on high-latency paths. The post sizes the receive buffer
from the bandwidth-delay product, raises tcp_rmem, patches the kernel to
limit collapse processing, and measures the gain between real sites.

## Key claims

- The receive window caps bytes in flight. "TCP receive window is the maximum number of unacknowledged user payload bytes the sender should transmit (bytes-in-flight) at any point in time." (intro, before "Linux autotuning")
- On long paths the receive window is often the limit. "It is this receive window that often limits throughput over high-latency networks." (same)
- Linux autotuning sizes buffers per socket from RTT, read rate and memory. "Linux autotuning is logic in the Linux kernel that adjusts the buffer size limits and the receive window based on actual packet processing." (Linux autotuning)
- The window size needed follows from RTT and target throughput. "the window size is determined based upon the RTT and desired throughput of the connection." (Selecting sysctl values)
- They chose 300 ms (measured Zurich to Sydney) and 3500 Mbps, giving a BDP of 131 MB, rounded to 128 MiB. "The calculation for those numbers results in a BDP of 131MB, which we round to the more aesthetic value of 128 MiB." (Selecting sysctl values)
- They had capped tcp_rmem at 4 MiB to limit the kernel's TCP collapse processing, the work of freeing space when a receive buffer hits its memory limit, which caused latency spikes. "The Linux kernel is effective at freeing up space in order to make room for incoming packets when the receive buffer memory limit is hit." (Disabling TCP collapse area) "It was this collapse processing that was causing the latency spikes." (A brief recap of the latency spike problem)
- A small tcp_rmem caps throughput on high-latency links. "The tradeoff is that using a low value for tcp_rmem limits TCP throughput over high latency links." (A brief recap of the latency spike problem)
- The old 4 MiB tcp_rmem meant a 2 MiB window, because of tcp_adv_win_scale. "Note that the 2 MiB corresponds to a tcp_rmem value of 4 MiB due to the tcp_adv_win_scale setting in effect at the time." (same)
- Final settings included net.ipv4.tcp_rmem = 8192 262144 536870912 and a custom patch setting tcp_collapse_max_bytes = 6291456 (not a mainline sysctl). (Setting tcp_collapse_max_bytes; Conclusion)
- Results (iperf3 3.9, kernel 5.15.32, non-Cloudflare hosts sending to Marseille): Iowa (RTT 121 ms) went from 276 to 6600 Mbps, 24x; Melbourne (RTT 282 ms) from 120 to 3800 Mbps, 32x. (Cloudflare production network results, throughput table)
- Even with new settings, Melbourne to Marseille was still limited by the receive window. "Even with the new settings in place, the Melbourne to Marseille performance is limited by the receive window" (same)

## Visuals worth redrawing

- The graph of maximum throughput against latency for a fixed 2 MiB
  window (a 1/RTT curve). Easy to redraw from the formula.

## My notes

- tcp_adv_win_scale is obsolete since Linux 6.6 (kernel-ip-sysctl), so
  the "buffer is twice the window" rule of thumb in this 2022 post is
  dated.
- Software named "perf3 version 3.9" in the text; it's iperf3.

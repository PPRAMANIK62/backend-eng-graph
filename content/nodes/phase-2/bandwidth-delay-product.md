---
id: bandwidth-delay-product
title: The bandwidth-delay product
depth: short
phase: 2
note: >-
  How much data must be in flight to fill a link, and why long fat
  pipes need big windows.
needs: [congestion-control, network-latency, tcp-flow-control]
leads_to: []
compare_with: []
---

# The bandwidth-delay product

The bandwidth-delay product (BDP) is a path's bandwidth multiplied by
its round-trip time. It's how much data has to be in flight, sent but
not yet acknowledged, to keep the path busy. If TCP's windows are
smaller than the BDP, the sender sits idle waiting for ACKs and the
transfer never reaches the link's speed, however fast the link is.

## Filling the pipe

Think of the path as a pipe. Bandwidth is how wide it is; the round
trip is how long it takes a byte to go through and an ACK to come back.
A sender that has sent a full window has to wait for ACKs before it can
send more. So in one round trip it can deliver at most one window, and
its throughput can't beat:

```
throughput ≤ window / round-trip time
```

To keep the link busy all the time, the window has to be at least
bandwidth × round-trip time. That product is the BDP.

A few worked examples:

- A 1 Gbps link with a 100 ms round trip: 1 Gbit/s × 0.1 s = 100 Mbit,
  or 12.5 MB in flight.
- Cloudflare's 2022 sizing: they took 300 ms as the worst round trip on
  their network (measured between Zurich and Sydney) and 3,500 Mbps as
  the most one connection should get, which gives 131 MB. They rounded
  it to 128 MiB for their largest receive buffer.

Round-trip time comes from distance and queues, which is
[[network-latency]]. The same link can have a small BDP inside a data
center and a huge one across an ocean.

## What a fixed window costs you

Turned around, the formula tells you the ceiling a given window puts on
one connection. Our own arithmetic, from window ÷ round trip:

| Window | 1 ms round trip | 10 ms | 100 ms | 300 ms |
|---|---|---|---|---|
| 64 KiB | 524 Mbit/s | 52 Mbit/s | 5.2 Mbit/s | 1.7 Mbit/s |
| 4 MiB | 33.6 Gbit/s | 3.4 Gbit/s | 336 Mbit/s | 112 Mbit/s |
| 128 MiB | 1,074 Gbit/s | 107 Gbit/s | 10.7 Gbit/s | 3.6 Gbit/s |

The 64 KiB row is what you get from the TCP header's 16-bit window
field alone. Paths whose BDP is bigger than that are called long, fat
networks, and RFC 7323 (2014) added window scaling so TCP can describe
windows up to 1 GiB ([[tcp-flow-control]] explains how).

## Two windows have to be big enough

The sender stays under the smaller of two windows, so both have to
reach the BDP:

- **The receive window**, set by the receiver's buffer. On Linux its
  size comes from `tcp_rmem` and autotuning.
- **The congestion window**, the sender's guess at what the network can
  take ([[congestion-control]]). It grows through slow start and
  congestion avoidance, and shrinks on loss. A bigger BDP means more
  round trips to grow into it, and more ground lost with each cut.

Real systems hit both. At Cloudflare, a 4 MiB `tcp_rmem` cap, set to
avoid latency spikes, limited throughput on long paths. After raising
the max to 512 MiB (with a kernel patch of their own to keep the
latency spikes away), measured with iperf3 on Linux 5.15, a transfer
from Iowa to Marseille (121 ms round trip) went from 276 to
6,600 Mbps, and Melbourne to Marseille (282 ms) from 120 to 3,800 Mbps.
Even then, the Melbourne path was still limited by the receive window.
Google saw the same thing on its B4 network in 2016: 75% of its BBR
connections were limited by an 8 MB receive buffer that had been set
low on purpose.

## Where it gets tricky

**More in flight than the BDP doesn't help.** Once a path's BDP is in
flight the link is full, and anything extra waits in a router's queue,
adding delay without adding throughput. BBR is built around keeping
data in flight close to one BDP for this reason.

**The BDP moves.** Bandwidth depends on who else shares the bottleneck,
and the round trip grows when queues fill. A buffer sized for today's
path may be wrong tomorrow, which is why Linux autotunes the receive
buffer per connection rather than using one fixed size.

**Big buffers have their own costs.** Cloudflare had kept `tcp_rmem`
at 4 MiB because, with bigger buffers, the kernel's work to free space in a
full receive buffer caused latency spikes. Raising the cap safely took a
kernel patch, so treat a much larger `tcp_rmem` as a change to test,
not a free win.

## What this means when you build

- Before tuning, work out the BDP of the path you care about:
  bandwidth × round trip. If it's a few KB inside a data center,
  windows won't be your problem.
- For long, fast transfers, check that the max in `tcp_rmem` on the
  receiver is at least the BDP, and that nothing sets `SO_RCVBUF` to a
  small fixed value.
- If one connection can't fill a long path, compare its window with the
  BDP before blaming the network.

## Further reading

- [RFC 7323: TCP Extensions for High Performance](https://www.rfc-editor.org/rfc/rfc7323), IETF, 2014. Long, fat networks and the 64 KiB window limit.
- [Optimizing TCP for high WAN throughput while preserving low latency](https://blog.cloudflare.com/optimizing-tcp-for-high-throughput-and-low-latency/), Mike Freemon, Cloudflare, 2022. Sizing buffers from the BDP on a real network, with before and after throughput.
- [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Neal Cardwell et al., ACM Queue, 2016. The BDP as the point where a path is full, and receive buffers limiting Google's B4.

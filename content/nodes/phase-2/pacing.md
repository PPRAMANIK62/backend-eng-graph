---
id: pacing
title: Pacing
depth: short
phase: 2
note: >-
  Spacing packets out over the round trip instead of sending them in
  bursts.
needs: [congestion-control]
leads_to: []
compare_with: []
updated: 2026-09-29
---

# Pacing

Pacing means a TCP sender spreads its packets evenly over the round
trip instead of sending a whole window back to back and then waiting.
Two senders with the same window and average rate can behave very
differently: the one that bursts builds queues and loses packets at
shallow buffers. On Linux, BBR depends on pacing, and a socket option
lets any program cap its own rate with it.

## Where bursts come from

[[congestion-control]] decides how much data may be in flight, not
when each packet leaves. In steady state the ACK clock spaces them:
each returning ACK releases one new packet.

Plenty of things break that spacing:

- **A new connection.** The initial window, often 10 segments, goes out
  at once, and slow start then sends in growing bursts each round trip.
- **A connection that was idle.** When the window opens again, the whole
  thing is allowed out immediately. Restarting slow start after idle
  avoids that, but it's slow enough that many large deployments turned
  it off and sent a full window at line rate instead.
- **Loss-based growth within a round.** Even in steady state, CUBIC
  sends a burst each round trip and then goes quiet until ACKs arrive.
- **ACKs that arrive in clumps**, from Wi-Fi, cellular and cable links
  or receivers that thin out their ACKs.
- **Offload batches.** To save CPU, Linux hands the NIC large chunks
  (TSO, GSO) that leave as back-to-back packets.

## Why a burst hurts

Say your server sends at 10 Gbps and the path's bottleneck runs at
100 Mbps. A whole window sent at 10 Gbps reaches the bottleneck far
faster than it drains, so up to a full [[bandwidth-delay-product]] can
pile into its buffer at once.

A deep buffer absorbs the burst and adds delay. A shallow one drops
its tail. Google saw this on its B4 wide-area network: losses on its
shallow-buffered commodity switches came mostly from small bursts
arriving at the same moment.

Bursts leave a queue even at the right average rate. A flow that
sends one BDP per round trip as two half-BDP bursts keeps the link
full but holds an average queue of a quarter BDP. Spread evenly, the
same data leaves no queue.

![Two timelines covering one round trip. Top, unpaced: ten packets leave back to back at the start, then nothing until the ACKs return. They reach the bottleneck faster than it can send, a queue builds, and in a shallow buffer the last packets are dropped. Bottom, paced: the same ten packets leave evenly spaced across the round trip and arrive at the bottleneck's own rate, so no queue forms.](img/pacing-burst-vs-paced.svg)

*The same window sent as a burst and paced. Our own drawing.*

## How pacing works

A pacing sender keeps a rate as well as a window. After it sends a
packet, it schedules the next one for:

```
next send time = now + packet size / pacing rate
```

So a 1,500-byte packet at a pacing rate of 100 Mbps (12.5 MB/s) means
one packet every 120 µs. The window still caps how much is in flight;
the rate decides when each packet leaves.

BBR is built around this. Its pacing rate, its bottleneck bandwidth
estimate times a gain, is its main control; the window is a secondary
cap. Without pacing, BBR doesn't work as designed. The BBRv3 draft
(draft-ietf-ccwg-bbr-06, July 2026) paces 1% below its bandwidth
estimate on average, to keep queues low.

## How Linux paces

Linux has two places that can do it.

**The `fq` qdisc.** A queueing discipline for traffic the host sends
itself. It treats every socket as a flow and adds delay between that
flow's packets to respect its pacing rate, holding packets back even
when the link is idle. Pacing is on by default in `fq`, and a new flow
gets a credit of 10 MTUs so the initial window isn't delayed. You turn
it on per interface: `tc qdisc add dev eth0 root fq`.

**Inside TCP.** Linux 4.13 (2017) added pacing inside the TCP stack as
a fallback. It kicks in when a socket asks for pacing, either because
it uses BBR or because it set `SO_MAX_PACING_RATE`, and `fq` isn't on
the outgoing path, for example on a router running `fq_codel`. Before
that, BBR without `fq` meant no pacing.

**Where the rate comes from.** TCP sets every socket's pacing rate from
its current rate, window × segment size ÷ smoothed RTT, times a ratio:
200% in slow start so the pace can keep up with a doubling window, and
120% in congestion avoidance (the defaults of `tcp_pacing_ss_ratio` and
`tcp_pacing_ca_ratio`). A program can cap its own socket with
`setsockopt(SO_MAX_PACING_RATE)`, and `fq`'s `maxrate` caps every
flow on the interface.

## Where it gets tricky

**Which flows get paced depends on the qdisc.** Behind `fq`, every TCP
socket is paced at the rate TCP sets, CUBIC included. Without `fq`,
the in-TCP fallback only paces sockets that asked: BBR, or ones with
`SO_MAX_PACING_RATE`. The same CUBIC server can behave differently on
two machines with different default qdiscs.

**Pacing fixes the rate, not the amount.** A sender that paces at
exactly the bottleneck rate but keeps more than a BDP in flight still
holds a standing queue. That's why BBR caps the window too.

**Pacing and batching pull against each other.** Big offload batches
save CPU but are bursts. BBRv3 sizes each batch to about 1 ms of its
pacing rate, between 2 segments and 64 KB.

## What this means when you build

- If you run BBR, know where pacing happens: inside TCP on Linux 4.13
  and later, or in `fq`, which paces every flow.
- Use `SO_MAX_PACING_RATE` to cap a socket's send rate, say for a
  background copy, instead of sleeping between writes.
- On hosts with idle gaps between large responses, pacing avoids the
  line-rate burst when the window opens again.

## Further reading

- [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Neal Cardwell et al., ACM Queue, 2016. Why BBR paces, and the burst examples.
- [BBR Congestion Control (draft-ietf-ccwg-bbr-06)](https://www.ietf.org/archive/id/draft-ietf-ccwg-bbr-06.txt), IETF CCWG, 2026. Rate vs volume mismatch and the pacing rate.
- [tc-fq(8)](https://man7.org/linux/man-pages/man8/tc-fq.8.html), iproute2, 2026. The `fq` qdisc and `SO_MAX_PACING_RATE`.
- [tcp: internal implementation for pacing](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=218af599fa635b107cfe10acf3249c4dfe5e4123), Eric Dumazet, 2017. How TCP paces without `fq`.
- [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel documentation, 2026. How TCP sets each socket's pacing rate.

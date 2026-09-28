---
id: cardwell-bbr-2016
title: "BBR: Congestion-Based Congestion Control"
author: Neal Cardwell, Yuchung Cheng, C. Stephen Gunn, Soheil Hassas Yeganeh, Van Jacobson
url: https://web.stanford.edu/class/cs244/papers/bbr.pdf
published: 2016-10 (ACM Queue vol. 14 no. 5, September-October 2016)
accessed: 2026-09-28
kind: paper
primary: true
---

## Summary

Google's article introducing BBR (now called BBRv1). It argues loss is
the wrong congestion signal, models the path by its bottleneck bandwidth
and round-trip propagation time, and paces sending to keep about one
BDP in flight. Includes results from Google's B4 WAN and YouTube. The
ACM Queue page (queue.acm.org) returned a Cloudflare block page on
2026-09-28, so this note is from the PDF of the same ACM Queue article
hosted for Stanford's CS244.

## Key claims

- Loss-based control fills deep buffers (bufferbloat). "When bottleneck buffers are large, loss-based congestion control keeps them full, causing bufferbloat." (p. 2)
- On shallow buffers it misreads loss as congestion. "When bottleneck buffers are small, loss-based congestion control misinterprets loss as a signal of congestion, leading to low throughput." (p. 2)
- Treating loss as congestion held in the 1980s because of technology limits. "This equivalence was true at the time but was because of technology limitations, not first principles." (p. 1)
- Loss-based control, even CUBIC, is the main cause of these problems. "Today TCP’s loss-based congestion control—even with the current best of breed, CUBIC11—is the primary cause of these problems." (p. 1)
- When memory was expensive, buffers were only a little bigger than the BDP. "When memory was expensive buffer sizes were only slightly larger than the BDP, which minimized loss-based congestion control’s excess delay." (p. 4)
- Startup doubles the sending rate while delivery rate keeps rising. "Startup implements a binary search for BtlBw by using a gain of 2/ln2 to double the sending rate while delivery rate is increasing." (Single BBR Flow Startup Behavior)
- Policers drop everything above their fill rate once the bucket empties. "once the bucket empties, all packets sent faster than the (much lower than BtlBw) bucket fill rate are dropped." (Token-Bucket Policers)
- A connection has one bottleneck per direction, and that's where queues form. "It’s where persistent queues form." (Congestion and Bottlenecks)
- Two limits, RTprop and BtlBw; their product is the BDP. "Constraint lines intersect at inflight = BtlBw × RTprop, a.k.a. the pipe’s BDP (bandwidth-delay product)." (p. 4, discussing Figure 1)
- Data in flight beyond the BDP only builds a queue and raises RTT. "Since the pipe is full past this point, the inflight – BDP excess creates a queue at the bottleneck" (p. 4)
- Loss-based control operates at the right edge: full bandwidth, high delay. "Loss-based congestion control operates at the right edge of the bandwidth-limited region, delivering full bottleneck bandwidth at the cost of high delay and frequent packet loss." (p. 4)
- Cheap memory made buffers far bigger than BDPs, and RTTs grew to seconds. "the resulting bufferbloat yielded RTTs of seconds instead of milliseconds." (p. 4)
- Kleinrock (1979) showed the left edge is the optimal operating point. "In 1979 Leonard Kleinrock16 showed this operating point was optimal, maximizing delivered bandwidth while minimizing delay and loss" (pp. 4-5)
- pacing_rate is BBR's primary control; cwnd_gain bounds inflight to a small multiple of the BDP. "pacing_rate is BBR’s primary control parameter." (Matching the Packet Flow to the Delivery Path)
- ProbeBW cycles pacing_gain through 1.25, 0.75, then 1.00 for the rest of the cycle, to test for more bandwidth and drain what it queued. (Figure 2)
- Startup doubles the rate each round with gain 2/ln2, finding BtlBw in log2(BDP) round trips but queuing up to 2 BDP; Drain then removes that queue. "This discovers BtlBw in log2BDP RTTs but creates up to 2BDP excess queue in the process." (Single BBR Flow Startup Behavior)
- ProbeRTT: if the RTprop estimate hasn't been refreshed for many seconds, cut inflight to four packets for at least one round trip. (p. 18)
- Google B4 moved from CUBIC to BBR starting 2015; since 2016 all B4 TCP traffic uses BBR. "BBR’s throughput is consistently 2 to 25 times greater than CUBIC’s." (Google B4 WAN Deployment Experience)
- 75% of those BBR connections were capped by an 8 MB receive buffer. "75 percent of BBR connections were limited by the kernel’s TCP receive buffer" (Google B4 WAN Deployment Experience)
- On a 100-Mbps/100-ms link with random loss, CUBIC falls tenfold at 0.1% loss and stalls above 1%. "CUBIC’s throughput decreases by 10 times at 0.1 percent loss and totally stalls above 1 percent." (Figure 8 discussion)
- YouTube: median RTT down 53% globally, over 80% in the developing world. "BBR reduces median RTT by 53 percent on average globally and by more than 80 percent in the developing world." (YouTube Edge Deployment Experience)
- Token-bucket policers cause steady moderate losses under ProbeBW; they added policer detection. (Token-Bucket Policers)
- Against loss-based flows, deep unmanaged buffers let the loss-based flows take more than their share. "Unmanaged router buffers exceeding several BDPs, however, cause long-lived loss-based competitors to bloat the queue and grab more than their fair share." (Competition with Loss-Based Congestion Control)

Added 2026-09-28 for `congestion-control` audit:

- Authors: Neal Cardwell, Yuchung Cheng, C. Stephen Gunn, Soheil Hassas Yeganeh, Van Jacobson (byline, p. 1).
- Figure 1 splits data in flight into three regions. "three different regions (app-limited, bandwidth-limited, and bufferlimited)" (p. 4)
- The 8 MB B4 receive buffer was set low on purpose. "which the network operations team had deliberately set low (8 MB) to prevent CUBIC flooding the network with megabytes of excess inflight" (Google B4 WAN Deployment Experience)
- ProbeRTT triggers after 10 seconds without a new minimum. "for more than 10 seconds, then BBR enters ProbeRTT and reduces the cwnd to a very small value (four packets)." (p. 18)

Added 2026-09-29 for `pacing` and `bufferbloat` (re-read the PDF):

- BBR paces every packet; pacing is part of the design, not an add-on. "To match the packet-arrival rate to the bottleneck link’s departure rate, BBR paces every data packet." (Matching the Packet Flow to the Delivery Path)
- The send routine schedules the next packet at packet size divided by pacing_gain times the bandwidth estimate. "nextSendTime = now + packet.size / (pacing_gain * BtlBwFilter.currentMax)" (send() pseudocode, pp. 10-11)
- In Linux, BBR's pacing runs in the fq qdisc. "In Linux, sending uses the efficient FQ/pacing queuing discipline, which gives BBR line-rate single-connection performance on multigigabit links and handles thousands of lower-rate paced connections with negligible CPU overhead." (Matching the Packet Flow to the Delivery Path)
- Bursts build queue even when average rate is right. "a connection sending a BDP in BDP/2 bursts gets full bottleneck utilization, but with an average queue of BDP/4" (p. 6 of 34, Characterizing the Bottleneck)
- An initial window bigger than the BDP leaves a standing queue even at the right rate. "if a connection starts by sending its 10-packet Initial Window into a five-packet BDP, then runs at exactly the bottleneck rate, five of the 10 initial packets fill the pipe so the excess forms a standing queue" (p. 6 of 34)
- On Google's shallow-buffered B4 switches, loss came mostly from bursts arriving together. "Losses on these shallow-buffered switches result mostly from coincident arrivals of small traffic bursts." (Google B4 WAN Deployment Experience)
- CUBIC sends in bursts within each round, even with pacing; BBR speeds up smoothly. "BBR smoothly accelerates its sending rate, while within every round CUBIC (even with pacing) sends a burst of packets and then imposes a gap of silence." (Single BBR Flow Startup Behavior)
- B4 is built from commodity switches. "Google’s B4 network is a high-speed WAN (wide-area network) built using commodity switches." (Google B4 WAN Deployment Experience)

## Visuals worth redrawing

- Figure 1: delivery rate and RTT against data in flight, with the
  app-limited, bandwidth-limited and buffer-limited regions, the BDP
  line, and where loss-based control and the optimum sit.

## My notes

- Mainline Linux net/ipv4/tcp_bbr.c (7.3-rc5, read 2026-09-28) still
  cites this 2016 article in its header. BBRv3 is specified in the IETF
  draft (ietf-ccwg-bbr-draft).

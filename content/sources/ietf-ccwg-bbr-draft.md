---
id: ietf-ccwg-bbr-draft
title: "BBR Congestion Control (draft-ietf-ccwg-bbr-06)"
author: N. Cardwell, I. Swett, J. Beshay (editors), IETF CCWG
url: https://www.ietf.org/archive/id/draft-ietf-ccwg-bbr-06.txt
kind: spec
primary: true
---

## Summary

The IETF working-group draft specifying BBRv3, intended status
Experimental, version -06 (from 2026, expires in 2027). Not
an RFC. It adds the loss rate to BBR's model and lists where BBRv3 code
lives. Datatracker showed -06 as the latest revision when this was written.

## Key claims

- The draft specifies BBRv3. "This document specifies version 3 of the BBR algorithm, BBRv3." (Abstract)
- BBR models the path from delivery rate, RTT and loss rate, and controls both sending rate and data in flight. "BBR then uses this model to control both how fast it sends data and the maximum volume of data it allows in flight in the network at any time." (Abstract)
- Its claimed benefit over Reno and CUBIC. "BBR offers substantially higher throughput for bottlenecks with shallow buffers or random losses, and substantially lower queueing delays for bottlenecks with deep buffers (avoiding \"bufferbloat\")." (Abstract)
- For CUBIC, 10 Gbps over 100 ms RTT needs very rare loss, and 1% loss caps it near 3 Mbps. "for CUBIC, sustaining 10Gbps over 100ms RTT needs a packet loss rate below 0.000003% (i.e., more than 40 seconds between packet losses), and over a 100ms RTT path a more feasible loss rate like 1% can only sustain at most 3 Mbps [RFC9438]." (1)
- BBRv1 was the earlier version. "The original version of the algorithm, BBRv1, was described previously at a high level [CCGHJ16][CCGHJ17]." (1)
- A design goal is full throughput with average loss up to 1%. "Achieved with average packet loss rates of up to 1%." (3.1)
- Objectives: keep the queue at or below 1.5 estimated BDP, and per-round-trip loss under 2%. "packet loss rate of BBR.LossThresh=2%" (3.2)
- Intended status is Experimental. (header)
- The Linux TCP BBRv3 implementation is in Google's repo (github.com/google/bbr, v3 branch), marked production, last updated in 2023. (Implementation Status)

Added for `pacing`:

- Two things must match the path: rate and volume. Getting the rate wrong with unpaced sending bursts a whole BDP into the queue. "the sender transmits a BDP of data in an unpaced fashion, at the sender's link rate), then up to a full BDP of data can burst into the bottleneck queue, causing high delay and/or high loss." (3.1, rate mismatch)
- The pacing rate controls the spacing between packets. "C.pacing_rate: The current pacing rate for a BBR flow, which controls inter-packet spacing." (2.4)
- BBRv3 paces 1% below its bandwidth estimate on average, to keep queues low. "the BBR.PacingMarginPercent constant of 1 aims to cause BBR to pace at 1% below the bw, on average." (5.6.2)
- Slow start after idle was slow enough that many large deployments turned it off and sent line-rate bursts instead; BBR restarts by pacing. "caused many large deployments to disable this mechanism, resulting in a "BDP-scale line-rate burst" approach instead." (5.4.2)
- Offload batches (TSO/GSO) are bursts too; smaller ones mean shorter queues. "A smaller quantum is preferred at lower data rates because it results in shorter packet bursts, shorter queues, lower queueing delays, and lower rates of packet loss." (5.6.3)
- The send quantum is 1 ms worth of the pacing rate, clamped between 2 segments and 64 KB. "C.send_quantum = C.pacing_rate * 1ms" then "min(C.send_quantum, 64 KBytes)" and "max(C.send_quantum, 2 * C.SMSS)" (5.6.3, SetSendQuantum)
- Linux TCP sends offload aggregates of several packets as one unit. "high-performance transport sender implementations (e.g., Linux TCP) often schedule an aggregate containing multiple packets (multiple C.SMSS) worth of data as a single quantum (using TSO, GSO, or other offload mechanisms)." (5.6.3)
- ACKs and data arrive in clumps on shared-medium links and with ACK thinning. "batching and slotting at shared-medium L2 hops (wifi, cellular, DOCSIS), as well as end-host offload mechanisms (TSO, GSO, LRO, GRO), and end host or middlebox ACK decimation/thinning." (5.5, extra_acked)
- Infrequent ACKs produce bursty ACK arrivals. "the resulting infrequent ACKs can produce bursty ACK arrivals that resemble ACK aggregation." (5.5, extra_acked)
- Volume mismatch: right rate, too much in flight, still a standing queue. "If a sender perfectly matches its sending rate to the available bandwidth, but its C.inflight exceeds the BDP, then the sender can maintain a large standing queue" (3.1)

## Visuals worth redrawing

None beyond the 2016 article's Figure 1.

## My notes

- The draft doesn't say mainline Linux ships BBRv3. Mainline
  tcp_bbr.c (7.3-rc5) still describes the 2016 algorithm and cites the
  2016 article.

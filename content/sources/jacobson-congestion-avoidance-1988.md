---
id: jacobson-congestion-avoidance-1988
title: Congestion Avoidance and Control
author: Van Jacobson and Michael J. Karels
url: https://ee.lbl.gov/papers/congavoid.pdf
kind: paper
primary: true
---

## Summary

The paper behind TCP congestion control, a slightly revised version of
the SIGCOMM '88 paper. After the 1986 congestion collapses, it adds a
congestion window, slow start, and additive increase / multiplicative
decrease to BSD TCP, all derived from a "conservation of packets" idea.

## Key claims

- In 1986 throughput between LBL and UC Berkeley fell about a thousandfold. "the data throughput from LBL to UC Berkeley (sites separated by 400 yards and two IMP hops) dropped from 32 Kbps to 40 bps." (Introduction)
- The cause was in implementations, not the protocol. "much of the cause lies in transport protocol implementations (not in the protocols themselves)" (Introduction)
- Conservation of packets: in equilibrium, a new packet goes in only when an old one leaves. "A new packet isn’t put into the network until an old packet leaves." (Introduction)
- ACKs come back spaced at the bottleneck's rate, so sending on each ACK paces the sender to the slowest link: self-clocking. "So, if packets after the first burst are sent only in response to an ack, the sender’s packet spacing will exactly match the packet time on the slowest link in the path." (Figure 1 caption)
- Slow start: add cwnd, set it to one packet at start or after loss, add one packet per ACK, send the minimum of the receiver's window and cwnd. "On each ack for new data, increase cwnd by one packet." (Section 1, the four bullets)
- Slow start isn't slow: it opens the window in R log2 W. "it takes time R log2 W where R is the round-trip-time and W is the window size in packets" (Section 1)
- Loss from damage is rare, so loss is taken as the congestion signal. "On most network paths, loss due to damage is rare (1%) so it is probable that a packet loss is due to congestion in the network." (Section 3)
- Multiplicative decrease on timeout. "On any timeout, set cwnd to half the current window size (this is the multiplicative decrease)." (Section 3)
- Additive increase of 1/cwnd per ACK, so about one packet per round trip. "On each ack for new data, increase cwnd by 1/cwnd (this is the additive increase)." (Section 3)

Added for `congestion-control` audit:

- 1986 was the first of several collapses. "In October of ’86, the Internet had the first of what became a series of ‘congestion collapses’." (Introduction)
- The fixes went into BSD TCP. "Since that time, we have put seven new algorithms into the 4BSD TCP" (Introduction; the list includes slow-start)
- The name for ACK pacing. "the protocol is ‘self clocking’ (fig. 1)." (Section 1)
- AIMD is named as such. "This is the additive increase / multiplicative decrease policy suggested in [15] and the policy we’ve implemented in TCP." (Section 3)

## Visuals worth redrawing

- Figure 1, "Window Flow Control 'Self-clocking'": packets squeezed
  through a narrow bottleneck spread out in time, and the ACKs keep that
  spacing on the way back.

## My notes

- The 1% damage-loss figure is the paper's 1988 claim about 1988 paths.

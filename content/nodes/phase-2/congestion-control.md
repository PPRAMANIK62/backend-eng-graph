---
id: congestion-control
title: Congestion control
depth: deep
phase: 2
note: >-
  How a TCP sender decides how much data the network between it and the
  receiver can take: slow start, backing off on loss, and CUBIC vs BBR.
needs: [tcp-retransmission]
leads_to: [bandwidth-delay-product, bufferbloat, pacing]
compare_with: [tcp-flow-control, admission-control]
---

# Congestion control

Congestion control is how a TCP sender decides how much data to put into
the network at once, so it doesn't overload the routers and links
between it and the receiver. It decides how quickly a new connection
speeds up, how hard it backs off when packets are lost, and on long
paths whether you get your bandwidth at all. Linux uses CUBIC by
default; BBR is the main alternative, and the two disagree about what
congestion even looks like.

## Why TCP needs it: the collapses of 1986

In 1986 the internet had the first of a series of congestion
collapses. Between Lawrence Berkeley Laboratory and UC Berkeley, two
sites 400 yards apart, throughput fell from 32 Kbps to 40 bps. The
protocol wasn't the main problem. The way TCP implementations behaved
when the network got busy was.

Van Jacobson and Michael Karels fixed it in BSD TCP with one idea they
called conservation of packets. When a connection is running steadily,
a new packet should go into the network only when an old one has left.
And the receiver's ACKs tell you when that happens. Packets that
squeeze through the slowest link on the path come out spaced at that
link's pace, and the ACKs come back with the same spacing. If you send
one new packet per ACK, you automatically send at the rate of the
bottleneck. They called this self-clocking.

That leaves two questions: how to start the clock on a new connection,
and what to do when the network says "too much". Those are slow start
and congestion avoidance.

## The congestion window

The sender keeps a number for each connection, the congestion window
(`cwnd`): how much data it lets itself have sent but not yet
acknowledged. The receiver has its own limit, the window it advertises
in every ACK, which is [[tcp-flow-control]]. The sender stays under
whichever of the two is smaller.

The receiver's window comes straight from a header field. Nothing in
the network sends a number like that, so the sender has to guess `cwnd`
and correct the guess as ACKs and losses come back.

## Slow start: double until something gives

Take a new connection from your API server sending a 1 MB response to
a client.

The server starts with a small initial window. RFC 5681 (2009) allows 2
to 4 segments depending on segment size; RFC 6928 (2013, Experimental)
raised the ceiling to 10 segments, at most 14,600 bytes. The server
sends that much and waits.

Each ACK for new data adds one segment to `cwnd`. A window's worth of
data brings back a window's worth of ACKs, so `cwnd` doubles every
round trip. The name is misleading: reaching a window of W packets
takes only log2(W) round trips. But for a short response on a new
connection, those round trips are most of the cost, because the data
arrives in bursts of 10, 20, 40 segments with a round trip between each.

Slow start ends when `cwnd` passes a threshold called `ssthresh`, or
when a loss shows up.

## Congestion avoidance: add slowly, cut hard

Past `ssthresh`, the sender switches to congestion avoidance and grows
`cwnd` by about one segment per round trip. It keeps growing until the
network pushes back.

In this design, the push-back is loss. In 1988 loss from damaged packets
was rare, so a lost packet almost always meant a queue somewhere had
overflowed. The sender reacts in one of two ways, depending on how it
found the loss ([[tcp-retransmission]] covers the detection):

- **Three duplicate ACKs.** The receiver is still getting later
  segments, so data is still flowing. The sender resends the missing
  segment (fast retransmit), sets `ssthresh` to half the data in flight
  (at least two segments), and carries on from there (fast recovery)
  instead of starting over.
- **A retransmission timeout.** Nothing is coming back. The sender
  sets `ssthresh` to half, drops `cwnd` to one segment, and slow-starts
  back up to the new `ssthresh`.

Adding a little each round trip and halving on loss is called additive
increase, multiplicative decrease (AIMD). Over time it draws a sawtooth.

![A graph of the congestion window over time. It rises steeply in slow start, is cut in half at a loss found by three duplicate ACKs, climbs in a straight line by one segment per round trip, is halved again at a second loss, and after a retransmission timeout drops to one segment and slow-starts up to a new ssthresh line before climbing slowly again.](img/congestion-control-sawtooth.svg)

*Reno-style congestion control over time: slow start, halving on loss, linear growth, and a restart after a timeout. A sketch of the rules in RFC 5681, not measured data.*

One more rule matters for backend services. If a connection has sent
nothing for longer than one retransmission timeout, `cwnd` should drop
back to the restart window, because old ACKs can't clock new data and
the network may have changed. Linux does this by default
(`net.ipv4.tcp_slow_start_after_idle = 1`). So a pooled connection that
sat idle can start its next response slowly, much like a new one.

## CUBIC: grow by the clock, not the ACK count

Adding one segment per round trip is fine when windows are small. On a
path with lots of bandwidth and a long round trip, the window needed to
fill the path is huge (that's the [[bandwidth-delay-product]]), and
after every halving it takes a long time to climb back one segment per
round trip. The problem shows up even at windows of several hundred
packets.

CUBIC changes the growth curve. It remembers the window where the last
loss happened, `W_max`. On loss it cuts `cwnd` to 0.7 of its value
instead of Reno's 0.5. Then it grows the window as a cubic function of
the time since that loss:

```
W(t) = C × (t − K)³ + W_max
```

`C` is 0.4, and `K` is the time it takes to climb back to `W_max`. The
shape does the work. Right after the cut, the window grows fast. As it
nears `W_max`, where things went wrong last time, growth flattens out
and the window sits close to that level. If no loss comes, growth
speeds up again past `W_max` to probe for more room.

Because growth depends on time, not on how many ACKs arrive, two flows
with different round-trip times end up with similar windows, which is
fairer than Reno. And on small, short paths where the cubic curve would
grow slower than Reno, CUBIC just follows Reno's growth.

CUBIC's predecessor BIC-TCP became Linux's default in 2005. CUBIC is now
the default in Linux, Windows and Apple's stacks, and RFC 9438 moved it
to the Standards Track in 2023, calling it the most widely
deployed TCP congestion control. It still treats loss (or an ECN mark)
as the congestion signal.

## BBR: measure the path instead of waiting for loss

In 2016 a team at Google, Jacobson among them, argued that treating loss as
congestion was right in the 1980s because of the technology of the day,
and is now the main cause of slow and laggy connections. Their
alternative is BBR, short for Bottleneck Bandwidth and Round-trip
propagation time.

Picture what happens as you put more data in flight on one path.

![Two stacked graphs sharing an x axis of data in flight. Top: round-trip time stays flat at RTprop until the BDP, then rises in a straight line as extra data queues, until packets are dropped at BDP plus buffer. Bottom: delivery rate rises until the BDP, then stays flat at BtlBw. BBR aims at the BDP; loss-based control ends up at BDP plus buffer.](img/congestion-control-operating-point.svg)

*Round-trip time and delivery rate against data in flight. Adapted from Figure 1 of Cardwell et al., "BBR: Congestion-Based Congestion Control" (ACM Queue, 2016).*

- **Below one BDP** (bottleneck bandwidth times the round-trip
  propagation time), more data means more delivered. The round trip
  stays at its minimum, called RTprop.
- **At one BDP** the bottleneck link is full. Delivery rate hits its
  maximum, BtlBw.
- **Past one BDP** nothing more gets through. The extra data sits in
  the bottleneck's queue, and every extra byte adds delay.
- **Past the queue's size**, packets are dropped.

Loss-based control like CUBIC only backs off at that last point, so it
runs with the bottleneck's buffer full. When routers had small buffers
that cost little. Memory got cheap, buffers grew far past the BDP, and
full buffers pushed round-trip times from milliseconds to seconds. This
is called [[bufferbloat]]. On paths with small buffers the opposite happens:
random losses that have nothing to do with congestion make CUBIC back
off. In the BBR team's test on a 100 Mbps link with 100 ms round trips,
CUBIC's throughput fell tenfold at 0.1% random loss and stalled above
1%.

BBR aims for the other edge: exactly one BDP in flight, full link, no
queue. It keeps two running estimates, the highest delivery rate seen
recently (BtlBw) and the lowest round-trip time seen recently (RTprop).
It [[pacing|paces]] packets out at about BtlBw and caps data in flight at a small
multiple of their product. It moves through a few states:

- **Startup** doubles the sending rate each round trip until delivery
  rate stops growing. It finds the bandwidth in log2(BDP) round trips
  but builds up to two BDPs of queue doing so.
- **Drain** sends slower for a while to empty that queue.
- **ProbeBW**, where it spends most of its time, cycles its pace: a
  round at 1.25 times the estimate to see if more bandwidth has
  appeared, a round at 0.75 to drain whatever that queued, then steady.
- **ProbeRTT**: if the minimum round-trip time hasn't been refreshed for
  many seconds, it cuts data in flight to four packets for at least
  a round trip, so the queue empties and it can measure RTprop again.

Google reported large gains. On its B4 wide-area network, which moved
from CUBIC to BBR from 2015 and ran all TCP traffic on BBR from 2016,
BBR's throughput was 2 to 25 times CUBIC's. In YouTube experiments BBR
cut median round-trip time by 53% globally and by more than 80% in the
developing world.

## Where it gets tricky

**There is more than one BBR.** The 2016 article describes what is now
called BBRv1. The IETF's current draft, draft-ietf-ccwg-bbr-06 (July
2026), specifies BBRv3 and is still Experimental, not an RFC. BBRv3
adds packet loss to the model, aiming to keep loss per round trip under
2%. The Linux BBRv3 code the draft lists lives in Google's own
repository. When someone says "we turned on BBR", ask which one.

**BBR isn't always fair to others, or they to it.** BBR's own authors
found that when router buffers are several BDPs deep, long-running
CUBIC flows fill the queue and take more than their share from BBR.
And ISPs' token-bucket policers, which drop anything above a set rate,
caused steady losses under BBR's probing until policer detection was
added. The loss-based versus model-based argument isn't settled;
CUBIC is still the standard and the default.

**Numbers depend on the path.** Loss-based control needs very little
loss to run fast on long paths. The BBR draft works it out for CUBIC:
10 Gbps over a 100 ms round trip needs a loss rate below 0.000003%, and
at 1% loss the same path manages at most about 3 Mbps. Google's gains
came from its own networks and traffic; yours may differ.

**Flow control and congestion control are easy to mix up.** Both are
windows, both limit the sender. The receiver sets the flow control
window to protect itself. The sender guesses the congestion window to
protect the network. When a transfer is slow, check which of the two is
the smaller one.

**It only controls what you send.** `cwnd` lives on the sender. Your
server's congestion control shapes the responses it sends; uploads to
it are governed by the client's.

## What this means when you build

- Short responses on new connections spend most of their time in slow
  start. Reusing connections helps, but an idle pooled connection may
  restart slowly too.
- On Linux, `net.ipv4.tcp_congestion_control` sets the algorithm for
  new connections, and `tcp_available_congestion_control` shows what's
  loaded. A program can pick one per socket with `setsockopt` and
  `TCP_CONGESTION`, and accepted connections inherit the listener's.
- Before switching to BBR, measure on your own paths and with your own
  traffic, and know which version you're running.
- Slow long-distance transfers are usually either the congestion window
  (loss) or the receive window (buffers). The
  [[bandwidth-delay-product]] tells you how big both need to be.

## Further reading

- [Congestion Avoidance and Control](https://ee.lbl.gov/papers/congavoid.pdf), Van Jacobson and Michael J. Karels, 1988. Where slow start, self-clocking and AIMD come from, with the 1986 collapse as the motivation.
- [RFC 5681: TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681), IETF, 2009. The standard rules for slow start, congestion avoidance, fast retransmit and fast recovery.
- [RFC 6928: Increasing TCP's Initial Window](https://www.rfc-editor.org/rfc/rfc6928), IETF, 2013. The initial window of 10 segments.
- [RFC 9438: CUBIC for Fast and Long-Distance Networks](https://www.rfc-editor.org/rfc/rfc9438), IETF, 2023. The CUBIC spec, its window function and why it beats Reno on long paths.
- [BBR: Congestion-Based Congestion Control](https://web.stanford.edu/class/cs244/papers/bbr.pdf), Neal Cardwell et al., ACM Queue, 2016. The case against loss as a signal, the operating-point figure, and Google's deployment results.
- [BBR Congestion Control (draft-ietf-ccwg-bbr-06)](https://www.ietf.org/archive/id/draft-ietf-ccwg-bbr-06.txt), IETF CCWG, 2026. The current BBRv3 spec and where its code lives.
- [IP Sysctl](https://docs.kernel.org/networking/ip-sysctl.html), Linux kernel documentation, 2026. Choosing the algorithm and the restart-after-idle setting.

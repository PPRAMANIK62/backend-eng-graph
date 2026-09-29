---
id: kulkarni-hlc-2014
title: Logical Physical Clocks and Consistent Snapshots in Globally Distributed Databases
author: Sandeep Kulkarni, Murat Demirbas, Deepak Madeppa, Bharadwaj Avva, Marcelo Leone
url: https://cse.buffalo.edu/tech-reports/2014-04.pdf
kind: paper
primary: true
---

## Summary

The 2014 paper (a University at Buffalo tech report) that
defines hybrid logical clocks. An HLC timestamp is a pair: l, the
largest physical time the node has heard of, and c, a counter that
breaks ties when l doesn't move. It orders events by cause like a
Lamport clock, stays within the clock sync error of physical time, and
fits in a 64-bit NTP-style timestamp.

## Key claims

- Physical time goes backwards. "PT has several kinks such as leap seconds [13, 14] and non-monotonic updates to POSIX time [8] which may cause the timestamps to go backwards." (1.1)
- Logical clocks can't tell you what happened at a given wall time. "Using LC, it is not possible to query events in relation to physical time." (1.1)
- Vector clocks cost one entry per node. "Unfortunately, the space requirement of VC is on the order of nodes in the system, and is prohibitive." (1.1)
- TrueTime has to wait out uncertainty. "Spanner delays event f when necessary." (1.1)
- What HLC gives. "HLC captures the causality relationship like logical clocks, and enables easy identification of consistent snapshots in distributed systems." (Abstract)
- The two parts. "The first part l.j is introduced as a level of indirection to maintain the maximum of pt information learned so far, and c is used for capturing causality updates only when l values are equal." (3.3)
- A naive version that folds everything into one number drifts away from physical time without bound. "the drift between logical clock and physical clock (the l − pt difference) will keep growing." (3.2)
- HLC reads the physical clock and never sets it. "HLC only reads the physical clock but does not update it." (3.4)
- Out-of-bounds messages are dropped to stop a bad clock spreading. "We simply ignore reception of messages that cause l value to diverge too much from pt." (4.1)
- The 64-bit layout: 48 bits of physical time, 16 bits of counter. "This scheme involves restricting l to track only the most significant 48 bits of pt in the HLC algorithm presented in Figure 5." (6.2)
- The counter's room. "16 bits remain for c and allows it room to grow up to 65536, which is more than enough as we show in our experiments in Section 5." (6.2)
- Measured l − pt in one AWS region with 16 ms average NTP offset. "the maximum l − pt difference was observed to be 90.5 ms." (5.1)
- No commit wait needed for causality. "HLC does not require waiting out the clock uncertainty, since it is able to record causality relations within this uncertainty interval using the HLC update rules." (6.3)
- l only carries a physical time some event really saw (Theorem 3). "l.f denotes the maximum clock value that f is aware of" (3.3)
- So HLC stays within clock drift of physical time. "HLC provides nodes a logical time that is within possible clock drift of PT" (7)
- 48 bits still give microsecond granularity. "still gives us microsecond granularity tracking of pt" (6.2)
- Other NTP users are unaffected. "Hence, applications using HLC do not affect other applications that only rely on NTP." (7)
- When a reset or ignore action fires, HLC logs it and raises an exception for the administrator. "the offending entries for inspection" (4.1)
- Spanner's commit wait buys external consistency. "also enable Spanner to provide a stronger property, external consistency" (6.3)
- HLC could get external consistency with a wait before notifying the client. "HLC can also be adopted for providing external consistency and still keeping the throughput on writes unrestricted by introducing client-notification-wait after a transaction ends." (6.3)
- Figure 5, send or local event. "l.j := max(l0 .j, pt.j); If (l.j = l0 .j) then c.j := c.j + 1 Else c.j := 0" (Figure 5, as extracted; l0 is the old l)
- Figure 5, receive. "If (l.j = l0.j = l.m) then c.j := max(c.j, c.m)+1 Elseif (l.j = l0 .j) then c.j := c.j + 1 Elseif (l.j = l.m) then c.j := c.m + 1 Else c.j := 0" (Figure 5, as extracted)
- The naive single-number version, on receive. "l.f is set to max(l.e+1, l.m+1, pt.j)" (3.2)
- It fits the NTP timestamp format. "HLC is backwards compatible with NTP, and fits in the 64 bits NTP timestamp format." (1)

## Visuals worth redrawing

- Figure 5: the HLC update rules for send/local and receive events.
  Redrawn as a worked trace in hybrid-logical-clocks.

## My notes

- The paper says NTP is usually within tens of milliseconds on the
  public Internet and that asymmetric routes can cause errors of 100 ms
  or more (1.1), but the sentence is split by a footnote in the PDF, so
  it isn't quoted.
- HLC gives the one-way guarantee only: e before f implies hlc(e) <
  hlc(f), not the reverse.

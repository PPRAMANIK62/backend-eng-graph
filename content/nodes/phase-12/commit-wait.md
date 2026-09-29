---
id: commit-wait
title: Commit wait
depth: short
phase: 12
note: >-
  Waiting out the clock's uncertainty before a commit becomes visible,
  so timestamps respect real time. Spanner's trick.
needs: [clock-skew, distributed-transactions]
leads_to: []
compare_with: []
---

# Commit wait

Commit wait is how Google's Spanner makes transaction timestamps agree
with real time across machines whose clocks aren't perfectly in sync.
Before a committed write becomes visible, the database waits until its
commit timestamp is certainly in the past. The wait lasts as long as the
clocks' uncertainty, a few milliseconds in Spanner, and in exchange any
transaction that starts afterwards, anywhere, gets a later timestamp.

## The problem it solves

A [[distributed-transactions|distributed database]] gives each
transaction a timestamp and orders transactions by it. With
[[clock-skew|clocks that disagree]], that goes wrong: you commit a
transaction on a machine whose clock runs slow, then tell a friend,
who starts a transaction on a machine whose clock runs fast. The second
transaction can get the smaller timestamp and be ordered first, even
though it started after the first one finished. CockroachDB's engineers
call this anomaly causal reverse. Ruling it out is what separates
[[strict-serializability]] (Spanner calls it external consistency) from
plain serializability.

## TrueTime: time as an interval

Spanner's clock API, TrueTime, never returns a single time. `TT.now()`
returns an interval, earliest to latest, that is guaranteed to contain
the true time at the moment of the call. The error bound is half the
interval's width. Time master machines in every data center, backed by
GPS receivers and atomic clocks, and a daemon on every machine keep that
bound small.

## The wait

When a transaction commits:

1. The coordinator picks the commit timestamp s at or after the latest
   end of `TT.now()`: no machine's true time can be later than that yet.
2. It waits until TrueTime says s has certainly passed: the earliest end
   of a new `TT.now()` interval is after s.
3. Only then does it let the participants apply the write at s and
   release their locks.

![A horizontal axis of true time. An interval labelled TT.now() at commit has an earliest and a latest end; the commit timestamp s is set at the latest end. A dashed segment labelled commit wait runs from s to the moment a later TT.now() interval starts after s; there a line marks that the write becomes visible and locks are released.](img/commit-wait-timeline.svg)

*Commit wait with TrueTime intervals. Drawn from the Spanner paper's description.*

Now any transaction that starts after the write is visible calls
`TT.now()` after true time passed s, so its timestamp is larger. Real
time and timestamp order agree, on every machine, with no communication
between them.

## What it costs

In the 2012 Spanner paper, commit wait was about 5 ms in the one-replica
experiments, next to about 9 ms for the Paxos round. The wait is bounded
by the clock uncertainty, which is why Spanner spends so much on keeping
that small: CockroachDB's engineers cite a bound of 7 ms for Spanner,
against somewhere between 100 and 250 ms they'd expect from NTP.

That's the catch for everyone else. Waiting out the maximum clock offset
works with any clocks and gives the same guarantee, but with NTP-sized
offsets every write would wait a large fraction of a second.

## The alternative: retry reads instead

CockroachDB, which follows Spanner's design without atomic clocks, flips
the trade. It doesn't wait after writes. Instead each transaction
carries an uncertainty interval, from its timestamp up to its timestamp
plus the cluster's maximum clock offset. If a read finds a value written
inside that window, it can't tell whether that write came first, so it
moves its own timestamp forward and retries. A restart happens at most
once per node and never covers more than the uncertainty interval. Their
summary: Spanner always waits after writes; CockroachDB sometimes
retries reads.

The guarantee is weaker. CockroachDB claims serializability, not
linearizability, and only avoids causal reverse for transactions that
share keys, unless clients pass along a causality token. A node whose
clock drifts past the configured maximum offset shuts itself down.

## Where it gets tricky

**The bound is part of correctness.** Commit wait is only as good as
the uncertainty bound. A clock that is more wrong than TrueTime believes
silently breaks the ordering, which is why Spanner evicts machines whose
clocks drift too far.

**Latency moves, it doesn't vanish.** Commit wait adds its milliseconds
to every write's visible latency. The retry approach adds them to some
reads instead, under contention.

## What this means when you build

- If you need real-time order across machines, you either wait out the
  clock uncertainty on writes, or check it on reads. Know which your
  database does.
- Check how your database bounds clock offset, what happens when a
  node exceeds it, and alert on clock drift.
- Don't build commit wait on NTP-synchronized clocks unless you can
  afford a wait of that size on every write.

## Further reading

- [Spanner: Google's Globally-Distributed Database](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), James C. Corbett et al., OSDI 2012. TrueTime, the commit-wait rule, and its measured cost.
- [Living without atomic clocks](https://www.cockroachlabs.com/blog/living-without-atomic-clocks/), Spencer Kimball and Irfan Sharif, Cockroach Labs, 2022. Causal reverse, why waiting out NTP offsets is too slow, and uncertainty intervals as the alternative.

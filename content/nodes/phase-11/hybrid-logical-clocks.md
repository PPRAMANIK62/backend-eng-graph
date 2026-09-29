---
id: hybrid-logical-clocks
title: Hybrid logical clocks
depth: short
phase: 11
note: >-
  Wall time plus a logical counter.
needs: [lamport-clocks, clock-skew]
leads_to: [distributed-transactions]
compare_with: []
---


# Hybrid logical clocks

A hybrid logical clock (HLC) timestamp is a pair: the largest wall-clock
time this node has heard of, plus a small counter. It orders events by
cause like a [[lamport-clocks|Lamport clock]], stays within the clock
sync error of real time, and fits in 64 bits. CockroachDB uses it for
every [[transaction]].

## Why neither clock is enough on its own

A Lamport counter respects cause and effect but has nothing to do with
real time: you can't ask it for the state of the database at noon. The
wall clock is close to real time, but it drifts, gets stepped and goes
backwards (see [[clock-skew]]), so two machines' timestamps can put an
effect before its cause. Spanner closes the gap with special hardware
and waits out a known error bound when it has to. HLC, from a 2014 paper
by Sandeep Kulkarni and others, does it in software, on the clocks NTP
already gives you, with no waiting.

## The two parts

Each node keeps two numbers:

- **l**, the largest physical time it has seen, from its own clock or
  from any message.
- **c**, a counter used only when l doesn't change, to keep timestamps
  increasing.

On a local event or a send, the node reads its wall clock pt:

- l becomes max(l, pt).
- If l didn't change, c goes up by one. If it did, c resets to 0.

On receiving a message stamped (l_m, c_m):

- l becomes max(l, l_m, pt).
- c is one more than the c that goes with whichever l won: its own c,
  the message's c, or the larger of the two if they tie. If the node's
  own wall clock won, c resets to 0.

Timestamps compare by l, then by c.

![Two nodes. Node A's clock is ahead: at wall clock 10 its event gets (10, 0), and it sends a message stamped (10, 0) to node B. Node B's clock is behind. Its first event at wall clock 6 is (6, 0). It receives A's message at wall clock 7 and becomes (10, 1). Its next event at wall clock 8 is (10, 2). When its wall clock reaches 11 the event is (11, 0): l follows the wall clock again and c resets.](img/hybrid-logical-clocks-trace.svg)

*One node running behind another. Adapted from the HLC update rules in Sandeep Kulkarni et al., "Logical Physical Clocks and Consistent Snapshots in Globally Distributed Databases", figure 5 (2014).*

Node B's clock is behind, but after hearing from A it never hands out
a timestamp lower than A's. Once its wall clock passes 10, l follows the
clock again and c goes back to 0.

Why two numbers? The paper first tries one, max(previous + 1, wall
clock, message + 1). It orders events correctly, but with enough
messages going around it drifts further and further ahead of real time.
Splitting it into l and c lets c reset, which keeps both bounded.

## Why it stays close to real time

- **Cause before effect.** If event e happened before f, then e's HLC
  timestamp is smaller, as with a Lamport clock.
- **Never behind the wall clock.** l is always at least the local
  physical time, and it only runs ahead to a time that some node's clock
  really showed. So l is ahead of the local clock by at most the clock
  sync error.
- **A small counter.** c only grows while l is stuck, and l gets unstuck
  once the local clock catches up. In the paper's AWS tests, with a 16 ms
  average NTP offset, the largest gap between l and the wall clock was
  90.5 ms.

The paper packs both into one 64-bit value, the size of an NTP
timestamp: the top 48 bits of physical time (still about microsecond
granularity) for l, and 16 bits for c, room for 65,536 ticks. HLC only
reads the physical clock and never sets it, so other programs using NTP
aren't affected.

## How CockroachDB uses it

In CockroachDB (v26.3 docs), every transaction timestamp is an HLC value,
never below the wall time. Nodes send their HLC with every request, and
the receiver updates its own HLC with it, so a read at a later HLC time
than a write comes after that write.

HLC doesn't free CockroachDB from clocks. It still needs moderately good
synchronization, and a node that finds its clock too far out of step
with at least half the others (80% of the configured maximum offset)
crashes on purpose. Reads also treat values written within that
maximum offset of their own timestamp as uncertain, because with that
much skew it can't tell which came first.

## Where it gets tricky

**It's not TrueTime.** HLC orders events linked by messages. It can't
order two transactions whose only link is outside the system, like a
user who sees one commit and then starts another on a different node.
Spanner handles that case by waiting out its error bound on commit. The
HLC paper suggests you could get the same guarantee by waiting before
telling the client a transaction is done, but plain HLC doesn't do it.
CockroachDB's docs say that skew beyond the configured bound can break
single-key [[linearizability]] between causally dependent transactions,
while [[serializability]] still holds.

**One bad clock can drag everyone forward.** A node whose clock is far
ahead sends a large l, and everyone who hears from it adopts it. The
paper's defence: ignore messages whose l is too far ahead of your own
clock, and alert.

**Still one-way.** A smaller timestamp doesn't prove cause; to detect
concurrent writes you need [[vector-clocks]].

## What this means when you build

- Reach for HLC when you want timestamps that are close to wall time,
  usable for "as of" reads, but that never put an effect before its
  cause. Snapshot timestamps for [[distributed-transactions]] are the
  typical use.
- Put the HLC on every message between nodes, and reject or alert on
  timestamps too far in the future.
- Keep running NTP. HLC tolerates skew; it doesn't remove it.

## Further reading

- [Logical Physical Clocks and Consistent Snapshots in Globally Distributed Databases](https://cse.buffalo.edu/tech-reports/2014-04.pdf), Sandeep Kulkarni, Murat Demirbas et al., 2014. The HLC paper: why a naive version drifts, the update rules (figure 5), bounds, the 64-bit layout and the AWS measurements.
- [Transaction Layer](https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer), Cockroach Labs, CockroachDB v26.3 docs. How a production database uses HLC for transaction timestamps, and what it does when clocks drift too far.

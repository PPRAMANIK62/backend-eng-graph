---
id: leases
title: Leases
depth: short
phase: 12
note: >-
  A lock that expires on its own. Safe only if clocks behave.
needs: [clock-skew, process-pauses]
leads_to: [fencing-tokens, coordination-services, linearizable-reads, distributed-locks]
compare_with: [background-jobs, paxos]
---

# Leases

A lease is permission that runs out on its own. A server grants a
client some right, such as "you alone may write this key" or "you may
cache this file", for a fixed time. If the client crashes or vanishes,
nobody has to notice: the time runs out and the right goes back to the
server. That's why leases hand out locks, leadership and cached data
in systems where machines fail, and why they lean on clocks behaving.

## A lock with a timer on it

Take a file server with many clients caching one file. Each cache
holds a lease on the file for a term, say 10 seconds.
Within the term it can serve reads without asking the server. When a
client wants to write, the server asks the lease holders to give up the
file, or waits until each lease has run out, whichever comes first. A
holder that has crashed or been cut off by a partition doesn't block the
write forever. It only delays it until its lease expires.

That's the point of the original leases paper (Gray and Cheriton,
1989): a failure costs time, not correctness.

Locks and leadership work the same way. A lock service grants a lock
as a lease; a leader keeps its job only while it keeps renewing. Chubby,
Google's lock service, ties every client session to a lease and extends
it through KeepAlive calls, 12 seconds at a time by default. The server
may push the end of a lease later, but never earlier.

## The holder and the server count separately

Each side measures the term on its own clock, starting at different
moments: the grant takes time to travel, and neither clock is exact
([[clock-skew]]).

So the two sides have to be pessimistic in opposite directions:

- **The client stops early.** It counts the lease as shorter than the
  term it was granted: it takes off the time the grant spent travelling,
  and a margin for clock error. Chubby's client keeps exactly this kind of
  conservative local timeout.
- **The server hands it on late.** It waits out the full term by its
  own clock before granting the right to anyone else.

The gap between the two ends is the safety margin.

![Timeline with the server on top and the client below. The server grants a lease; the grant reaches the client after a network delay. The server's lease runs to the end of the term. The client counts from when the grant arrives, takes the travel time off its term, and ends earlier than the server by a margin for clock drift. The gap between the client stopping and the server handing the lease to someone else is marked as the safety margin. A dashed bar shows a client whose clock runs slow: its estimate runs past the server's end, and two holders overlap.](img/leases-timeline.svg)

*The client's view of a lease ends before the server's. If the client's clock runs slow, the overlap is two holders at once.*

## What the clocks must do

Leases don't need clocks that agree on the time of day. If the server
sends the term as a duration, "10 seconds from now", both sides only
need clocks whose rates stay within a known bound of each other.
Chubby writes this down as a rule: the server's clock must not run
faster than the client's by more than a known factor.

The errors aren't symmetric:

- **Server clock too fast, or client clock too slow:** the server thinks
  the lease is over while the client still thinks it holds it. Two
  holders. This breaks safety.
- **Server clock too slow, or client clock too fast:** the client gives
  up early and asks again. Extra traffic, nothing worse.

This is why a lease should be measured as elapsed time on a clock that
only moves forward (a monotonic clock, see [[clock-skew]]), never as a
time of day. If whatever measures the time ever thinks it jumped
backwards, the lease's arithmetic breaks.

## How long should a lease be?

Short terms mean a dead holder blocks others only briefly. Long terms
mean fewer renewals. In the paper's model of their file system,
a term of a few seconds already got most of the benefit: 10 seconds cut
the consistency traffic to 10% of what checking on every read cost.

A server that restarts after a crash may have forgotten which leases
it granted. The simple fix: wait out the longest term before allowing
any writes.

## Where it gets tricky

**A lease is a promise about time, not about behaviour.** The lease
tells the holder when to stop. It can't make it stop. A holder frozen by
a long garbage collection pause ([[process-pauses]]) wakes up with no
idea that its lease ran out, and carries on. Slow networks, timeouts
and retries can eat the remaining time the same way. The fix is on the
side of the resource being protected: [[fencing-tokens]].

**Leases trade availability for safety.** When a holder disappears,
everyone waits for its lease to run out. Chubby even makes clients
wait out a grace period (45 seconds by default) when the server goes
quiet, in case a new server takes over and keeps their sessions alive.

## What this means when you build

- Measure lease time with a monotonic clock, take off the travel time,
  stop early by a margin, and check the time left right before any side
  effect.
- Pick the term as a trade: how long you can bear to wait after a
  holder dies, against how often you can afford to renew.
- Don't treat a lease as mutual exclusion on its own. Pair it with a
  check at the resource ([[fencing-tokens]]), and get it from a
  [[coordination-services|coordination service]].
- Leases also make fast reads possible: a leader holding a lease can
  answer reads without asking the rest of the cluster
  ([[linearizable-reads]]).

## Further reading

- [Leases: An Efficient Fault-Tolerant Mechanism for Distributed File Cache Consistency](http://web.stanford.edu/class/cs240/readings/leases.pdf), Cary G. Gray and David R. Cheriton, SOSP 1989. The paper that introduced leases: the mechanism, how to pick a term, and which clock failures break it.
- [The Chubby lock service for loosely-coupled distributed systems](https://research.google.com/archive/chubby-osdi06.pdf), Mike Burrows, OSDI 2006. Leases in a production lock service: session leases, KeepAlives, the conservative client timeout and the grace period.
- [Leader election in distributed systems](https://aws.amazon.com/builders-library/leader-election-in-distributed-systems/), Marc Brooker, Amazon Builders' Library. How Amazon uses leases in practice, why they rely on elapsed time, and the rules for checking a lease before acting.

---
id: flexible-quorums
title: Flexible quorums
depth: short
phase: 12
note: >-
  Paxos only needs its election quorum and its replication quorum to
  overlap, not both to be majorities.
needs: [paxos]
leads_to: []
compare_with: [quorums]
---

# Flexible quorums

[[paxos|Paxos]] as usually taught uses majorities twice: a majority of
acceptors to elect a leader (phase 1), and a majority to accept each
value (phase 2). Flexible Paxos, a 2016 paper by Heidi Howard, Dahlia
Malkhi and Alexander Spiegelman, showed that this is more than safety
needs. The only overlap that matters is between a phase 1 quorum and a
phase 2 quorum. That opens a trade-off you can tune: make the common
case, replication, cheaper, and pay for it at the rarer moment of
changing leaders.

## Why majorities were there

A new leader must learn about any value that might already have been
chosen, so it doesn't choose a different one. Majorities guarantee
that: any two majorities of the same group share at least one member
(see [[quorums]]), so the new leader's phase 1 quorum always includes
someone from the phase 2 quorum that accepted the old value.

But look at what actually has to meet:

- A **phase 1** quorum (leader election) must intersect every **phase
  2** quorum (replication). That's how a new leader finds out what was
  accepted.
- Two phase 2 quorums don't need to intersect, and neither do two phase
  1 quorums. Nothing in the safety argument depends on it.

## Trading one phase against the other

In Multi-Paxos, a leader is elected once and then
replicates many, many entries. Replication runs far more often than
election. So you can shrink the replication quorum and grow the
election quorum, as long as the two still overlap:

- With **10 nodes**, replicate each entry to just **3**, and require
  **8** to elect a new leader. Every 8 overlaps every 3.
- With an **even number** of acceptors, say 6, the phase 2 quorum can
  drop from 4 to 3 while phase 1 stays at 4. Fault tolerance gets
  better, not worse.

A smaller replication quorum means the leader waits for fewer and faster
acknowledgments, so latency drops. Different entries can go to
different subsets of acceptors, which spreads load and raises
throughput.

**Grid quorums** go further. Arrange the nodes in a grid; a phase 1
quorum is one full row and a phase 2 quorum is one full column. Every
row meets every column, so the phases overlap, while quorums of the
same phase never do. Quorums get much smaller than a majority of the
whole cluster.

## Where it gets tricky

**You pay when the leader fails.** With 3-of-10 replication and 8-of-10
election, the cluster keeps committing while only 3 nodes are up, but it
can't elect a new leader unless 8 are. If the leader dies during a bad
outage, you're stuck until enough nodes return. That's the price, and
it's why this is a choice, not a free win.

**Failures come in groups.** Quorum sizes assume independent failures.
In practice nodes fail together, so place acceptors across machines,
racks or data centers so a quorum doesn't depend on one of them.

**Everyone must agree on the rules.** Leaders, followers and readers
all have to use the same quorum system, or the overlap argument breaks.
Changing it at run time is a reconfiguration problem of its own.

## What this means when you build

- In a standard majority-based system, nothing changes. Flexible quorums
  are an option, not a requirement.
- If replication latency dominates and leader changes are rare,
  consider a smaller replication quorum with a larger election quorum,
  and decide how many failures you must survive during an election.
- With an even cluster size, note that a phase 2 quorum of exactly half
  is safe.

## Further reading

- [Flexible Paxos: Quorum intersection revisited](https://arxiv.org/abs/1608.06696), Heidi Howard, Dahlia Malkhi, Alexander Spiegelman, 2016. The intersection rule, simple and grid quorums, and the availability price.

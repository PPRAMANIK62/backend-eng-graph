---
id: consensus
title: Consensus
depth: deep
phase: 12
note: >-
  Getting nodes to agree on one value despite crashes, using
  overlapping quorums, usually majorities.
needs: [failure-models]
leads_to: [flp-impossibility, replicated-state-machine, byzantine-fault-tolerance, chain-replication, total-order-broadcast]
compare_with: [leader-follower-replication, crdts, quorums, two-phase-commit]
---

# Consensus

Consensus is getting several nodes to agree on one value, and to never
take it back, even when some of them crash and messages get lost or
delayed. It's the piece that lets a cluster pick a new leader or decide
the next write in a log without a human stepping in. Coordination
services like Google's Chubby and Apache ZooKeeper are built around
one.

## The problem, stated precisely

Say three nodes hold copies of a bank ledger. Two clients send
conflicting requests at the same moment: "withdraw 100 for Alice" and
"close Alice's account". The nodes have to agree which one goes next.
If one node applies the withdrawal first and another the closure first,
the copies disagree and there's no fixing it later.

Consensus makes this precise. Some nodes *propose* values, and every
node eventually *decides* one. The rules:

- **Validity:** the decided value is one that someone proposed. (A
  node can't decide "neither" or make something up.)
- **Agreement:** no two nodes decide different values.
- **Finality:** a node decides at most once, and never changes its
  mind.
- **Termination:** every node that doesn't crash eventually decides.

The first three are *safety* rules: they say nothing bad ever happens.
The last is a *liveness* rule: something good eventually happens. Keep
that split in mind, because the whole design of real consensus
algorithms follows from treating the two differently.

Deciding one value sounds small, but it's enough to build everything
else. Run one round of consensus for "what's command 1?", another for
"what's command 2?", and so on, and every node ends up with the same
sequence of commands. Consensus and this kind of ordered delivery
([[total-order-broadcast]]) are formally equivalent: either one can be
built from the other. That sequence is what a
[[replicated-state-machine|replicated state machine]] runs on.

## Why one node isn't enough, and why a majority is

The simplest design is to let one node decide: everyone sends it their
proposal, and it picks the first. That's a leader with a manual
[[failover]]. It works until that node dies, and then nothing can be
decided until a person notices and reconfigures the rest, which takes
minutes at best.

So spread the decision out. Send each proposal to all the nodes, let
each node *accept* at most one value, and call a value *chosen* once a
**majority** has accepted it. The reason a majority works is overlap:

![Top: five nodes A to E. A blue box around A, B and C marks the majority that accepted value x. A dashed box around C, D and E marks any other majority. The two boxes overlap at C, so any later majority always includes a node that saw x. Bottom: the same five nodes with D and E crashed. A, B and C, three of five, are still a majority and can still decide. A note says a third crash would leave two of five, no majority, so the cluster stops deciding but never decides wrong.](img/consensus-majority-overlap.svg)

*Any two majorities overlap, which is what makes a decision stick. Adapted from Kleppmann, "Distributed Systems" lecture notes, slide 108.*

Any two majorities of the same group share at least one node. If
majority 1 accepted x, then any later majority, for a vote or a new
proposal, contains at least one node that knows about x. The
algorithm's job is to make sure that node's knowledge wins, so a second
value can never also be chosen.

The overlap also sets how many failures you can survive. With 2f + 1
nodes, f can crash and the remaining f + 1 are still a majority. Three
nodes survive one crash, five survive two. A fourth node doesn't buy
you anything over three: the majority of four is three, so it still
survives only one crash. That's why clusters come in odd sizes.

If more than f nodes are down, there's no majority, and the cluster
stops deciding. It doesn't decide wrong; it just waits. That's the
safety/liveness split again: losing too many nodes costs you progress,
never correctness.

## Numbers stop old proposals and old leaders

Majorities alone aren't enough. Two proposers can each get part of the
cluster to accept their value, and with a crash nobody can tell which
one got a majority. So every attempt carries a **number** that only
goes up: a proposal number in Paxos, a **term** in Raft. Nodes promise
to ignore anything with a lower number than one they've already seen.

Most real systems use numbers to elect a single **leader** that
proposes everything. The rules that make this safe:

1. Each election starts a new, higher term.
2. A node votes at most once per term.
3. A candidate needs votes from a majority to lead that term.

Two majorities overlap, so there can't be two leaders in the same term.
There can still be two leaders at once from *different* terms. Say the
leader of term 5 gets cut off by a [[network-partitions|network
partition]]. The others time out, elect a new leader in term 6, and
the old one doesn't know. It keeps trying to act.

That's why a leader has to go back to a majority for every single
decision, not just its election. Any majority it contacts overlaps the
majority that elected the newer leader, so at least one node answers
"I've seen term 6". The old leader learns it's been replaced and can't
decide anything more. How [[raft]] and [[paxos]] each implement this
is in their own articles; [[raft-elections]] covers the election part.

## Safe always, live only when the network behaves

How long can a message take? The answer, the timing part of your
[[failure-models|failure model]], decides what's possible:

- **Asynchronous:** no limit at all. Then the
  [[flp-impossibility|FLP result]] applies: no deterministic algorithm
  can guarantee it will ever decide, even if only one node may crash.
  The trouble is that a crashed node and a slow one look the same.
- **Partially synchronous:** the network may misbehave for a while,
  but eventually delays stay within some limit nobody knows in
  advance. Under this model, crash-tolerant consensus is possible if
  and only if more than half the nodes are working (N ≥ 2f + 1).

Paxos, Raft and their relatives assume partial synchrony, nodes that
crash and later recover from disk, and a network that loses messages
but eventually gets one through if you keep retrying. They use clocks
for one thing only: [[failure-detection|timeouts that detect a dead
leader]] and start an election. Safety never depends on those timeouts.
A timeout that fires wrongly can start a pointless election and waste
time, but it can't make two nodes decide differently.

Raft states the timing it needs for liveness as a rule of thumb: the
time to send a message to every node and hear back should be much
smaller than the election timeout, which should be much smaller than
the average time between failures of one server. With storage that has
to be written before each reply, the round trip is roughly 0.5 ms to
20 ms, which puts the election timeout somewhere between 10 ms and
500 ms.

## Where it gets tricky

**"Majority" is the usual answer, not the rule.** What consensus really
needs is that the group that elects a leader and the group that
accepts each value always overlap. Flexible Paxos (2016) showed the
two phases don't each need a majority: in a ten-node cluster,
replication could use three nodes if leader changes use eight. You get
faster writes and pay with fewer failures tolerated during a leader
change. Majorities are still the usual choice.

**Liveness can fail even with everyone up.** Two proposers can keep
outbidding each other with higher numbers forever, and nothing gets
decided. Electing a single leader fixes it in practice, and because of
FLP, that election has to rely on timeouts or randomness.

**Consensus is only as good as its disk.** A node must remember what it
promised and accepted across a restart, so it writes that to stable
storage before replying. Lose that state, through a corrupted or wiped
disk, and the node can break a promise and let a second value win.
Google's Chubby team hit exactly this and had a replica with a
corrupted disk rejoin without a vote for a while, until it was safe
again.

**Changing who's in the cluster is dangerous.** Nodes can't all switch
from the old member list to the new one at the same instant, and in
between, a majority of the old list and a majority of the new one
might not overlap. Two leaders could then win the same term. Membership changes need their own protocol; see
[[raft-membership-changes]].

**Crashes aren't lies.** Everything above assumes nodes fail by
stopping. If some nodes may send wrong or malicious messages, you need
[[byzantine-fault-tolerance]], which costs more nodes (3f + 1) and far
more complexity.

**The paper isn't the product.** Google's report on building Chubby's
Paxos log found that a page of pseudo-code became several thousand
lines of C++, and that the gaps between the published algorithm and a
real system (disk corruption, leases for reads, membership, snapshots)
were significant and took real work to close.

## What this means when you build

- Don't write your own consensus for production. Use a system built on
  a tested one, such as one of the [[coordination-services]], or a
  database that has it inside.
- Run three or five nodes. Four is no safer than three.
- Every decision costs a round trip to a majority plus a disk write on
  each of them. Put consensus on the path of things that must be
  agreed (leadership, metadata, ordering), not on every byte.
- Expect the cluster to stop, not to lie, when it loses its majority.
  Plan your alerts and your capacity around that.
- Protect the disks of consensus nodes. Losing a node's state is worse
  than losing the node.

## Further reading

- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Section 6: consensus as automated failover, its equivalence with total order broadcast, terms, and why a leader asks a quorum for every decision.
- [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf), Leslie Lamport, 2001. The safety rules and the majority argument, derived step by step.
- [Unreliable Failure Detectors for Reliable Distributed Systems](https://www.cs.utexas.edu/~lorenzo/corsi/cs380d/papers/p225-chandra.pdf), Tushar Deepak Chandra and Sam Toueg, 1996. The formal statement of consensus, and why eventually accurate failure detection needs a majority.
- [Consensus in the Presence of Partial Synchrony](https://groups.csail.mit.edu/tds/papers/Lynch/jacm88.pdf), Cynthia Dwork, Nancy Lynch and Larry Stockmeyer, 1988. The timing model real systems assume, and the 2f + 1 and 3f + 1 bounds.
- [In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. Section 2 on what practical consensus guarantees, and 5.6 on the timing it needs.
- [Flexible Paxos: Quorum intersection revisited](https://arxiv.org/abs/1608.06696), Heidi Howard, Dahlia Malkhi and Alexander Spiegelman, 2016. Why only the overlap between phases matters.
- [Paxos Made Live](https://research.google.com/archive/paxos_made_live.pdf), Tushar Chandra, Robert Griesemer and Joshua Redstone, Google, 2007. What it took to run Paxos in production under Chubby.

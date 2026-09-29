---
id: total-order-broadcast
title: Total order broadcast
depth: short
phase: 12
note: >-
  Delivering the same messages in the same order to every node, and why
  that is the same problem as consensus.
needs: [consensus]
leads_to: []
compare_with: [log-based-messaging]
---

# Total order broadcast

Total order broadcast is a way of sending messages to a group of nodes
so that every node delivers them in the same order. If one node
delivers m1 before m2, every node delivers m1 before m2. That's all it
promises, and it turns out to be exactly what you need to keep replicas
identical, and exactly as hard as [[consensus]].

## A ladder of broadcast guarantees

Broadcast means one node sends a message that should reach all nodes,
including itself. Delivery orders get stronger in steps:

| Broadcast | Guarantee |
|---|---|
| FIFO | Messages from the same sender arrive in the order that sender sent them |
| Causal | If sending m1 happened before sending m2, m1 is delivered first everywhere |
| Total order | All nodes deliver all messages in the same order |
| FIFO-total order | Both FIFO and total order |

The first two only order messages that are related. Two messages sent
at the same time by different nodes can arrive in different orders at
different nodes. Total order broadcast removes that freedom: there is
one sequence, and everyone sees it. That's why the sender also delivers
its own message to itself: it has to wait for its message's place in
the sequence like everyone else.

## Why you'd want it

Give every replica the same starting state and feed it the same
commands in the same order, and every replica ends up in the same state.
That's a [[replicated-state-machine]], and total order broadcast is the
"same order" part. Leader-based database replication is a version of
it: followers apply the leader's commits in one order, sometimes called
passive or primary-backup replication.

The cost is that a replica can't apply its own update right away. It
broadcasts the update and waits until it comes back through the
broadcast, in its place in the order.

With weaker broadcast, replicas can only converge if updates commute,
so order doesn't matter. That's the design space of [[crdts]].

## Two simple designs, both fragile

- **A leader as sequencer.** Everyone sends messages to one leader,
  which forwards them to all nodes with FIFO broadcast. Its order
  becomes the order. If the leader crashes, nothing more is delivered,
  and choosing a new leader safely is the hard part.
- **Lamport timestamps.** Stamp every message with a
  [[lamport-clocks|Lamport clock]] and deliver in timestamp order. But
  before delivering a message stamped T, a node must know it has seen
  every message with a smaller stamp, which means waiting to hear from
  every node. One silent node stops everyone.

Neither survives a single crash. Making total order broadcast
fault tolerant requires consensus.

## The same problem as consensus

Consensus and total order broadcast are formally equivalent: either can
be built from the other. Run one consensus instance per position in the
sequence, and you get a totally ordered log. That's what Multi-Paxos,
[[raft]], Viewstamped Replication and Zab provide. Raft in particular is
designed to give FIFO-total order broadcast directly, while Paxos in its
original form decides a single value.

## Where it gets tricky

**Delivery is not arrival.** A message can reach a node long before the
node is allowed to deliver it, because it has to wait for its place in
the order. Latency comes from waiting, not just from the network.

**It inherits consensus's limits.** A fault-tolerant version is a
consensus protocol underneath, with the same need for enough live nodes
to make progress (see [[consensus]]).

**A log in a broker is close, but check the guarantee.** A single
partition of a [[log-based-messaging|log-based broker]] gives every
reader the same order. Whether that order survives a failover without
losing or reordering messages depends on how the broker replicates it.

## What this means when you build

- If replicas must stay identical, route every update through one
  ordered log, and apply updates only when they come back from it.
- Don't build the log yourself on a single sequencer or timestamps
  unless you accept that one crash stops it. Use a consensus library or
  a service built on one.
- If you can make updates commute instead, you can drop total order and
  its availability cost.

## Further reading

- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Sections 4.2 and 4.3 on broadcast orders and algorithms, 5.3 on replication through broadcast, and 6.1 on its equivalence with consensus.

---
id: pacelc
title: PACELC
depth: short
phase: 11
note: >-
  Even with no partition, you trade latency against consistency.
needs: [cap-theorem, sync-vs-async-replication, quorums]
leads_to: []
compare_with: []
---

# PACELC

PACELC (say "pass-elk") asks two questions about a replicated database
instead of one. If there's a Partition, does it choose Availability or
Consistency? Else, when everything is running normally, does it choose
Latency or Consistency? The [[cap-theorem]] only covers the first
question, which comes up rarely. The second one comes up on every
request.

## The tradeoff that's always there

CAP says what a system must give up while the network is split (a
[[network-partitions|partition]]). It says
nothing about normal operation. Yet many databases that relax
consistency do it all the time, partition or not. Daniel Abadi's point, in
IEEE Computer (2012), is that the reason is usually latency, not CAP.

Here's why. As soon as you keep copies of data on more than one machine
(see [[replication]]), every write faces a choice:

- **Wait for the copies.** The write is confirmed only once other
  replicas have it ([[sync-vs-async-replication|synchronous
  replication]]). Every read can then be consistent, but each write is
  as slow as the slowest replica it waits for, and over a wide-area
  network that's slow.
- **Don't wait.** Confirm the write once one node has it and copy it
  later. Reads served by a nearby replica are fast, but that replica may
  not have the latest write yet.

Quorum systems sit in between: with R + W > N, a read touches at least
one replica that took the write (see [[quorums]]), and you pay latency
for it. A study of Cassandra found reads that checked several replicas
could be four or more times slower than reads from any single replica.
Over a WAN there's no way around this: consistency needs a message on the
slow path, and speed means skipping it.

## Two letters, four kinds of system

![A decision tree. The question "Is there a partition?" splits into P: yes, leading to "Availability or consistency?", which is rare and only while the network is split, and E: else, running normally, leading to "Latency or consistency?", which comes up on every request as soon as you replicate. Below, examples as classified in 2012 with default settings: PA/EL for Dynamo, Cassandra and Riak; PC/EC for VoltDB/H-Store, Megastore and BigTable/HBase; PA/EC for MongoDB at the time; PC/EL for Yahoo's PNUTS.](img/pacelc-two-questions.svg)

*The two questions, with Abadi's examples. Adapted from Daniel J. Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design" (2012).*

- **PA/EL**: gives up consistency both times. Dynamo, Cassandra and Riak
  by default. Once your application copes with stale or conflicting data,
  you might as well take the latency win too.
- **PC/EC**: refuses to give up consistency, and pays in latency and
  availability. Fully [[acid|ACID]] systems such as VoltDB and Megastore, and
  BigTable and HBase.
- **PC/EL**: Yahoo's PNUTS. Reads come from any replica, so they're fast
  and can be stale; but if the master for an item is cut off, the item
  can't be written. That looks odd, getting "more consistent" during a
  partition. It isn't: PC means it doesn't get *less* consistent than
  usual, it loses availability instead.
- **PA/EC**: MongoDB as Abadi described it then. Consistent normally,
  but after a [[failover]], writes the old primary hadn't replicated end up
  out of line with the new one.

PNUTS is the clearest case for the whole idea. It relaxes consistency in
normal operation even though it's CP under a partition, so CAP can't be
the reason; latency is.

## Where it gets tricky

**Labels describe defaults, and defaults change.** Most of these systems
have knobs. Raise R + W and a Dynamo-style store buys consistency with
latency. MongoDB is a good example of a label going stale: today's manual
(8.3) makes a majority of the replica set the implicit default for
writes (sets with arbiters are an edge case), so a write waits for
other members; waiting only for the primary
(`w: 1`) is now the opt-in, and those writes can be rolled back if the
primary steps down. Classify your configuration, not the product.

**Availability and latency blur.** A system too slow to answer before
the client times out is, to that client, unavailable. PACELC treats
availability as extreme latency, which is also why the E side matters
so much in practice.

**It's a way to think, not a theorem.** CAP was proved; PACELC is a
classification. The "C" in PACELC isn't always full
[[linearizability]], and Abadi himself says neither CAP nor PACELC
explains every tradeoff.

## What this means when you build

- For each datastore, ask both questions: what does it do when the
  network splits, and what does a normal read or write wait for?
- The E answer is the one you live with daily. Check the write setting
  (how many replicas confirm) and the read setting (which replica
  answers) you're actually running with.
- If you need consistency across regions, budget a wide-area round trip
  on the paths that need it, and only those.

## Further reading

- [Consistency Tradeoffs in Modern Distributed Database System Design](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf), Daniel J. Abadi, IEEE Computer, 2012. The article that defines PACELC, with the replication options behind the latency tradeoff and the classification of Dynamo, Cassandra, PNUTS and others.
- [Write Concern](https://www.mongodb.com/docs/manual/reference/write-concern/), MongoDB manual 8.3. How many replicas a MongoDB write waits for today, and what `w: 1` risks.

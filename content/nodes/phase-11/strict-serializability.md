---
id: strict-serializability
title: Strict serializability
depth: short
phase: 11
note: >-
  Serializable plus real-time order: transactions look one at a time, in
  the order they actually happened.
needs: [serializability, linearizability]
leads_to: []
compare_with: []
---

# Strict serializability

Strict serializability is [[serializability]] with one more rule: the
order the transactions appear to run in has to agree with the order
they actually happened. If transaction A commits before transaction B
starts, B must see A. That sounds like something every database would
promise. Plain serializability doesn't, and the gap is where some
surprising bugs live.

## What plain serializability leaves out

Serializability says the result of running transactions concurrently
is the same as running them one at a time in *some* order. It doesn't
say which order, and nothing ties that order to real time. So this is
allowed:

1. You run a transaction that sets your profile name to "Ada" and
   commits.
2. A moment later you run a read-only transaction that reads your name.
3. It returns the old name.

The database can place your read "before" your write in its serial
order, and the history is still serializable. Taken to the extreme, a
database that answered every read-only transaction as if it ran at the
very beginning, against an empty database, would be serializable and
useless.

[[linearizability|Linearizability]] has the missing rule, but it is
about single operations on single objects: each read or write takes
effect at one instant between its start and its end.

## Both at once

Strict serializability combines the two:

- from serializability, whole transactions over many objects appear to
  run one at a time, atomically, with no interleaving;
- from linearizability, that one order respects real time: if A
  completes before B begins, A comes first.

A handy way to picture it: the whole database behaves like a single
linearizable object. Herlihy and Wing defined it exactly this way when
they introduced linearizability. It goes by several names, including
strong serializability and strong one-copy serializability. Google's
Spanner calls its version **external consistency**, and describes it as
linearizability of the transaction commit order.

It sits at the top of the [[consistency-models]] chain and implies both
serializability and linearizability.

## Who gives it, and at what cost

**Single-node locking gives it for free.** Two-phase locking with long
read and write locks provides strict serializability, not just
serializability, because a transaction that holds its locks until
commit can't be ordered before one that finished earlier. Some
multiversion designs are serializable without being strict.

**Across machines, it needs coordination.** In a partitioned network,
some or all nodes must stop making progress; strict serializability
can't stay available the way weaker models can. Distributed databases
pay for it with consensus and careful use of time. Spanner uses its
TrueTime clocks and waits out their uncertainty before making a commit
visible ([[commit-wait]]).

## Where it gets tricky

**"Serializable" is the weaker promise.** A database that says
serializable promises some serial order, not necessarily the real-time
one. Check whether stale reads after your own commit are possible.

**Replicas break it easily.** A read served by a lagging replica can
miss a transaction that committed before the read began. That's still
serializable, and no longer strict.

## What this means when you build

- Ask your database which one it promises: serializable, or strict
  serializable (external consistency, strong serializability).
- If a user can act, then see a result that ignores the action, you're
  probably relying on real-time order you weren't promised.
- Route reads that must see earlier commits to a node that can
  guarantee it, usually the leader, or use a read mode the database
  documents as strictly ordered.

## Further reading

- [Linearizability versus Serializability](http://www.bailis.org/blog/linearizability-versus-serializability/), Peter Bailis, 2014. The two guarantees side by side, and why combining them gives strict serializability.
- [Strict Serializability](https://jepsen.io/consistency/models/strict-serializable), Jepsen. The definition, its other names, and why it can't stay available during a partition.
- [Spanner: Google's Globally-Distributed Database](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), James C. Corbett et al., OSDI 2012. External consistency, and the clocks and commit wait that provide it.

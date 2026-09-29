---
id: conflict-resolution
title: Conflict resolution
depth: deep
phase: 11
note: >-
  Last write wins, version vectors, and merging.
needs: [multi-leader-replication, leaderless-replication, clock-skew]
leads_to: [crdts]
compare_with: [vector-clocks, eventual-consistency]
---

# Conflict resolution

When two replicas accept writes to the same key without seeing each
other's, the key has two values and the system has to decide what to do
with them. It can keep the one with the larger timestamp, keep both and
let the application merge them, or use a data type that merges itself.
Each choice decides which writes survive, and the most popular one
quietly throws some away.

## Two writes that didn't see each other

Alice's shopping cart holds one book. She adds a lamp on her phone. At
the same moment, on her laptop, she adds a pen. Both requests read the
cart with just the book, and both write back a new cart. In a store
with one leader, those writes would reach one node in some order, and
the second would at least be applied after the first. With
[[multi-leader-replication]] or [[leaderless-replication]], the two
writes can land on different replicas, and each replica takes its own
write without knowing about the other.

Neither write happened "after" the other in any sense the system can
see. They're concurrent. A network partition makes this worse, since
writes on either side can't see each other for as long as it lasts,
but you don't need a partition. Two clients writing the same key at
nearly the same time are enough.

Dynamo's authors measured how often it happened in Amazon's shopping
cart service. Over one day, 99.94% of requests saw exactly one version.
And when divergent versions did pile up, the cause was usually many
concurrent writers, mostly automated clients, rather than failures.
Rare, then, but not rare enough to ignore for data you care about.

## Telling "newer" from "concurrent"

Before resolving a conflict you have to know you have one. If the laptop
write had happened after the phone write and built on it, the laptop's
cart would simply replace the phone's. The system needs a way to tell
"B came after A" apart from "A and B happened side by side".

Timestamps can't do that. Dynamo used a version vector (the paper calls
it a vector clock, see [[vector-clocks]]): a list of (node, counter)
pairs attached to every version. Each time a node coordinates a write
to the key, it bumps its own counter. Here's the history from the
paper:

![Version history of one object. D1 is written through node Sx with clock (Sx 1). D2 through Sx again, clock (Sx 2). From D2 the history branches: D3 is written through Sy with clock (Sx 2, Sy 1), and D4 through Sz with clock (Sx 2, Sz 1). Neither D3 nor D4 descends from the other. A client reads both, merges them, and writes D5 through Sx with clock (Sx 3, Sy 1, Sz 1).](img/conflict-resolution-version-vectors.svg)

*How version vectors separate a branch from a replacement. Adapted from DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store", figure 3 (2007).*

The rule for comparing two versions: if every counter in the first is
less than or equal to the matching counter in the second, the first is
an ancestor and can be dropped. D2 `[(Sx,2)]` replaces D1 `[(Sx,1)]`.
If neither is below the other, they're concurrent. D3 has an Sy entry
that D4 lacks, and D4 has an Sz entry that D3 lacks, so they conflict.

For this to work, a write has to say which version it builds on. In
Dynamo a read returns a context holding the vector, and the next write
passes it back. Riak works the same way: you fetch the object with its
opaque causal context and send that context with the update. A write
without it looks concurrent with everything.

Plain version vectors have a flaw that Riak ran into. They can tell two
writes are concurrent, but not which value came from which write. With
many clients writing one key at once, duplicate values can pile up.
Riak calls this sibling explosion, and at the extreme a huge object can
crash the node that reads it. Riak 2.0 added dotted version vectors,
which tag each value with the exact write that produced it, so
duplicates can be removed and the number of values stays proportional
to the number of concurrent writes.

Once you know two versions conflict, there are three things you can do.

## Option 1: last write wins

Attach a timestamp to every write and keep the one with the largest.
It needs no extra machinery and always converges. Cassandra does this
for everything, deletes included, and applies it per column, so two
writes that change different columns of the same row don't clash. Riak
does it when you set `allow_mult` to false. Some Dynamo services, such
as the one that kept customer session data, used it too.

The trouble is that "last" means "largest timestamp", and timestamps
come from clocks.

- **It drops concurrent writes by design.** Of the lamp and the pen,
  one survives. In Kyle Kingsbury's 2013 Jepsen test, Riak with last
  write wins lost 71% of acknowledged writes on a healthy cluster with
  no partitions, only concurrent clients.
- **A later write can lose to an earlier one.** Clocks on different
  machines disagree, and a clock can step backwards when NTP corrects
  it (see [[clock-skew]]). If write 2 happens after write 1 but gets a
  smaller timestamp, write 2 is ignored wherever write 1 is present, and
  it's gone for good, not delayed.
- **Deletes are timestamps too.** A tombstone hides every write with a
  lower timestamp. A client or node with a fast clock can delete writes
  that happen after it, until the tombstone is removed.

Last write wins is safe when overwriting is what you mean: immutable
values, or writes that replace the whole state ("the cart is now
exactly this"). It's unsafe for read-modify-write ("add a lamp to the
cart I read"). Cassandra's docs ask
you to run NTP because correctness depends on it; the safer fix for
data that matters is a logical clock.

## Option 2: keep both, merge in the application

The store keeps every concurrent version and hands them all to the
application on the next read. Dynamo called these branches, Riak calls
them siblings, CouchDB calls them conflicting revisions. The
application merges them into one value and writes it back with a
context that covers all of them, which collapses the branches. In the
figure, that's D5.

For the cart, the merge is a union: book, lamp and pen. Amazon chose
this so an "add to cart" is never lost. The paper is honest about the
cost: an item deleted on one branch can come back when merged with a
branch that still has it. Removes need more care than adds.

CouchDB shows the other half of the work. After replication, a normal
read returns one conflicting revision as the winner, chosen the same
way on every peer, and doesn't mention the others. The application has
to ask for the conflicts, merge, write the result and delete the losing
revisions. Until it does, a user's saved change can look lost.

Riak's docs now recommend keeping siblings (`allow_mult` true) and
always updating inside a read, modify, write cycle, so each write
carries the context of what it read.

## Option 3: data types that merge themselves

If the merge function is the same every time, you can build it into
the value's type. The requirement is that merging is associative,
commutative and idempotent, so replicas that apply the same updates in
any order, any number of times, end up equal. That's what
[[crdts]] are. In the Jepsen test, replacing last write wins with a set
union merge kept every acknowledged write. Riak lets an object be a CRDT
and resolves conflicts by the type's rules. Cassandra describes its own
per-column last write wins as a CRDT too, which is a reminder that
"converges" and "keeps your writes" are different properties.

## Where it gets tricky

**Converging isn't the same as correct.** Last write wins always ends
with every replica agreeing. It agrees on a value that may be missing
most of the writes.

**Strict quorums don't prevent it.** In the same Jepsen test, requiring
a majority of primary replicas for reads and writes still lost 92% of
writes under a partition. Writes that failed on the minority side had
still landed on some replicas, and with last write wins their
timestamps beat the majority's successful writes. See [[quorums]].

**Locks don't fix it either.** Putting a distributed lock around every
write still lost data under partitions in that test, added latency, and
gave up the availability a leaderless store was chosen for.

**Version vectors grow.** Every node that coordinates a write to a key
adds an entry. Dynamo capped them at a threshold, and dropped the oldest
entry beyond it, which can make versions look concurrent when they
aren't. It reported this hadn't caused trouble in production.

**Merges need history the store may not keep.** A three-way merge wants
the common ancestor. CouchDB compaction discards the bodies of old
revisions, so to merge by diff you have to store the diff in the new
revision yourself.

**The default often isn't the safe one.** Riak made last write wins its
default because users found siblings hard to reason about, and much of
the community advice followed that default.

## What this means when you build

- For every kind of record in a store that allows concurrent writes,
  decide explicitly: overwrite (last write wins is fine), merge (write
  the merge function), or keep in one place (don't allow concurrent
  writes to it at all).
- Use last write wins only for values you replace whole, and only with
  clocks you monitor.
- Always send back the version context you read. A write without it
  looks concurrent with everything.
- Design merges so that adds and removes both survive; a plain union
  brings deleted items back.
- Test with two clients writing the same key at once, not just with
  failures.

## Further reading

- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., SOSP 2007. Vector clocks, branches and client-side merging, the shopping cart, and how often conflicts happened.
- [Causal Context](https://docs.riak.com/riak/kv/latest/learn/concepts/causal-context/index.html), Riak KV docs, version 2.2.3. Siblings, `allow_mult`, dotted version vectors and sibling explosion.
- [Jepsen: Riak](https://aphyr.com/posts/285-jepsen-riak), Kyle Kingsbury, 2013. What last write wins, strict quorums and CRDT merges each do to acknowledged writes, measured.
- [The trouble with timestamps](https://aphyr.com/posts/299-the-trouble-with-timestamps), Kyle Kingsbury, 2013. Why wall-clock last write wins breaks, including clock steps and tombstones.
- [Dynamo (Cassandra architecture)](https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html), Apache Cassandra docs, version 5.0. Per-column last write wins and why Cassandra needs synchronized clocks.
- [Replication and conflict model](https://docs.couchdb.org/en/stable/replication/conflicts.html), Apache CouchDB docs, version 3.5. Revision trees, deterministic winners, and merging by hand.

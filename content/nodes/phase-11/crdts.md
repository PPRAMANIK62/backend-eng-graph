---
id: crdts
title: CRDTs
depth: deep
phase: 11
note: >-
  Data types that merge concurrent changes without coordinating.
needs: [conflict-resolution, vector-clocks, eventual-consistency]
leads_to: [realtime-sync]
compare_with: [consensus, operational-transformation]
---

# CRDTs

A CRDT (conflict-free replicated data type) is a data type built so
that any copy can take a write on its own, with no waiting on the
others, and any two copies that have seen the same writes end up in the
same state. With [[multi-leader-replication|several leaders]], offline
clients or copies in several regions, two people will change the same
thing at the same time. A CRDT makes the merge part of the type itself,
so you don't write [[conflict-resolution]] code for each field and hope
you got it right.

## Start with a counter

Take a "likes" counter stored on two [[replication|replicas]], A and B.
A user on A likes the post while, at the same moment, a user on B likes
it too. Each replica now holds 1. The true count is 2. How should the
replicas merge?

- **Take the bigger number.** max(1, 1) = 1. One like is gone.
- **Add the numbers.** 1 + 1 = 2, which looks right. But networks
  resend. If A's state reaches B twice, B adds it twice and gets 3. A
  merge that isn't safe to repeat breaks the first time a message is
  duplicated.

The fix is to stop storing one number. Give every replica its own slot:
`A:0 B:0`. A replica only ever increments its own slot, so A goes to
`A:1 B:0` and B to `A:0 B:1`. To merge, take the max of each slot
separately, which gives `A:1 B:1`. The value you show is the sum of the
slots: 2. Receiving the same state twice changes nothing, because the
max of a slot with itself is the same slot.

![Two replicas start at A:0 B:0. Each increments its own slot, so A holds A:1 B:0 and B holds A:0 B:1, each showing value 1. They swap whole states and merge by taking the max of each slot, so both end at A:1 B:1 with value 2. Below, two notes: merging one plain number with max gives 1 and loses an increment; merging by adding counts a state that arrives twice, twice.](img/crdts-g-counter-merge.svg)

*A grow-only counter. One slot per replica, merged slot by slot. Adapted from Shapiro, Preguiça, Baquero and Zawirski, "A comprehensive study of Convergent and Commutative Replicated Data Types", section 3.1 (2011).*

This is the grow-only counter, or G-Counter. It looks a lot like a
[[vector-clocks|vector clock]], and that's where the idea came from. It
only counts up. To allow decrements too, keep two of them, one for
increments and one for decrements, and show the difference. That's the
PN-Counter.

It rests on two assumptions: the numbers don't overflow, and you know
the set of replicas, since each one needs a slot.

## Why the merge always works

The counter's merge has three properties, and every state-based CRDT
needs the same three:

- **Commutative.** Merging A into B gives the same result as B into A.
- **Associative.** When you merge three states, the grouping doesn't
  matter.
- **Idempotent.** Merging a state you already have changes nothing.

On top of that, an update only ever moves the state "up": a slot grows,
an element joins a set. It never goes back down. In the maths, the
states form a join semilattice and merge takes the least upper bound,
but the three properties are what you use in practice.

Together they mean the network can do its worst. Messages can be lost,
arrive out of order, or arrive three times, and replicas still end up
the same, as long as every update eventually reaches every replica by
some path. That path can be direct, or through other replicas that
merged it earlier, the way [[anti-entropy]] gossips state between
copies.

This guarantee has a name: strong eventual consistency. Plain
[[eventual-consistency]] only says copies reach the same value once
clients stop writing, and a system built that way may apply a write,
find a conflict later and roll it back. Rolling back the same way
everywhere usually takes a vote. Strong eventual consistency says two
replicas that have received the same updates, in any order, are in the
same state, with no rollback. It needs no [[consensus]], so a replica
stays available for reads and writes even when it's cut off from the
rest.

## Shipping states, operations or deltas

There are two classic ways to move updates between replicas.

**State-based.** Each replica sends its whole state now and then, and
the receiver merges it. This is the counter above. It asks almost
nothing of the network, which is its main strength. The cost is size.
The counter's state grows with the number of replicas, and a set's
state grows with every element, so shipping the whole thing each time
only works for small types.

**Operation-based.** Each replica sends the operation itself, like
"increment" or "add milk". The receiver applies it. Messages are tiny,
and a counter can be a single integer again, because increments and
decrements commute. The price moves to the network: every operation has
to reach every replica, exactly once, and usually in causal order (a
remove shouldn't arrive before the add it removes; see
[[causal-consistency]]). Causal delivery doesn't need consensus, but
building reliable exactly-once delivery means tracking who's in the
group and keeping logs to spot duplicates. The rule for convergence
here is that operations that can happen concurrently must commute.

Either style can imitate the other, so the choice is about what's
cheaper to run.

**Delta-state** CRDTs, from 2016, split the difference. An update
produces a small delta, a piece of state that holds just that change.
Replicas ship deltas and merge them with the same idempotent merge as
full states, so loss, duplication and reordering are still fine. The
first time two replicas talk, one still has to send its full state.

## Registers: when two writes really collide

A counter is easy because increments commute. Most things don't.
Say two replicas both set a user's display name at the same moment, one
to "Sam" and one to "Samuel". There's no right answer; the type has to
pick one. Two designs are common.

**Last-writer-wins (LWW) register.** Stamp each write with a
timestamp, and keep the value with the highest one. It converges and
it's cheap, but one write is dropped without anyone being told. It also
needs timestamps that respect cause and effect: if write 1 happened
before write 2, write 1 must get the smaller stamp. Wall-clock time
with a node id breaks ties, but with [[clock-skew]] a later write can
carry an earlier time and lose. Logical clocks, or
[[hybrid-logical-clocks]], fix that part.

**Multi-value register.** Keep every value written concurrently, each
tagged with a version vector so the type can tell concurrent writes
from ones that replaced each other. A read returns both "Sam" and
"Samuel", and the next write replaces both. The application, or the
user, decides.

The multi-value register also explains a famous bug. Amazon's Dynamo
stored shopping carts this way (see [[leaderless-replication]]) and
merged the concurrent versions by taking their union. A book removed
on one replica could come back after the merge, because a register that
holds sets doesn't behave like a set.

## Sets: add and remove don't commute

A set supports add and remove. Run them concurrently and the order
changes the answer. One replica adds milk and then removes it; another
adds milk. A third replica that gets those operations in a different
order, even a causally valid one, can end up with a different set. So
no CRDT set can behave exactly like a set on one machine. Each design
picks what happens when an add and a remove of the same element race:

- **Grow-only set (G-Set).** No remove at all. Merge is union.
- **Two-phase set (2P-Set).** A second grow-only set records removed
  elements: the tombstones. Remove wins, and a removed element can
  never be added again, which surprises users.
- **LWW-element set.** Every add and remove carries a timestamp, and the
  latest wins, with all the clock caveats above.
- **Observed-remove set (OR-Set), or add-wins set.** Each add attaches a
  unique hidden tag to the element. A remove deletes only the tags its
  replica has seen. An add that happened concurrently made a tag the
  remove never saw, so that element survives.

![Two replicas, A and B, each start with milk tagged α. A removes milk, which deletes only tag α, leaving an empty set. At the same time B adds milk again with a new tag β, holding milk·α and milk·β. They exchange operations: "remove α" goes to B and "add milk·β" goes to A. Both end with milk·β, so milk stays: the add wins.](img/crdts-or-set-add-wins.svg)

*An observed-remove set. Adapted from Shapiro, Preguiça, Baquero and Zawirski, "A comprehensive study of Convergent and Commutative Replicated Data Types", figure 14 (2011).*

Remove-wins sets exist too, and so do stranger rules, like "the
replica with the highest IP address wins". All of them converge. Which
one is right depends on what a lost add or a lost remove costs you. In a
shopping cart, a remove that doesn't stick is annoying. In a list of
people allowed to open a file, it can be a security problem.

Production systems pick one rule per type and document it. Riak KV
(docs for 2.2.3) has counters that are PN-Counters, sets where a
concurrent add beats a remove, maps where an add or update beats a
remove, flags where enable beats disable, and registers where the
newest timestamp wins. You can't swap in your own rules. Redis
Software's Active-Active databases do the same behind normal Redis
commands: run `INCRBY key1 7` in one region and `INCRBY key1 3` in
another, and after they sync both read 10.

## Where it gets tricky

**Converging isn't the same as being right.** Strong eventual
consistency promises that replicas agree. It says nothing about whether
the state they agree on makes sense. A text editor could converge by
sorting every character alphabetically. Real text CRDTs have hit a
milder version of this: two people type "Alice" and "Charlie" at the
same spot, and some algorithms (Logoot and LSEQ) merge them letter by
letter into a jumble that every replica agrees on. RGA avoids the
letter-by-letter mix but can still interleave in a smaller way. The
merge rule has to match what users expect, and proving convergence
doesn't prove that.

**Invariants need coordination.** A CRDT can't keep a rule that spans
replicas. Say a stock count must never go below zero. Two replicas both
see 1, both sell the last item, and the count converges to −1. Each
replica checked locally and was right locally. The ways out all involve
some coordination. One is escrow: give each replica a quota of
decrements up front, and when it runs out it has to ask another replica
for more, or fail. Anything with a single winner, like closing an
auction and picking the winning bid, needs agreement.

**It isn't linearizable, or even sequential.** In CAP terms a CRDT
picks availability (see [[cap-theorem]]). A read shows only the writes
that have reached that replica, so it isn't [[linearizability|linearizable]].
It can also produce states no single order of operations would. With
an add-wins set, one replica does add(x) then remove(y) while another
does add(y) then remove(x). After merging, both x and y are in the set,
though in any one-machine order some remove would have come last. What
you do get, per object, is causal consistency.

**Metadata and tombstones pile up.** Removes leave tombstones, and
causality tracking grows with the number of replicas, enough to limit
CRDTs past a few hundred replicas. Cleaning up is safe only once every
replica has seen the operation, which means knowing who the replicas
are and that none of them is gone for good. Redis's Active-Active mode
keeps a deleted key as a tombstone until every instance has seen the
delete. A replica that stays offline holds up the cleanup for
everyone.

**Clocks sneak back in.** "Conflict-free" doesn't mean clock-free.
Wherever a type picks a winner by timestamp (LWW registers, Riak's
registers), the correctness of that field depends on clocks again.

## What this means when you build

- Reach for CRDTs when a write must succeed wherever it lands, right
  away: active-active across regions, offline-capable clients,
  counters and sets hit from many places. Collaborative editing, where
  this gets hardest, is [[realtime-sync]].
- Choose the merge rule per field on purpose. Add-wins or remove-wins,
  LWW or keep-both. Treat each default as a product decision.
- Keep global invariants (balances, stock, uniqueness, one winner) on a
  path that coordinates. Use CRDTs for everything else around them.
- Budget for metadata. Watch tombstone counts (Redis exposes
  `crdt_gc_pending` in `INFO`), and decide what happens to replicas
  that never come back.
- Use a database or library that already implements them. Ad-hoc
  merge code is where the classic bugs, like the reappearing cart item,
  came from.

## Further reading

- [A comprehensive study of Convergent and Commutative Replicated Data Types](https://inria.hal.science/inria-00555588/document), Marc Shapiro, Nuno Preguiça, Carlos Baquero, Marek Zawirski, INRIA RR-7506, 2011. The report that named CRDTs: state-based and op-based styles, and the counter, register and set designs with their anomalies.
- [Conflict-free Replicated Data Types](https://inria.hal.science/hal-00932836/document), Marc Shapiro, Nuno Preguiça, Carlos Baquero, Marek Zawirski, SSS 2011. The formal definition of strong eventual consistency, and why an add-wins set isn't sequentially consistent.
- [Conflict-free Replicated Data Types](https://arxiv.org/pdf/1805.06358), Nuno Preguiça, Carlos Baquero, Marc Shapiro, 2018. Short overview: concurrency semantics, sync models, limits (invariants, scalability) and where CRDTs were used.
- [Delta State Replicated Data Types](https://arxiv.org/pdf/1603.01529), Paulo Sérgio Almeida, Ali Shoker, Carlos Baquero, 2016. Why full-state and op-based shipping each hurt, and how deltas fix it.
- [Interleaving anomalies in collaborative text editors](https://martin.kleppmann.com/papers/interleaving-papoc19.pdf), Martin Kleppmann, Victor B. F. Gomes, Dominic P. Mulligan, Alastair R. Beresford, 2019. Proof that converging isn't enough: text CRDTs that merge words into a jumble.
- [Concepts: Data Types](https://docs.riak.com/riak/kv/latest/learn/concepts/crdts/index.html), Basho, Riak KV 2.2.3. A production database's table of which update wins, per type.
- [Develop applications with Active-Active databases](https://redis.io/docs/latest/operate/rs/databases/active-active/develop/develop-for-aa/), Redis, Redis Software v8.0 docs. CRDTs behind ordinary Redis commands, why plain LWW loses data, and how tombstones are collected.

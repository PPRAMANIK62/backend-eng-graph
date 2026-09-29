---
id: linearizability
title: Linearizability
depth: deep
phase: 11
note: >-
  The system acts like a single copy, and every operation happens at one
  instant.
needs: [consistency-models]
leads_to: [linearizability-checking, cap-theorem, linearizable-reads, strict-serializability]
compare_with: [serializability, distributed-locks]
---

# Linearizability

A linearizable system behaves as if there were a single copy of the data
and every operation happened at one instant, somewhere between the moment
you sent the request and the moment you got the answer. Once a write has
finished, every read that starts afterwards sees it or something newer.
It's the strongest guarantee for single objects, the one a lock
service relies on, and the "C" in the [[cap-theorem]].

## Why "the latest value" isn't enough

On one machine, "a read returns the latest write" is easy to state. With
many clients and a network, it breaks down, because operations take
time. A read is sent, travels to a server, reads, and the answer travels
back. A write from another client can land anywhere inside that window.
If the write arrives at the server before the read does, is the read's
answer the old value or the new one? Both are defensible.

Linearizability settles this with two rules:

1. An operation can't take effect **before** it was invoked. The request
   hasn't left yet.
2. An operation can't take effect **after** it completed. The answer has
   already come back.

So each operation takes effect at some single point inside its own time
window, its **linearization point**. A history is linearizable if you
can choose one point per operation so that, replayed in the order of
those points, every result makes sense for a plain single-threaded
object: a read returns the last write before it.

Operations whose windows overlap can take effect in either order. It's
the ones that don't overlap that are pinned: if A finished before B
started, A's point comes first.

## Two histories on one register

Here is a register that starts at 0, with three clients. Each bar runs
from when a client sent its request to when it got the answer.

![Two register histories. A, linearizable: C0 puts 100 over a long window, C1 gets 100 in a window inside it, C2 gets 0 in a shorter window that starts later but ends earlier. Choosing points in the order C2's read, the put, then C1's read explains every result. B, not linearizable: C0 puts 200 over a long window; C1 gets 200 and returns early; C2 starts after C1 returned and gets 0. Since C1 already saw 200, the put took effect before C1 returned, so C2, which started after that, must see 200. No point in C2's window explains 0.](img/linearizability-register-histories.svg)

*Adapted from Anish Athalye, "Porcupine" (README examples).*

In history A, the put overlaps both reads, so there's freedom. Put C2's
read first (it sees 0), then the put, then C1's read (it sees 100).
Every point sits inside its own bar. Linearizable.

History B has the same shapes, slightly moved. C1 read 200 and got its
answer back, so the put must have taken effect before that. C2 started
after C1 finished. Whatever point you choose for C2, it comes after the
put, so it should see 200. It saw 0. Not linearizable, even though the
put was still in progress when C2 read.

This is exactly what a lagging replica does. A client reads the new
value from one replica, tells a friend, and the friend reads from
another replica that hasn't caught up. Each replica answered honestly
from what it had; the pair of answers is still wrong.

## What it buys you

**No stale reads, no going backwards.** Once any client has seen a
value, everyone who starts later sees it or something newer.

**Atomic building blocks.** A linearizable compare-and-set ("set x to 5
only if it's 3") is enough to build locks, counters, queues, sets and
maps on top. If two clients race to grab a lock, exactly one wins, and
everyone agrees which. A [[distributed-locks|lock service]] needs this.
Without real-time bounds, a client could be acting on the state of the
lock from some other moment, before it was taken or after it was
released.

**It composes object by object.** If each object is linearizable on its
own, the system as a whole is. You can build and verify one register or
queue at a time. Sequential consistency doesn't have this property:
two sequentially consistent objects together can produce a history that
isn't sequentially consistent.

**Side channels just work.** The store can't know how its clients talk
to each other outside it, by phone, [[message-queue|message queue]] or a shared screen.
Linearizability respects real time, so whatever order they learn of
outside is the order the store shows them.

## How it compares

Among the single-object [[consistency-models]], only strict
serializability sits above it. One step down, **sequential consistency** keeps one total
order that respects each client's own order, but drops the real-time
rule. A client can be far behind, which breaks exactly the side-channel
case above.

It's often confused with [[serializability]], but the two answer
different questions:

| | Linearizability | Serializability |
|---|---|---|
| Unit | one operation on one object | a transaction over many objects |
| Order | must respect real time | any serial order will do |
| From | concurrent programming, distributed systems | databases |

A serializable database may legally run your read-only [[transaction]] "at
time zero" and return an empty result. [[strict-serializability|Strict serializability]] is both
at once: transactions in a serial order that respects real time.
Linearizability is the special case where every transaction is a single
operation on a single object.

## What it costs

**Coordination.** A linearizable system has to act like one copy while
being many, so replicas have to agree before they answer. etcd, for
example, sends every linearizable request through [[raft|Raft]], its
[[consensus]] protocol.

**Latency.** A linearizable read or write can't complete faster than a
time proportional to the network delay between replicas. If the network
slows down, so does every operation.

**Availability.** During a [[network-partitions|network partition]],
some nodes have to stop answering, or they risk giving stale answers.
That's the [[cap-theorem]].

The costs show up in real products as options. etcd's key-value calls
are linearizable by default; you can ask for a "serializable" read instead, which is faster and may
be stale (despite the name, it's not serializability in the transaction
sense). ZooKeeper reads come from whichever server you're connected to
and aren't linearizable unless you call `sync` first. Doing reads
correctly and cheaply on a Raft group is [[linearizable-reads]].

Even your CPU doesn't give you this for free. Modern processors reorder
memory operations between cores, and you need explicit barriers to get
linearizable access to RAM. See [[memory-model]].

## Where it gets tricky

**Quorums don't make it linearizable.** Reading and writing a majority
with W + R > N sounds like it should guarantee the latest value. Edge
cases in sloppy [[quorums]] and read repair break that, so don't assume
it without proof.

**Unfinished operations are ambiguous.** A write that timed out may or
may not have happened. Your application has to allow for both, and so
does a checker; see [[linearizability-checking]].

**"Strongly consistent" in docs may mean less.** Ask whether it covers
reads as well as writes, reads from followers, and [[failover]]. ZooKeeper's
writes go through consensus, but its default reads don't.

**Snapshot databases aren't linearizable.** An [[mvcc|MVCC]] database
reading from a snapshot doesn't give you real-time order, on purpose,
because enforcing it would cost concurrency. PostgreSQL's
[[serializable-snapshot-isolation|serializable level]] is serializable
but not linearizable.

## What this means when you build

- **Use it for coordination.** Locks, [[leader-election|leader election]], unique usernames,
  "exactly one of these jobs runs": anything where two clients must not
  both win.
- **Keep it small.** Put the bulk data in a cheaper store and keep only
  the pointer or lease in a linearizable one like etcd or ZooKeeper.
- **Check the read path.** Writes may go through the leader and be
  linearizable while reads from followers or caches aren't. Know which
  path your code uses.
- **Test it, don't trust it.** Record histories under faults and run a
  checker. That's [[linearizability-checking]], and the lab harness for
  this phase.

## Further reading

- [Linearizability: A Correctness Condition for Concurrent Objects](https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf), Maurice Herlihy and Jeannette Wing, 1990. The definition, locality, and the queue histories that show it.
- [Strong consistency models](https://aphyr.com/posts/313-strong-consistency-models), Kyle Kingsbury, 2014. Builds linearizability from invocation and completion bounds, and why locks need it.
- [Please stop calling databases CP or AP](https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html), Martin Kleppmann, 2015. The stale-replica example, ZooKeeper's reads, quorums and snapshot isolation.
- [Linearizability versus Serializability](http://www.bailis.org/blog/linearizability-versus-serializability/), Peter Bailis, 2014. The difference in one page.
- [Porcupine](https://github.com/anishathalye/porcupine), Anish Athalye. The two register histories the figure is adapted from.
- [KV API guarantees](https://etcd.io/docs/v3.6/learning/api_guarantees/), etcd v3.6 docs. A real store's promise, and the cost of linearizable reads.
- [A Critique of the CAP Theorem](https://arxiv.org/pdf/1509.05393), Martin Kleppmann, 2015. Section 4.2.1: why linearizable operations must wait on network delay.

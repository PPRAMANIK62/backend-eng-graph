---
id: failure-models
title: Failure models
depth: short
phase: 11
note: >-
  What an algorithm assumes can go wrong: crash-stop, crash-recover,
  omission or Byzantine nodes, and how late a message may arrive.
needs: [distributed-system]
leads_to: [consensus, flp-impossibility]
compare_with: [byzantine-fault-tolerance]
---

# Failure models

A failure model, or system model, is the list of things a distributed
algorithm assumes can go wrong: how the network misbehaves, how nodes
fail, and how late a message or a slow node may be. An algorithm is correct
only under its model. When you pick a library or design a protocol, its
model tells you which real-world failures it survives and which ones break
it.

## Three questions every algorithm answers

Before you can say an algorithm for a
[[distributed-system|distributed system]] works, you have to say what it's
up against, on three axes.

![A three-by-three grid. Rows are network, nodes and timing. Network: reliable links (every message arrives), fair-loss links (lost, duplicated, reordered, but retries get through), arbitrary links (an attacker can read, change, drop, replay). Nodes: crash-stop (stops and never returns), crash-recovery (restarts with memory lost and disk kept), Byzantine (anything, even lying). Timing: synchronous (known bound on delay and speed), partially synchronous (the bound holds except for unknown stretches), asynchronous (no bound at all). An arrow across the top runs from easier to build on toward closer to the worst case.](img/failure-models-menu.svg)

*Pick one per row. Adapted from Martin Kleppmann, "Distributed Systems" lecture notes, slides 33 to 35 (Cambridge, 2021).*

**The network.** With reliable links, every message sent is received,
though maybe out of order. With fair-loss links, messages can be lost,
duplicated or reordered, but if you keep retrying, one gets through. With
arbitrary links, an attacker can read, change, drop or replay traffic. The
network models convert into each other: retries plus deduplication turn
fair-loss links into reliable ones, and [[tls|TLS]] turns arbitrary links
into fair-loss ones, except that nothing stops an attacker who simply
blocks everything.

**The nodes.** Four fault types come up again and again:

- **Crash-stop** (fail-stop): a node works correctly until it stops, and
  never comes back.
- **Crash-recovery**: a node can crash at any moment, losing everything in
  memory, and may restart later with what it wrote to disk. There's no
  promise about when, or whether, it comes back.
- **Omission**: a node follows the protocol, but some of the messages it
  sends or receives silently don't happen.
- **Byzantine**: a faulty node can do anything, including lying to
  different nodes in different ways.

Unlike network models, node models don't convert. An algorithm built for
crash-recovery looks very different from one built for Byzantine nodes.

**Timing.** A synchronous system has a known upper bound on message delay
and on how slowly a node can run. An asynchronous one has no bound at all:
a message or a node can be delayed arbitrarily. A partially synchronous
system sits in between. Either a bound exists but you don't know it, or you
know it but it only starts to hold after some unknown point in time.
Informally: it's well behaved most of the time, with stretches when it
isn't.

## Why the choice decides how many nodes you need

The model decides what's possible at all.

In a fully asynchronous system, no [[consensus]] protocol can tolerate even
one node that crashes. That's the result behind
[[flp-impossibility|FLP]]. The reason is that without a time bound, a
crashed node and a very slow one can't be told apart.

Under partial synchrony, consensus becomes possible, and the fault type sets
the price. To survive `t` faulty nodes you need at least `2t + 1` nodes if
they only crash or omit messages, which is a majority of correct ones. You
need at least `3t + 1` if they can be Byzantine, so four nodes to survive
one liar. Under partial synchrony, signing messages doesn't lower that
number.

These protocols also keep safety and liveness apart. They never do anything
wrong, like two nodes deciding different values, however badly timing
behaves. They only need the well-behaved stretches to make progress.

The timing axis is the one people most often get wrong. Networks and
machines behave most of the time, so assuming a bound is tempting. But an
algorithm built for synchrony can fail badly the moment lost packets,
congestion, garbage collection or paging break the bound, even briefly.

## Where it gets tricky

**A pause is not a crash.** A crashed node loses its memory and restarts
from what it wrote to disk. A [[process-pauses|paused]] node keeps its
memory and doesn't notice anything happened. Other nodes may have decided
it's dead, and when it wakes up it carries on with stale beliefs. The
crash-recovery model doesn't cover that; the timing model does.

**A late message isn't a faulty node.** It's tempting to treat any message
slower than some limit as a failure of the sender. Pick the limit too small
and every node soon looks faulty. The partial synchrony model was built to
avoid exactly that: slow messages are allowed, and they don't count against
the fault budget.

**Bugs aren't usually counted as Byzantine.** In theory any deviation from
the protocol is Byzantine, including a bug. In practice, if every node runs
the same code, every node has the same bug, and the "fewer than a third"
limit is gone. So the word is mostly kept for deliberate misbehaviour, and
[[byzantine-fault-tolerance]] is mostly used where nodes don't trust each
other.

**Crash-recovery trusts the disk.** The model says what's on disk survives.
That's only true if the node really made it durable, with
[[fsync]] and everything that goes with it.

## What this means when you build

- For any replication or coordination library you adopt, find its model:
  crash-stop or crash-recovery, and what it assumes about timing.
- Count nodes from the model: tolerating one crashed node takes three,
  tolerating one Byzantine node takes four.
- Don't build correctness on timeouts being accurate. Use them to decide
  when to act, not to decide what's true.
- Test the edges of the model on purpose: crash nodes, pause them, drop
  messages. That's [[fault-injection]].

## Further reading

- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge, 2021. Section 2.3 lays out network, node and timing models, and why synchrony is rarely safe to assume.
- [Consensus in the Presence of Partial Synchrony](https://groups.csail.mit.edu/tds/papers/Lynch/jacm88.pdf), Cynthia Dwork, Nancy Lynch and Larry Stockmeyer, JACM, 1988. The paper that defined partial synchrony and the crash, omission and Byzantine fault types, with how many nodes each needs.

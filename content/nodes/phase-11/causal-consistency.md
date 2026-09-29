---
id: causal-consistency
title: Causal consistency
depth: short
phase: 11
note: >-
  Everyone sees causes before their effects.
needs: [consistency-models, lamport-clocks, vector-clocks]
leads_to: []
compare_with: [session-guarantees, replication-lag, eventual-consistency, new-enemy-problem]
---

# Causal consistency

Causal consistency promises that if one operation could have caused
another, everyone sees them in that order. A reply never shows up before
the message it answers, and a link to a photo never shows up before the
photo. Operations with no causal link can appear in any order. In slightly
stronger forms, it's the strongest model a replicated store can keep
while every replica goes on answering during a network partition, which
is why geo-replicated stores reach for it.

## Causes before effects

A user uploads a photo, and then adds a link to it in their album. On
an [[eventual-consistency|eventually consistent]] store those are two
unrelated writes, and a replica in another region can receive the album
update first. A friend reading from that replica sees the link and gets
"not found" when they follow it.

Causal consistency forbids that. The album write depends on the photo
write, because the same client did one after the other. No reader
anywhere sees the album entry without the photo.

"Could have caused" has a precise meaning, called potential causality.
Operation *a* comes before *b* if:

1. **Same thread:** one client did *a* and then *b*.
2. **Reads from:** *b* read the value that write *a* produced.
3. **Transitivity:** *a* comes before *c* and *c* comes before *b*.

These are [[lamport-clocks|Lamport's]] happens-before rules applied to
reads and writes. Anything the rules don't order is concurrent.

## Concurrent operations may disagree

Take a group chat. Attiya asks "lunch?". Barbarella reads it and
replies "yes". Cyrus reads it and replies "no". Both replies depend on
the question, but neither saw the other.

![Left: Attiya's message "lunch?" with arrows to Barbarella's "yes" and Cyrus's "no", both written after reading it; "yes" and "no" are concurrent. Right: what a reader may see. "lunch? yes no" is allowed, "lunch? no yes" is allowed, "lunch? yes" is allowed for now, "yes lunch? no" is never allowed.](img/causal-consistency-lunch.svg)

*Replies always follow the question; the two replies can come in either order. Adapted from Jepsen, "Causal Consistency".*

So one reader may see "lunch?, yes, no" and another "lunch?, no, yes".
Both are fine. What can't happen is anyone seeing "yes" before
"lunch?".

This leaves a gap. If two concurrent writes hit the same key, say Carol
sets a meeting to 8pm and Dan sets it to 10pm, plain causal consistency
lets two replicas keep different answers forever. Real systems close the
gap by also requiring **convergence**: every replica resolves the
conflict the same way, by picking one write (last writer wins) or by
keeping both and flagging the conflict. Causal consistency plus that
rule is called **causal+**. See [[conflict-resolution]].

## How a store enforces it

The COPS system shows the usual approach:

- The client library remembers what this client has read and written.
  Each new write carries that as its list of **dependencies**: key and
  version pairs.
- Versions come from a [[lamport-clocks|Lamport clock]] combined with the
  node's id, which also gives a single order per key for last writer
  wins.
- The local data centre applies writes right away. They're shipped to
  other data centres in the background.
- A remote data centre that receives a write checks each dependency
  with the servers holding those keys. If a dependency isn't there yet,
  the check waits. Only when all are present does the write become
  visible.
- Only the **nearest** dependencies need checking, because each of those
  was itself held back until its own dependencies arrived.

Writes may be held back. Reads never wait: they return whatever is
visible, and what's visible is always causally complete.

Earlier causal systems did this differently: each replica kept one
log, marked with [[vector-clocks|version vectors]], and replicas
exchanged logs. That needs a single point per replica that orders
everything, which is what COPS set out to avoid so the data could be
spread over many servers.

## Where it gets tricky

**It only sees causality that goes through the store.** The model
assumes clients talk only through the data. If Alice reads a value and
phones Bob, and Bob then reads from another replica, the store never saw
that link and Bob may read something older. A stronger variant,
real-time causal, adds a real-time rule to catch such hidden channels,
and it's been proven the strongest model an always-available,
convergent system can have. Last writer wins as COPS does it gives
causal+, not real-time causal.

**Availability has a condition.** Causal consistency is sticky
available: during a partition every client can keep going, but only if
it stays on the same server. A client that switches to a replica that
hasn't seen its earlier writes can't be served correctly there. If you
need any node to answer any client, you have to drop to monotonic reads,
monotonic writes and writes follow reads, lower down the ladder of
[[consistency-models]].

**Most "causal" systems are really causal+ or stronger**, because plain
causal without convergence is rarely useful.

## What this means when you build

- **Use it where order matters but freshness doesn't.** Comments and
  replies, permission changes before the content they protect, a photo
  before the link to it.
- **Keep clients on one replica, or carry context.** Either pin a
  session to a data centre, or pass the client's dependency context
  along when it moves.
- **Don't rely on side channels.** If your app tells a user "go look"
  over email or a push message, the store doesn't know that order.
  Carry a version in the message, or read with a stronger guarantee.

## Further reading

- [Don't Settle for Eventual: Scalable Causal Consistency for Wide-Area Storage with COPS](https://www.cs.cmu.edu/~dga/papers/cops-sosp2011.pdf), Wyatt Lloyd, Michael J. Freedman, Michael Kaminsky, David G. Andersen, 2011. The photo example, potential causality, causal+, and how dependency checking works.
- [Causal Consistency](https://jepsen.io/consistency/models/causal), Jepsen. The lunch example, convergence, sticky availability and the stronger variants.

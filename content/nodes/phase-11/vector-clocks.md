---
id: vector-clocks
title: Vector clocks
depth: short
phase: 11
note: >-
  One counter per node, so you can tell "happened before" from
  "concurrent".
needs: [lamport-clocks, clock-skew]
leads_to: [crdts, causal-consistency]
compare_with: [conflict-resolution]
---

# Vector clocks

A vector clock gives every event a list of counters, one per process,
instead of the single counter of a [[lamport-clocks|Lamport clock]].
Compare two of those lists and you can tell whether one event happened
before the other, or whether they were concurrent. That second answer is
the one databases need: two concurrent writes to the same key are a
conflict, and a single counter can't spot them.

## One counter per process

Each process keeps a vector with one entry for every process in the
system. The rules are close to Lamport's:

1. **Tick your own entry.** Before each event, a process adds one to its
   own position, and only its own.
2. **Send the whole vector.** Every message carries the sender's vector.
3. **Merge on receive.** The receiver takes the larger value in each
   position (its own vector against the message's), then ticks its own
   entry.

![The same three processes as the Lamport example, with vectors in the order P, Q, R. a on P is (1,0,0) and sends to Q. Q's c is (0,1,0), d receives a and becomes (1,2,0), e is (1,3,0) and sends to R. R's f is (0,0,1), g receives e and becomes (1,3,2). P's later event b is (2,0,0). a is less than or equal to g in every position, so a happened before g. b and e are each bigger in some position, so they are concurrent.](img/vector-clocks-vectors.svg)

*Vector time on three processes. Adapted from Friedemann Mattern, "Virtual Time and Global States of Distributed Systems", figure 13 (1988).*

Entry *i* of a vector means "how many events of process *i* I know
about". Since only process *i* ever increments entry *i*, nobody can know
more about *i* than *i* itself.

## Comparing two vectors

Take the vectors of two events, x and y:

- If every entry of x is less than or equal to the matching entry of y,
  and they're not equal, **x happened before y**.
- If the reverse holds, y happened before x.
- If each is bigger somewhere, **x and y are concurrent**. Neither knew
  about the other.

Unlike a Lamport clock, this test works both ways. In the figure, b is
[2,0,0] and e is [1,3,0]. A Lamport clock gave them 2 and 3, which looks
like an order. The vectors show there isn't one.

## In a database: finding conflicting writes

[[replication|Replicated]] stores use the same idea to track versions of a value; for
data, it's usually called a **version vector**, with one entry per
replica counting that replica's updates.

Amazon's Dynamo (2007), a store built on
[[leaderless-replication]], is the classic example. Each version of an object
carries a list of (node, counter) pairs. Say node Sx handles the first
write, giving [(Sx,1)], and a second write, giving [(Sx,2)]. That version
replaces the first, because its clock is at least as large everywhere.
Now two clients each read [(Sx,2)] and write back, one through node Sy
and one through Sz. The results are [(Sx,2),(Sy,1)] and [(Sx,2),(Sz,1)].
Neither is at least as large as the other everywhere: they're
concurrent, so the store keeps both. On the next read the client gets
both versions, merges them itself, and the merged write carries
[(Sx,3),(Sy,1),(Sz,1)], which is larger than both.

Merging is up to the application, which is what
[[conflict-resolution]] is about. Dynamo's shopping cart merged
the carts, so an added item was never lost, but a deleted item could
come back.

## Where it gets tricky

**Size.** A vector needs an entry per writer. Dynamo keys entries by the
server that coordinated the write, and a few servers handle most writes
for a key, so the list stays short. When failures spread writes over
more servers, Dynamo trims the oldest pair once the list reaches about
10 entries. That loses history: two versions that really were ordered
can look concurrent, and the client gets a conflict it didn't need.

**Conflicts are rare but real.** Over 24 hours of Dynamo's shopping cart
service, 99.94% of requests saw exactly one version. The rest saw two or
more, and the code had to handle them.

**Vector clocks vs version vectors.** The names get mixed up because the
mechanics are the same. Dynamo calls what it keeps per object a vector
clock. Mattern's paper keeps the two apart: vector time orders the
events of a computation, while version vectors, from earlier work on
replicated files, count the updates made to each copy at each site and
flag a conflict when neither copy's vector covers the other's.

## What this means when you build

- Use a version vector when you need to know whether two writes
  conflicted, not just which one has the bigger number. Wall-clock last
  write wins can't tell the difference (see [[clock-skew]]).
- Key the entries by server or replica, not by client, to keep vectors
  small.
- A client that updates a value should send back the vector it read, so
  the store knows what the write replaces.
- Plan for the concurrent case: keep both values and merge them, or use
  a data type that merges itself (see [[crdts]]).

## Further reading

- [Virtual Time and Global States of Distributed Systems](https://www.vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf), Friedemann Mattern, 1988. One of the two papers that introduced vector time: the update rules, the comparison test, and a note on version vectors.
- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), Giuseppe DeCandia et al., 2007. Section 4.4 walks through versions D1 to D5 with vector clocks; sections 4.4 and 6.3 cover truncation and how often conflicts happened.

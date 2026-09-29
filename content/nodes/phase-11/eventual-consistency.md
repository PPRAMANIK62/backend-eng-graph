---
id: eventual-consistency
title: Eventual consistency
depth: short
phase: 11
note: >-
  Stop writing and copies agree eventually. What it doesn't promise.
needs: [consistency-models]
leads_to: [crdts, session-guarantees, operational-transformation]
compare_with: [causal-consistency, conflict-resolution]
---

# Eventual consistency

Eventual consistency is the promise that if nobody writes to an item for
long enough, every copy of it will end up with the same value, and every
read will return it. It's the weakest guarantee a replicated store
usually offers. It says a lot less than people
assume, and knowing exactly what it leaves out tells you what your own
code has to handle.

## What it promises

Picture a write landing on one replica. The other replicas get it later,
through background copying. Between the write and the moment every
replica has it, a read might go to a replica that's behind and return
the old value. That gap is the **inconsistency window**.

Eventual consistency says only this: if no new writes arrive, the window
closes. All reads will eventually return the last value written.

Plenty of familiar systems work this way:

- **[[dns|DNS]].** A changed record spreads through caches that each hold the old
  answer until its time runs out. Eventually everyone sees the new one.
- **Read replicas.** A relational database that ships its log to
  followers [[sync-vs-async-replication|asynchronously]] and lets you
  read from them is eventually consistent. The window depends on how
  far behind the log shipping is, which is [[replication-lag]].
- **Quorum stores with small quorums.** With N copies, writes waiting
  for W of them and reads asking R of them, the read and write sets are
  sure to overlap only if W + R > N. With W + R ≤ N a read can miss
  the latest write entirely, and the other copies catch up in the
  background. See [[quorums]].

Why accept this? Two reasons. Answering from whatever replica is nearby
is fast, without waiting on the others. And when the network splits, a
replica can keep serving reads and writes even though it can't reach a
majority.

## What it doesn't promise

The definition is about the end state after writes stop. It's silent on
everything before that, which is when your code actually runs.

**No bound on the window.** "Eventually" has no number attached. With
no failures you can estimate it from network delays, load and the number
of replicas, but the guarantee itself gives none. In a system that
never stops taking writes, the condition "if no new updates are made"
may never hold.

**No order.** Take a baseball score kept as two keys, one per team,
currently visitors 2, home 5. An eventually consistent read can return
any combination of values each key ever had: 18 possible scores. Some,
like the visitors leading 1-0, never happened in the game. The replica
just had some writes and not others.

**No going forward.** Two reads in a row can hit different replicas, so
you can see 2-5 and then 1-3.

**Not even your own writes.** Write a value, read it back, and you can
get the old one if the read goes to a replica that hasn't received your
write.

**No rule for concurrent writes.** If two clients write the same key on
different replicas at the same time, the copies can only converge if
every replica resolves the clash the same way. Keeping one value,
keeping both, or merging them, the way Amazon's shopping cart merges
carts after a partition heals, are all choices the definition leaves to
the system. That's [[conflict-resolution]].

So eventual consistency puts no limit on what a single read can
return right now. It's a promise about the future only.

## What people add on top

Because plain eventual consistency is so thin, most systems add [[session-guarantees|session
guarantees]] that hold for one client:

- **Read your writes:** after you write, you never read an older value.
- **Monotonic reads:** once you've seen a value, you never see an older
  one.
- **Monotonic writes:** your writes are applied in the order you made
  them.

The first two are the ones applications most often need. They're easy
when a client always talks to the same server, and a client can enforce
them itself by tagging writes with versions and throwing away reads
older than the last version it saw. Stronger still is
[[causal-consistency]]. The full range is in [[consistency-models]].

Often the window is short enough not to matter. On a website, a user who
changes a setting and clicks to the next page won't notice anything as
long as the change has spread before that next request arrives.

## What this means when you build

- **Ask what the store adds.** "Eventually consistent" alone lets reads
  go backwards and hide your own writes. Check for read your writes and
  monotonic reads, and whether they need sticky sessions.
- **Know how conflicts resolve.** If two concurrent writes to one key
  can't both survive, find out which one the store keeps. If losing
  either is unacceptable, you need merging or [[crdts|CRDTs]].
- **Don't read-modify-write on it.** Reading a score from a stale copy
  and writing back score + 1 writes a wrong score. Read with a stronger
  guarantee first; if you're the only writer, read your writes is
  enough.
- **Measure the window you have.** The guarantee gives no number, so if
  your product depends on "usually within a second", that's something
  to monitor, not something you were promised.

## Further reading

- [Eventually Consistent - Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html), Werner Vogels, 2008. The definition, the inconsistency window, N/W/R, and the session variants, from Amazon.
- [Replicated Data Consistency Explained Through Baseball](https://www.microsoft.com/en-us/research/wp-content/uploads/2011/10/ConsistencyAndBaseballReport.pdf), Doug Terry, Microsoft Research, 2011. Shows concretely which scores an eventual read can return, including ones that never happened.

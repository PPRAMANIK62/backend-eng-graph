---
id: raft-snapshots
title: Raft snapshots
depth: short
phase: 12
note: >-
  Compacting the log into a snapshot so it doesn't grow forever, and
  sending it to followers that fell too far behind.
needs: [raft-log-replication]
leads_to: []
compare_with: []
---

# Raft snapshots

A [[raft]] log grows with every write. Left alone it fills the disk,
and a restarted server has to replay all of it. A snapshot fixes both:
each server writes its current state to disk and throws away the log
entries that state already includes. The same snapshot is also how a
leader catches up a follower that fell too far behind to be sent the
missing entries one by one.

## Replacing a log prefix with the state it produced

Say a key-value store's log holds five committed entries: `x ← 3`, `y ← 1`,
`y ← 9`, `x ← 2`, `x ← 0`. Applied in order, they leave `x = 0, y = 9`. The
snapshot stores just that result. Entries 1 to 5 can go.

![A log with seven entries, each showing its index, term and command (x ← 3, y ← 1, y ← 9, x ← 2, x ← 0, then y ← 7 and x ← 5). Entries 1 to 5 (terms 1, 1, 1, 2, 3) are committed; 6 and 7 are not yet. After snapshotting, entries 1 to 5 are replaced by a snapshot holding x = 0 and y = 9, labeled last included index 5 and last included term 3. Entries 6 and 7 stay in the log after it.](img/raft-snapshots-compaction.svg)

*A snapshot replaces the committed prefix of the log. Adapted from Ongaro and Ousterhout, figure 12 (2014).*

Raft keeps a little metadata with the snapshot:

- **Last included index and term** (5 and 3 above). The next
  AppendEntries after the snapshot needs the index and term of the entry
  before it for its consistency check (see [[raft-log-replication]]),
  and that entry is gone. These two numbers stand in for it.
- **The latest cluster configuration** as of that index, so
  [[raft-membership-changes]] still work after the entries that carried
  them are gone.
- Anything the state machine needs to stay correct, such as the table of
  client serial numbers it uses to skip duplicate commands.

Only committed entries go into a snapshot. Once it's safely on disk,
the server deletes the log up to the last included index, plus any older
snapshot. LogCabin, the authors' implementation, writes each snapshot to
a temporary file and renames it once it's flushed, so a crash can never
leave a half-written snapshot to load (the same trick as
[[atomic-rename]]).

## Every server snapshots on its own

Each server decides when to snapshot, without asking the leader. That
bends Raft's strong-leader rule, but safely: the compacted entries are
already agreed on. The alternative, the leader snapshotting and
shipping the result to everyone, would waste network bandwidth, because
each follower already has everything it needs to build its own.

## Catching up a follower that's too far behind

Sometimes the leader needs to send a follower an entry it has already
deleted. That happens with a very slow follower or a brand-new
server. The leader then sends its snapshot
instead, with a third RPC, **InstallSnapshot**:

- The snapshot goes in chunks, in order. Each chunk also counts as a
  sign of life from the leader, so the follower doesn't time out and
  start an election halfway through.
- If the snapshot covers entries the follower doesn't have (the usual
  case), the follower throws away its entire log, including any
  uncommitted entries that might conflict, and loads the snapshot.
- If the snapshot only covers a prefix of the follower's log (a
  retransmission, say), it deletes just that prefix and keeps the rest.

## When to take one, and how not to stall

Snapshot too often and you waste disk bandwidth. Too rarely and you risk
running out of disk and make restarts slow. The simplest rule is to
snapshot when the log reaches a fixed size in bytes, set well above the
expected snapshot size. The dissertation suggests a better one: snapshot
when the log grows past the previous snapshot's size times a factor. A
factor of 4 spends about 20% of disk bandwidth on snapshots and needs
about 6 times the state's size on disk (old snapshot, a log 4 times
that, and the new snapshot being written).

Writing a snapshot of a big state takes time. Copying 10 GB of memory
takes about a second, and serializing it takes longer still. So
snapshots have to be taken while the server keeps serving, using
copy-on-write: either immutable data structures, or `fork` on Linux,
where the child [[process]] writes the snapshot while the parent carries on
(this is what LogCabin does).
Copy-on-write costs extra memory in proportion to how much state changes
during the snapshot.

State machines that already keep their data on disk, like an
[[lsm-tree]] store, are different: the data on disk is already a
snapshot, so entries can be dropped from the Raft log once applied and
flushed. They still need a consistent point-in-time copy to send to a
slow follower.

## Where it gets tricky

**Code that assumed the log starts at 1 breaks.** Before compaction,
entry i being present meant entries 1 to i were too. Afterward,
looking up the term of the entry before an AppendEntries can hit an
index that's been discarded. The dissertation's author found this
assumption spread through LogCabin, and advises taking a snapshot after
every entry during development so these paths get exercised.

**Sending a snapshot is rarely urgent, until it is.** A follower that
needs one hasn't been helping commit entries, so its transfer speed
usually doesn't matter. But if another server fails, the cluster may
need that follower back to reach a majority, and then a slow transfer
keeps the cluster unavailable for longer.

## What this means when you build

- Put the last included index, term and configuration in the snapshot
  file itself, and write it with temp file, flush, rename.
- Snapshot concurrently with writes, and budget memory for
  copy-on-write.
- Make the snapshot a stream, not one big in-memory buffer, so a large
  state doesn't need twice the memory to save or send.

## Further reading

- [In Search of an Understandable Consensus Algorithm (Extended Version)](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. Section 7 and figures 12 and 13: snapshots and the InstallSnapshot RPC.
- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. Chapter 5: snapshotting concurrently, when to snapshot, disk-based state machines and implementation pitfalls.

---
id: raft-log-replication
title: Raft log replication
depth: deep
phase: 12
note: >-
  How the leader copies entries to followers, repairs their logs, and
  decides an entry is committed.
needs: [raft]
leads_to: [raft-snapshots, raft-membership-changes, linearizable-reads]
compare_with: []
---

# Raft log replication

Once a [[raft]] cluster has a leader, every write goes through one loop:
the leader appends the command to its log, copies it to the followers,
and calls it committed once a majority has it. That loop is also how
the leader repairs followers whose logs went wrong during earlier
crashes, with no separate recovery step. Most of a Raft system's write
latency, and most of the subtle bugs in Raft implementations, live here.

## One entry's trip

A log is a list of entries. Each entry has an **index** (its position,
starting at 1), the **term** of the leader that created it, and a
**command** for the state machine. Follow one write through a
three-server cluster, where S1 leads term 6 and its log ends at index 9:

1. A client sends `SET x 5` to S1. S1 appends it as entry 10, term 6.
2. S1 sends each follower an AppendEntries message with its term (6),
   the new entry, the index and term of the entry just before it
   (index 9, term 6), and its current commit index.
3. Each follower checks that it has an entry at index 9 with term 6. If
   so, it writes entry 10 to its log on disk and replies success.
4. S1 keeps a **matchIndex** per follower: the highest index it knows
   that follower has. When a majority of servers (S1 counts itself) has
   index 10, S1 advances its **commit index** to 10.
5. S1 applies entry 10 to its state machine and replies to the client.
6. The next AppendEntries or heartbeat carries commit index 10, and the
   followers apply the entry too.

![Sequence diagram with a client, leader S1 and followers S2 and S3. The client sends SET x 5. S1 appends entry 10 in term 6 and sends AppendEntries with prevLogIndex 9 and prevLogTerm 6 to both followers. Each follower checks index 9, appends and persists entry 10, and replies success. After S2's reply, entry 10 is on two of three servers, so S1 commits it, applies it and replies OK to the client. S3's reply arrives later and changes nothing. The next heartbeat carries commit index 10 and the followers apply it.](img/raft-log-replication-sequence.svg)

*One write in a three-server cluster: committed as soon as one follower has it on disk.*

The leader doesn't wait for the slow follower. If a follower is down or
its messages are lost, the leader keeps retrying AppendEntries to it
forever, even after answering the client, until its log catches up.
Retries are harmless because appending an entry that's already there
does nothing.

## The consistency check

Step 3 is what keeps logs from drifting apart. The leader sends the
index and term of the entry just before the new ones (`prevLogIndex`
and `prevLogTerm`), and the follower refuses the new entries unless its
own log has a matching entry there.

That one check gives Raft its **log matching** property: if two logs
have an entry with the same index and term, they hold the same command
there and are identical in every entry before it. The first half is
because a leader creates at most one entry per index in its term, and
entries never move. The second half works by induction. Empty logs
match. Each successful AppendEntries extends a follower's log only where
it already matched the leader's. So a success reply tells the leader
the follower's log equals its own up to the last entry sent.

## Repairing a follower's log

In normal running the check never fails. Crashes are what break it. A
leader can crash after copying its newest entries to only some
followers, and a new leader may never have seen them. After a few
rounds of that, a follower's log can be missing entries, have extra
entries the current leader doesn't, or both.

Raft's fix is blunt: **the leader's log wins.** The leader keeps a
**nextIndex** for each follower, the next entry it plans to send. A new
leader sets it to one past the end of its own log. When a follower
rejects AppendEntries, the leader decrements that follower's nextIndex
and tries again. Eventually it reaches an index where the two logs agree.
The follower then deletes everything after that point that conflicts
with the leader and appends the leader's entries.

![Two logs by index from 1 to 11, with the term of each entry. The leader of term 8's log has terms 1, 1, 1, 4, 4, 5, 5, 6, 6, 6. The follower's log has terms 1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3 out to index 11: it was once leader of terms 2 and 3 and crashed before committing any of those entries. The leader's nextIndex starts at 11 and steps back one rejection at a time until index 4, where the entry before it, index 3 term 1, matches. The follower deletes its entries from 4 on and takes the leader's entries 4 to 10.](img/raft-log-replication-repair.svg)

*A follower with uncommitted entries from old terms. The leader backs up until the logs agree, then overwrites the rest. Adapted from Ongaro and Ousterhout, figure 7 (2014).*

Overwriting a follower's entries sounds dangerous. It's safe because of
the election rule in [[raft-elections]]: a leader always holds every
committed entry, so anything it overwrites was never committed. A leader
never deletes or overwrites entries in its own log, only in followers'.

Backing up one entry per round trip is slow for a follower that's far
behind. The paper sketches a faster version: on a rejection, the
follower returns the term of the conflicting entry and the first index
it has for that term, and the leader skips the whole term at once. The
authors doubted it was needed, since failures are rare. Implementations
that add it have to fill in the details the paper leaves out.

## When an entry counts as committed

The rule has two parts. The leader may set its commit index to N when:

- a majority of servers have an entry at index N (by matchIndex), and
- the entry at index N is from the leader's **current term**.

Committing N also commits every entry before it, including entries from
earlier leaders. The second condition looks fussy, but without it Raft
loses committed data. The paper's figure 8 shows how:

1. S1 leads term 2 and copies an entry at index 2 to S2, then crashes.
2. S5 wins term 3 (votes from S3, S4 and itself) and puts a different
   entry at index 2, then crashes before copying it.
3. S1 comes back, wins term 4, and copies its term-2 entry to S3. Now
   that entry is on S1, S2 and S3, a majority.
4. If S1 treated it as committed and then crashed, S5 could still win an
   election: its last entry has term 3, newer than anything S2, S3 or S4
   holds. It would overwrite index 2 everywhere.

![Three panels of five server logs. First, S1 is leader in term 4: index 2 holds a term-2 entry on S1, S2 and S3, and a term-3 entry on S5. Second, if S1 crashes now, S5 can win with votes from S2, S3 and S4 because its last term 3 is newer, and it overwrites index 2 on every server: the entry on a majority is lost. Third, if S1 first copies a term-4 entry at index 3 to a majority, S5 can't win any more, and index 2 is committed along with index 3.](img/raft-log-replication-commit-rule.svg)

*Being on a majority isn't enough for an entry from an older term. Adapted from Ongaro and Ousterhout, figure 8 (2014).*

Once S1 has a term-4 entry on a majority, S5 can't win (a majority of
servers now have a newer last term than S5), so everything up to that
entry is safe. That's why a new leader commits a blank no-op entry at
the start of its term: it settles which older entries are committed
without waiting for a client write.

Committed is also not the same as applied. The commit index says what's
safe; each server applies entries in index order, up to the commit
index, whenever it gets to them. A follower's applied state can lag the
leader's by a few entries, which matters for reads
([[linearizable-reads]]).

## Making it fast

Every write needs a disk write and a network round trip, and those
dominate. A disk write takes anywhere from about 100 µs on a fast SSD to
10 ms on a slow magnetic disk; a round trip ranges from microseconds in
a tuned datacenter network to hundreds of milliseconds across the world.
The usual optimizations:

- **Leader writes in parallel.** A naive leader writes the entry to its
  disk and only then sends it out, putting two disk writes in a row on
  the critical path. The leader can send first and write at the same
  time. It can even commit before its own write finishes, if a majority
  of followers have the entry on disk.
- **Batching.** One AppendEntries can carry many entries, and the
  follower writes them all with one flush, the same idea as
  [[group-commit]]. Batching raises throughput under load. LogCabin, the
  authors' implementation, sends up to 1 MB per message so heartbeats
  still get through.
- **Pipelining.** The leader sends the next AppendEntries before the
  previous one is acknowledged, moving nextIndex forward optimistically.
  The consistency check makes this safe; if something fails, the leader
  moves nextIndex back and retries. Pipelining cuts latency under
  moderate load.
- **Flow control.** etcd's library tracks each follower in one of three
  modes: **probe** (one message per heartbeat interval, used by a new
  leader and after a rejection), **replicate** (stream entries,
  pipelined, up to a limit of messages in flight) and **snapshot** (the
  follower is so far behind it needs a [[raft-snapshots|snapshot]]).
  The in-flight limit keeps the leader from overflowing the transport's
  send buffer. A byte limit on data in flight caps throughput the way
  any window does ([[bandwidth-delay-product]]): etcd's own example is 1
  MB in flight with a 100 ms round trip limiting a group to 10 MB/s.

## Where it gets tricky

**Heartbeats aren't special.** A heartbeat is an AppendEntries with no
entries, and the follower must still run the consistency check on
`prevLogIndex`. A follower that just resets its timer and says "OK" is
telling the leader its log matches when it may not, and the leader may
commit on that basis.

**Only truncate on a real conflict.** If a follower already has every
entry in the message, it must not cut off entries after them. Messages
can arrive late or twice, and truncating on an old message would take
back entries the follower already acknowledged.

**nextIndex is a guess; matchIndex is a fact.** nextIndex is optimistic
and only affects speed. matchIndex decides commitment, so it can only
move forward on a success reply, and should be set from what the
original request contained (`prevLogIndex` plus the number of entries),
not from whatever the leader's state is when the reply arrives. Replies
from an older term should be dropped.

**Persist before you send.** A follower's success reply is a promise
that the entry is on disk. etcd's library spells out the order: write
entries and term/vote state to storage, then send messages, then apply
committed entries.

**A proposal can vanish.** Handing a command to the leader doesn't
guarantee it commits. The leader can lose leadership first, and the
entry is overwritten. The client has to time out and retry, which means
the command may end up committed twice unless the state machine
[[idempotency|filters duplicates]].

## What this means when you build

- Your write latency is roughly one fsync plus one round trip to the
  nearest majority. Put replicas where that round trip is short, and on
  disks with fast flushes.
- Batch and pipeline. A leader that sends one entry per round trip and
  flushes once per entry will be slow under any real load.
- Cap the bytes and messages in flight per follower, sized to the
  bandwidth-delay product of the link, or one slow follower can eat the
  leader's memory and bandwidth.
- Apply committed entries in one place, in order. Don't apply from
  several goroutines or threads that each noticed the commit index moved.
- Test log repair on purpose: crash leaders mid-replication, restart them,
  and check that no committed entry ever disappears.

## Further reading

- [In Search of an Understandable Consensus Algorithm (Extended Version)](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. Section 5.3 for replication and repair, 5.4.2 and figure 8 for the commit rule.
- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. Section 10.2: writing to the leader's disk in parallel, batching and pipelining, with disk and network latency ranges.
- [etcd-io/raft design.md](https://github.com/etcd-io/raft/blob/main/design.md), etcd authors. The probe, replicate and snapshot modes and flow control in a production library.
- [etcd-io/raft raft.go](https://github.com/etcd-io/raft/blob/main/raft.go), etcd authors. The `MaxInflightMsgs` and `MaxInflightBytes` limits, with the bandwidth-delay example.
- [etcd-io/raft README](https://github.com/etcd-io/raft), etcd maintainers. The order an application must persist, send and apply in, and why a proposal can be dropped.
- [Students' Guide to Raft](https://thesquareplanet.com/blog/students-guide-to-raft/), Jon Gjengset, 2016. The replication bugs students hit most, and a precise version of fast log backup.

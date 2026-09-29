---
id: linearizable-reads
title: Linearizable reads
depth: short
phase: 12
note: >-
  Serving reads from a Raft group without returning stale data.
  ReadIndex and lease reads.
needs: [raft-log-replication, linearizability, leases]
leads_to: []
compare_with: []
---

# Linearizable reads

Writes in a [[raft]] cluster go through the log, so they're ordered and
safe. Reads are the tempting shortcut: the leader has the latest data,
so why not just answer from memory? Because the server answering may no
longer be the leader and not know it, and then it returns stale data.
Serving reads that are both fast and never stale takes one of two
tricks, ReadIndex or a lease, and each has a cost.

## How a read goes stale

[[linearizability|Linearizability]] means every operation appears to
happen at one instant between its start and its end, so a read must see
every write that finished before the read began. Now picture a
five-server cluster where the leader, S1, gets cut off by a
[[network-partitions|partition]] with one follower. The other three
elect S3 in a new term and keep committing writes. S1 hasn't heard about
it. A client that can still reach S1 asks for `x`, and S1 answers from
its own copy: an old value. A client that just wrote `x` through S3
would see its write vanish.

Real systems have shipped this bug. The Raft dissertation notes it in
two third-party implementations, and etcd 0.4.1
served stale reads by default: any leader
answered locally without checking for a newer one.

## The slow, obvious fix: put reads in the log

Treat the read as a command. Append it, replicate it, and answer when
it's committed and applied. If S1 has been replaced, it can't get a
majority to accept the entry, so it never answers. This is correct, but
every read now costs a disk write on a majority of servers, which is the
expensive part of a Raft write ([[raft-log-replication]]).

## ReadIndex: confirm leadership, skip the log

The leader can skip the log if it checks two things: that it knows the
latest commit index, and that it's still the leader.

1. **Know what's committed.** A new leader has every committed entry but
   may not know which ones are committed. It finds out by committing a
   blank no-op entry at the start of its term. Until that commits, it
   holds reads back.
2. **Record the read index.** The leader saves its current commit index
   as `readIndex`. The answer must reflect at least this point.
3. **Confirm it's still leader.** It sends a round of heartbeats and
   waits for a majority to reply. If they do, no newer leader could have
   existed when it sent them, so `readIndex` was the highest commit index
   anywhere at that moment.
4. **Wait for the state machine** to apply entries up to `readIndex`.
5. **Answer** from its state machine.

![Sequence diagram with a client, leader S1 and followers S2 and S3. The client sends a read of x. S1 records readIndex = 42, its commit index. It sends heartbeats to S2 and S3; S2 replies first, which with S1 itself makes a majority. S3 replies later; its ack isn't needed. S1 waits until it has applied index 42, then returns x to the client. No log entry is written and no disk write happens.](img/linearizable-reads-readindex.svg)

*ReadIndex costs one round of heartbeats instead of a log write. The index 42 is only an example.*

One heartbeat round covers every read that arrived meanwhile. Followers can serve reads too: a follower
asks the leader for a current read index (the leader runs steps 1 to 3),
waits until it has applied that far itself, and answers. That spreads
read load off the leader while staying linearizable.

In etcd's Go library this is the `ReadOnlySafe` mode, the default, and
the code holds read requests back until the leader has committed an
entry in its term.

## Lease reads: trade a clock assumption for a round trip

ReadIndex still pays a network round trip per batch of reads. A lease
removes it. When a majority acknowledges the leader's heartbeat, the
leader knows followers won't start an election for at least an election
timeout, so no new leader can appear for about that long. It treats
that window as a [[leases|lease]] and answers reads locally, with no
messages at all, until the lease runs out.

The catch is that safety now depends on time. The lease is only valid if
clocks on different servers advance at nearly the same rate, so the
leader shortens it by a bound on clock drift: it lasts from when the
heartbeats went out plus the election timeout divided by that bound. A
[[process-pauses|paused process]], a VM migration, or a clock rate
adjustment can break that, and then a deposed leader serves reads from
the past. The dissertation doesn't recommend leases unless you need the
performance. etcd's library offers them as `ReadOnlyLeaseBased`, warns
that unbounded [[clock-skew|clock drift]] makes them unsafe, and refuses
the mode unless CheckQuorum is on, so a leader that loses its majority
steps down (see [[raft-elections]]).

## Where it gets tricky

**Serializable isn't linearizable.** Many systems offer a cheaper read
that may be stale. Since its 3.0 API, etcd makes reads linearizable by
default, and a `serializable` flag (in the [[serializability]] sense, not linearizable) downgrades a read so it may return
stale committed data. That's fine for a dashboard, not for a
lock check.

**Monotonic reads are a middle ground.** If servers return the log index
of the state they answered from, a client can pass back the highest
index it has seen and refuse answers from a server that's behind. That
keeps one client from seeing time go backwards, even if clocks misbehave,
without making every read linearizable.

## What this means when you build

- Default to ReadIndex. It's safe under any timing and costs one
  heartbeat round, shared across concurrent reads.
- Use leases only if you've measured that the round trip matters, and
  then keep the lease well inside the election timeout and turn on
  CheckQuorum.
- Know which read mode your datastore uses.
- Test with a partition that isolates the leader plus a
  [[linearizability-checking|linearizability checker]]; stale reads only
  show up when an old leader is still answering.

## Further reading

- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. Section 6.4: ReadIndex step by step, follower reads, and lease reads with their clock assumption.
- [etcd-io/raft raft.go](https://github.com/etcd-io/raft/blob/main/raft.go), etcd authors. `ReadOnlySafe` and `ReadOnlyLeaseBased`, and the checks around them.
- [Jepsen: etcd 3.4.3](https://jepsen.io/analyses/etcd-3.4.3), Kyle Kingsbury, 2020. etcd's history of stale reads, and what its linearizable and serializable modes promise.

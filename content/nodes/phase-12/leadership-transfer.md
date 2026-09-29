---
id: leadership-transfer
title: Leadership transfer
depth: short
phase: 12
note: >-
  Handing Raft leadership to a chosen follower on purpose, for
  maintenance, without waiting for a timeout.
needs: [raft-elections]
leads_to: []
compare_with: []
---

# Leadership transfer

In [[raft]], a new leader normally appears only after the old one goes
quiet and some follower's election timer runs out. That's fine for
crashes, but wasteful when you know the leader is about to go away:
restarting it for maintenance, or removing it from the cluster. The
cluster would sit idle for an election timeout for no reason.
Leadership transfer lets the leader hand over to a chosen follower on
purpose, in about the time of one round of messages.

## Why you'd want it

- **Planned restarts.** When the leader steps down, the cluster is
  otherwise idle until a follower times out and wins an election.
  Handing over first avoids that gap.
- **Putting the leader somewhere better.** A heavily loaded server
  makes a poor leader. In a deployment across data centers, you may
  want the leader in the primary one, close to most clients. Raft can't
  simply vote for the preferred server, because the
  [[raft-elections|election rules]] only let a server with an
  up-to-date log win, and the preferred one may not have it. So the
  leader can check now and then whether a follower would be a better
  leader, and hand over.

## How it works

1. **The leader stops accepting new client requests,** so its log stops
   growing.
2. **It brings the target fully up to date,** sending it every log
   entry it's missing through the normal
   [[raft-log-replication|log replication]].
3. **It sends the target a TimeoutNow message.** That has the same
   effect as the target's election timer firing: the target increments
   its term, becomes a candidate and asks for votes right away.

Because the target starts first and has a complete log, it almost
certainly wins. Its next message carries the new term, which makes the
old leader step down. Normal majority voting still decides the outcome,
so all of Raft's safety rules keep holding.

If the target fails, the transfer mustn't leave the cluster stuck: if
it hasn't completed after about an election timeout, the old leader
gives up and starts accepting requests again. At worst, a target that
was alive after all causes one extra election.

## Why it's safe

A TimeoutNow message just makes the target's clock seem to jump forward.
Raft is already safe when clocks run at arbitrary speeds, so a timer
that fires early can't break anything. The transfer only uses moves the
protocol already allows.

## Where it gets tricky

**It interacts with other extensions.** Pre-Vote and similar checks make
followers ignore vote requests while they've recently heard from a
leader. A transfer election has to bypass that check, or the other
followers will refuse to vote for the target. And a leader serving
reads under a lease must let its lease expire before transferring, or
two servers could both believe they may answer reads.

**It was an extension, not the core.** The Raft dissertation describes
it but notes it was neither implemented nor evaluated by the author.
Libraries such as etcd's Raft include it; check yours does.

**The leader goes quiet for a moment.** Client requests pause from step
1 until the new leader takes over. That's much shorter than an election
timeout, but not zero.

## What this means when you build

- Transfer leadership before restarting or removing the leader, instead
  of letting it time out.
- If you care where the leader lives, run a periodic check that
  transfers it to the preferred, up-to-date server.
- Make sure the transfer election bypasses Pre-Vote, and that leases
  expire first.

## Further reading

- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. Section 3.10 describes the leadership transfer extension, step by step, and why it's safe.
- [etcd-io/raft](https://github.com/etcd-io/raft), etcd authors. A Raft library that implements leadership transfer.

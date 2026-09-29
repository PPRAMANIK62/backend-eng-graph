---
id: raft-elections
title: Raft elections
depth: deep
phase: 12
note: >-
  How Raft picks a leader: randomized timeouts, votes only for nodes
  with an up-to-date log. Pre-vote and check-quorum.
needs: [raft, failure-detection]
leads_to: [leadership-transfer]
compare_with: [leader-election]
---

# Raft elections

A Raft cluster has at most one leader per term, and when that leader
dies the others have to notice and pick a new one. They do it with a
timeout that each server chooses at random, and a vote that only goes
to a candidate whose log is at least as complete as the voter's. The
first part decides how long your writes stop after a crash. The second
is what keeps committed data from being lost when leadership changes.

## Silence starts an election

A leader proves it's alive by sending heartbeats: AppendEntries
messages with no entries, sent to every follower on a steady interval.
Each follower runs an **election timer**. Every valid message from the
current leader resets it. If the timer runs out with no word from a
leader, the follower assumes there isn't one and starts an election.

That makes the election timer a [[failure-detection|failure detector]],
and like any timeout it can't tell a dead leader from a slow one or a
lost packet. Raft doesn't need it to. A wrong guess costs one
unnecessary election, never a wrong answer, because every step below is
safe no matter how early or late it happens.

## One election, step by step

Take five servers in term 4. S1 is leader and crashes. S2 to S5 stop
getting heartbeats, and their timers run down. Each picked a different
random timeout, so one of them expires first. Say it's S3.

1. S3 increments its term to 5 and becomes a **candidate**.
2. It votes for itself and saves that vote to disk.
3. It sends RequestVote to every other server, carrying its new term and
   the index and term of the last entry in its log.
4. S2, S4 and S5 each check the request (next section), save their
   vote, and reply yes.
5. With four votes out of five, S3 has a majority. It becomes leader and
   immediately sends heartbeats, which reset everyone's timers before
   any of them run out.

![Timeline for five servers. Leader S1 sends a last heartbeat in term 4 and crashes. Each follower's election timer is a bar of a different random length. S3's runs out first; it moves to term 5, votes for itself and sends RequestVote. S2, S4 and S5 grant their votes. S3 becomes leader and sends heartbeats, which reset the other timers before they expire.](img/raft-elections-timeline.svg)

*Randomized timeouts usually let one server start, and win, before the others time out.*

A candidate stays a candidate until one of three things happens:

- **It wins** a majority of the full cluster, counting itself.
- **Someone else wins.** It gets an AppendEntries from a leader whose
  term is at least its own, and goes back to being a follower.
- **Nobody wins.** The votes split, its timer runs out again, and it
  starts a new election in a new term.

If any message shows a server a term higher than its own, it adopts
that term and becomes a follower on the spot. That's how a stale
leader or candidate is pushed aside.

## Who gets a vote

Each server votes for at most one candidate per term, first come, first
served. It stores its current term and its vote on disk before replying,
so a crash and restart can't make it vote twice in one term. Winning
needs a majority, and two majorities can't both form in one term, so
there's never more than one leader per term.

Raft adds a second condition that makes the whole algorithm safe: **a
server refuses to vote for a candidate whose log is less up to date
than its own.** To compare two logs, look at their last entries:

- If the last terms differ, the log whose last entry has the higher
  term is more up to date.
- If the last terms are equal, the longer log is more up to date.

Here's why that's enough. A committed entry is stored on a majority. A
winner collected votes from a majority. The two groups share at least
one server, and that server refuses anyone missing the entry. So a
server without every committed entry can't become leader. [[raft]]
walks through this overlap with a picture. It also means new leaders
never have to fetch missing entries during the election. Entries only
ever flow outward from the leader.

A new leader's first moves follow from this. It sends heartbeats right
away, and it commits a blank no-op entry in its own term, which settles
which older entries are committed (see [[raft-log-replication]]).

## Random timeouts break ties

If two followers time out at the same moment, both become candidates in
the same term, each votes for itself, and they may split the rest so
neither reaches a majority. Both time out and try again, and without
something to break the symmetry that could repeat forever.

Raft breaks it with randomness. Each server picks its election timeout
at random from a range, and picks a fresh one at the start of every
election. Usually one server times out clearly first, wins, and sends
heartbeats before anyone else wakes up.

The paper measured how much randomness this takes, on a five-server
cluster with a broadcast time of about 15 ms, crashing the leader
over and over (1,000 trials per setting, 100 for the no-randomness one):

- With no randomness (every timeout exactly 150 ms), elections
  consistently took longer than 10 seconds because of repeated split
  votes.
- Adding just 5 ms of randomness (150 to 155 ms) brought the median
  time without a leader down to 287 ms.
- With 50 ms of randomness, the worst case over 1,000 trials was 513 ms.
- Shrinking the timeout to 12 to 24 ms elected a leader in 35 ms on
  average, but timeouts that short risk leaders not getting heartbeats
  out in time.

The authors recommend 150 to 300 ms. The general rule is that the
broadcast time, including the disk writes a vote needs, should be well
under the election timeout, which should be far under the time between
server failures. etcd's Raft library counts time in ticks instead: you
set an election timeout in ticks (10 heartbeat ticks is the suggested
ratio), and it picks each server's actual timeout at random between one
and two times that.

## Keeping a healthy leader in place: Pre-Vote and CheckQuorum

Plain Raft has a weakness. A server that can't hear the leader bumps
its term and calls an election, and the higher term knocks the current
leader out even if that leader is fine and reachable by everyone else.

- **A server returns from a partition.** While cut off it kept timing
  out and raising its term. When it reconnects, its big term number
  forces the leader to step down, and the cluster holds an election it
  didn't need.
- **Partial network failures.** In a five-server cluster where S4 can
  only reach S2 and S5 can only reach S3, whichever leader wins, S4 or
  S5 can't hear it, times out, raises the term through its one link, and
  deposes it. The cluster never settles, even though a majority is
  connected.

That second case happened to Cloudflare in 2020. A switch failed
partially, so one etcd member could reach one peer but not the leader.
It kept starting elections, the cluster kept losing its leader, and etcd
couldn't take writes until the switch recovered, which set off a chain
of failures in the database layer that took hours to clear.

![Two panels. Left, plain Raft: five servers where S1, S2 and S3 are fully connected, S4 links only to S2 and S5 only to S3. S4 times out, sends a higher term through S2, and the leader S3 steps down; this repeats. Right, with Pre-Vote: S4 asks for a pre-vote first; S2 still hears from the leader, so it says no, and S4's term never goes up.](img/raft-elections-prevote.svg)

*A partially connected server keeps deposing the leader until Pre-Vote stops it. Adapted from Heidi Howard and Ittai Abraham, "Raft does not Guarantee Liveness in the face of Network Faults" (2020).*

Two extensions fix this, and they work as a pair:

- **Pre-Vote.** Before raising its term, a would-be candidate runs a
  trial election. Others say yes only if they'd really vote for it:
  its log is up to date enough, and they haven't heard from a leader
  within the election timeout. A server that can't win never raises
  its term, so it can't disrupt anyone. This comes from section 9.6 of
  Ongaro's dissertation.
- **CheckQuorum.** A leader steps down if it hasn't heard back from a
  majority within an election timeout. Without this, Pre-Vote adds a
  new trap: a leader that lost its majority but still reaches one
  follower keeps that follower from pre-voting for anyone else, so no
  one can be elected and the old leader can't commit either.

With both, a server connected to a majority can always get elected, and
once elected it isn't pushed out while its heartbeats get through. In
etcd's library they're the `PreVote` and `CheckQuorum` fields of its
`Config` struct, which you turn on yourself.

## Where it gets tricky

**The vote rule is what makes Raft different from Paxos.** Compared
side by side, the two algorithms differ only in how they elect a leader.
[[paxos|Paxos]] gives each server its own terms, so candidates never
tie, but voters send their log entries to the candidate, which then has
to catch up. Raft lets candidates tie, which should make its elections
slower and more variable, but its election carries no log entries at
all. Neither is strictly better.

**Resetting the timer at the wrong moment causes livelock.** Reset it
only when you get AppendEntries from the current leader (not an old
one), when you start an election, and when you grant a vote. Resetting
it whenever someone merely asks for your vote lets servers with stale
logs keep interrupting the few that could actually win.

**It's not the same thing as leader election in your app.** Raft's
election picks the leader of one consensus group, and it's safe because
every message carries a term. A leader that freezes for a while
([[process-pauses]]) and wakes up still believing it leads gets its
next message rejected for carrying an old term. Picking one worker to
run a cron job is a different problem with different tools, covered in
[[leader-election]].

**Pre-Vote doesn't stop every disruption.** A server being removed from
the cluster can have a log that's up to date enough to pass the
pre-vote and still knock out the leader. That case needs a different
rule, covered in [[raft-membership-changes]].

## What this means when you build

- Turn on Pre-Vote and CheckQuorum. Lease-based reads in etcd's library
  refuse to run without CheckQuorum anyway.
- Pick the election timeout from your real broadcast time, including an
  fsync on each voter. Much shorter than the paper's 150 to 300 ms only
  makes sense on fast disks and a fast network.
- Expect writes to stop for about one election timeout after the leader
  dies, plus however long the election itself takes.
- Persist the term and vote before replying to RequestVote. A server
  that forgets its vote after a crash can help elect two leaders in one
  term.
- Planned restarts don't need to wait for a timeout: [[leadership-transfer]]
  has the leader catch a chosen follower up and tell it to start an
  election at once.

## Further reading

- [In Search of an Understandable Consensus Algorithm (Extended Version)](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. Sections 5.2 and 5.4.1 for the election and the vote rule; 9.3 for the timeout measurements.
- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. Section 9.6 introduces Pre-Vote, 6.2 the leader stepping down without a majority, 3.10 leadership transfer.
- [Raft does not Guarantee Liveness in the face of Network Faults](https://decentralizedthoughts.github.io/2020-12-12-raft-liveness-full-omission/), Heidi Howard and Ittai Abraham, 2020. Why Raft needs both Pre-Vote and CheckQuorum, with small counter-examples.
- [A Byzantine failure in the real world](https://blog.cloudflare.com/a-byzantine-failure-in-the-real-world/), Tom Lianza and Chris Snook, Cloudflare, 2020. A partial switch failure that kept an etcd cluster in elections, and what followed.
- [etcd-io/raft raft.go](https://github.com/etcd-io/raft/blob/main/raft.go), etcd authors. The `Config` options for election ticks, PreVote, CheckQuorum and read modes, with their comments.
- [Paxos vs Raft: Have we reached consensus on distributed consensus?](https://arxiv.org/abs/2004.05074), Heidi Howard and Richard Mortier, 2020. How Raft's election differs from Paxos's, and what each costs.
- [Students' Guide to Raft](https://thesquareplanet.com/blog/students-guide-to-raft/), Jon Gjengset, 2016. When to reset the election timer, and the livelocks you get when you don't.

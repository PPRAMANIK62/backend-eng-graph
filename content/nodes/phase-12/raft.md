---
id: raft
title: Raft
depth: deep
phase: 12
note: >-
  Consensus built to be understood: terms, one leader, and the rules
  that keep a committed entry from ever being lost.
needs: [replicated-state-machine, leader-follower-replication]
leads_to: [raft-elections, raft-log-replication, coordination-services, distributed-transactions]
compare_with: [paxos, chain-replication]
---

# Raft

Raft is a way for a small group of servers, usually three or five, to
keep one log identical on all of them, so the group behaves like a
single machine that doesn't go down when one of its members does.
Diego Ongaro and John Ousterhout designed it at Stanford in 2014, with
being easy to understand as the main goal. The etcd Raft library
powers etcd, Kubernetes, CockroachDB and TiDB, among others, so when you run any of
those, Raft's rules decide when your writes stall, when a read
can be stale, and how many machines you can lose.

## The job: one log, many copies

Say you want a key-value store that survives a crashed server. You run
it on three machines. Each machine keeps a log of commands (`SET x 5`,
`DEL y`) and applies them, in order, to its own copy of the data.
If every machine applies the same commands in the same order, and
applying them is deterministic, every copy ends up the same. That's a
[[replicated-state-machine]], and the hard part is the log: getting
every machine to agree on what's in slot 1, slot 2, slot 3, even while
machines crash and messages get lost. Agreeing on that is
[[consensus]], and Raft is an algorithm for it.

Raft's promise is about majorities. The group keeps working as long as
more than half of its servers are up and can talk to each other. Three
servers survive one failure. Five survive two. Safety holds under
anything short of lying servers: delayed, lost, duplicated or reordered
messages, and servers that crash and come back from disk.

## One leader at a time, numbered by terms

Every server is in one of three roles:

- **Leader.** Takes every client request, decides where each command
  goes in the log, and sends it to the others.
- **Follower.** Passive. Answers the leader and candidates, and
  otherwise does nothing.
- **Candidate.** A follower that stopped hearing from a leader and is
  asking for votes to become one.

This is [[leader-follower-replication]] with the protocol itself
deciding who leads. Log entries only ever flow from the leader out to
the followers. The leader never asks anyone else what the log should
be, which is most of why Raft is easier to follow than older designs.

Time is split into **terms**, numbered 1, 2, 3 and so on. Each term
starts with an election. If a candidate wins, it leads for the rest of
that term. If the vote splits, the term ends with no leader and a new
term begins. Raft guarantees at most one leader per term.

![Left: the three roles and the transitions between them. A follower that times out becomes a candidate; a candidate that gets votes from a majority becomes leader; a candidate or leader that sees a higher term goes back to follower. Right: a timeline of terms 1 to 4, each starting with an election, where term 3 ends without a leader after a split vote.](img/raft-roles-and-terms.svg)

*The three roles, and time divided into terms. Adapted from Ongaro and Ousterhout, "In Search of an Understandable Consensus Algorithm", figures 4 and 5 (2014).*

Terms work as a logical clock, a bit like a [[lamport-clocks|Lamport
clock]]. Every message carries the sender's current term. If a server
sees a higher term than its own, it adopts it, and a leader or
candidate that does so steps down on the spot. A request carrying an
older term is rejected. That's how a leader that was cut off and
replaced finds out: the first reply it gets carries a newer term.

The whole core algorithm runs on two messages. **RequestVote** is sent
by candidates during an election. **AppendEntries** is sent by the
leader to copy log entries, and an empty one doubles as a heartbeat.
A third, **InstallSnapshot**, comes in later for
[[raft-snapshots|snapshots]].

## Following one write

A client sends `SET x 5` to the leader of a three-node cluster, in term 4:

1. The leader appends the command to its log as a new entry. The entry
   records the command and the term, 4, and sits at a numbered position,
   say index 7.
2. It sends AppendEntries with that entry to both followers in parallel.
3. Each follower checks that its log agrees with the leader's up to
   index 6, writes the entry to disk, and says yes.
4. As soon as one follower has said yes, the entry is on two of three
   servers, a majority. The leader marks it **committed**, applies it to
   its own key-value store and replies to the client.
5. The followers learn that index 7 is committed from the leader's next
   AppendEntries (heartbeats carry it too), and apply it themselves.

A write costs one round trip from the leader to a majority, plus a disk
write on each server that counts. A slow third server doesn't slow
anything down. How the leader repairs followers whose logs have drifted,
and the exact rule for "committed", are in [[raft-log-replication]].

## The rules that keep a committed entry safe

The point of all this is one promise: once an entry is committed, it's
never lost or replaced, even if every leader after it crashes. Raft gets
there with a chain of properties that each hold at all times:

- **Election safety.** At most one leader per term. Each server votes
  once per term, and winning needs a majority, and two majorities can't
  both exist in one term.
- **Leader append-only.** A leader never deletes or overwrites entries
  in its own log.
- **Log matching.** If two logs have an entry with the same index and
  term, they're identical up to that point.
- **Leader completeness.** A committed entry is in the log of every
  future leader.
- **State machine safety.** If one server has applied an entry at some
  index, no server ever applies a different one at that index.

Leader completeness is the one that makes the others add up, and it
comes from majorities overlapping. An entry commits once a majority has
stored it. A candidate wins only with votes from a majority. Any two
majorities of the same five servers share at least one server. So in
every winning election, at least one voter has the committed entry. Raft
adds one rule to the vote: a server refuses to vote for a candidate
whose log is less up to date than its own. The voter holding the entry
would refuse a candidate that lacks it, so that candidate can't win.

![Five servers S1 to S5. S1, S2 and S3 are circled as the majority that stored entry 7 in term 4, so it's committed. S3, S4 and S5 are circled as the majority that votes in a later election. The circles overlap on S3, which has entry 7 and refuses to vote for any candidate whose log lacks it.](img/raft-majority-overlap.svg)

*Why a new leader always has every committed entry: the majority that stored it and the majority that elects the next leader share a server. Adapted from Ongaro and Ousterhout, figure 9 (2014).*

There's one more subtle rule. A new leader may find entries from older
terms that are on a majority but were never marked committed. It must
not count replicas and call them committed, because a later leader could
still overwrite them. It only commits entries from its own term by
counting, and older ones become committed along with them. So each new
leader commits a blank no-op entry at the start of its term, which
settles this right away. [[raft-elections]] covers the vote in detail, and
[[raft-log-replication]] walks through the case that forced this rule.

## What has to survive a crash

Raft assumes a server can crash and restart from its disk. Before it
answers any RPC, each server must have on stable storage:

- its **current term** and who it **voted for** in that term, so it
  can't vote twice in one term after a restart;
- its **log entries**, written before they count toward a majority, so a
  restart can't "uncommit" something.

That means an [[fsync]] (or an equivalent flush) on the path of every
vote and every write, much like a database's [[write-ahead-log]]. The
commit index doesn't need saving; it's rebuilt as soon as a leader
commits something new. A server that loses its disk can't safely rejoin
under its old identity, because it might vote again in a term it already
voted in. It has to be added back as a new member, through a
[[raft-membership-changes|membership change]].

## Timing decides availability, never safety

Raft never uses clocks to decide what's committed. Delays and bad clocks
can stop progress, but they can't make two servers apply different
commands. Where timing does matter is electing a leader, and the rule is:

broadcast time ≪ election timeout ≪ mean time between failures

Broadcast time is how long a round of RPCs to everyone takes, including
their disk writes, roughly 0.5 ms to 20 ms depending on the storage. So
election timeouts end up somewhere between 10 ms and 500 ms. When a
leader crashes, writes stop for about one election timeout while
followers notice and pick a new one. Noticing a dead leader is a
[[failure-detection]] problem, and like every timeout-based detector it
can mistake a slow leader for a dead one. That's fine for safety, which
is exactly why Raft keeps safety away from timing: no consensus
algorithm can guarantee progress in a fully asynchronous system
([[flp-impossibility]]), so Raft only needs timing for progress.

## The pieces around the core

The core above assumes a fixed set of servers and a log that grows
forever. Real systems need more, and each piece is its own node:

- [[raft-elections]]: randomized timeouts, the up-to-date vote check,
  and the Pre-Vote and CheckQuorum extensions production systems turn on.
- [[raft-log-replication]]: the consistency check, repairing logs,
  batching and pipelining.
- [[raft-snapshots]]: compacting the log and catching up slow followers.
- [[raft-membership-changes]]: adding and removing servers safely.
- [[linearizable-reads]]: answering reads without returning stale data.

Clients need one more thing. If a leader commits a command and crashes
before replying, the client retries with the new leader and the command
runs twice. Raft's answer is the usual [[idempotency]] trick: each
client tags commands with a serial number, and the state machine
remembers the last one it ran per client and skips repeats.

## Where it gets tricky

**Understandable isn't the same as easy to implement.** The paper's
one-page summary (its figure 2) is precise, and students who treated it
as a rough guide wrote implementations that mostly worked and then broke
in subtle ways. Every line of it is a MUST. Ongaro's own dissertation
calls client interaction a major source of bugs in real Raft systems.
This is why the phase 12 lab tests Raft with
[[deterministic-simulation-testing]] and a
[[linearizability-checking|linearizability checker]] rather than a few
unit tests.

**Is Raft really simpler than Paxos?** The Raft paper's user study found
33 of 43 students did better on a Raft quiz than a Paxos one. A later
comparison by Heidi Howard and Richard Mortier rewrote Multi-Paxos in
Raft's own terms and found the two differ only in how they elect a
leader: Raft only lets a server with an up-to-date log win, while
[[paxos|Paxos]] lets anyone win and then catches its log up. Their
conclusion is that much of Raft's clarity comes from how the paper
presents it, not from a different algorithm.

**One leader per term isn't one leader at a time.** A leader cut off by
a [[network-partitions|partition]] keeps believing it leads while the
rest elect a new one in a higher term. Two servers think they're leader.
The old one can't commit anything, because it can't reach a majority
that hasn't seen the new term. But if it answers reads from its own
copy, it can serve stale data. That's the whole subject of
[[linearizable-reads]].

**Majority connected isn't always enough.** Raft promises to keep working
while a majority of servers can communicate. But a server that's cut off
keeps timing out and raising its term, and when it can reach the others
again, that higher term forces a healthy leader to step down. On a
network where some links work and others don't, this can happen even
though a majority is connected. The fixes, Pre-Vote and CheckQuorum,
are covered in [[raft-elections]].

**It trusts every server.** Raft handles crashes and a bad network, not
servers that lie. That's [[byzantine-fault-tolerance]], and algorithms
for it are much more complicated and less efficient.

**The core is proven; the extensions less so.** The authors wrote a
formal TLA+ specification of the core algorithm and a proof of its
safety. Both cover the consensus core in section 5 of the paper, not the
extensions around it (membership changes, snapshots, reads). Those are
where to expect subtle bugs, and a good reason to use a well-tested
library rather than your own variant.

## What this means when you build

- Run three or five voting members. Five tolerates two failures, and a
  majority of four is three, so a fourth server adds a vote to wait for
  without adding a failure you can survive.
- Every write waits for a disk flush and a network round trip to a
  majority. A slow disk on the leader or a slow network to half the
  cluster shows up directly in write latency.
- After a leader crash, expect writes to stop for about one election
  timeout. Clients need retries with a timeout, and command IDs so a
  retry isn't applied twice.
- Don't write Raft from scratch for production. Libraries such as
  etcd's Go `raft` package implement only the algorithm and leave disk
  and network to you, so you still have to persist before you send.

## Further reading

- [In Search of an Understandable Consensus Algorithm (Extended Version)](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. The Raft paper; figure 2 is the one-page summary every implementation follows.
- [Consensus: Bridging Theory and Practice](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf), Diego Ongaro, 2014. The dissertation: what must be persisted, timing, and every extension in more depth than the paper.
- [Paxos vs Raft: Have we reached consensus on distributed consensus?](https://arxiv.org/abs/2004.05074), Heidi Howard and Richard Mortier, 2020. The two algorithms side by side in the same terms; where they really differ.
- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge, 2021. Section 6: consensus, leader election and why one leader per term isn't one leader at a time.
- [etcd-io/raft README](https://github.com/etcd-io/raft), etcd maintainers. The Raft library behind etcd, Kubernetes, CockroachDB and TiDB, and what it leaves to you.
- [Students' Guide to Raft](https://thesquareplanet.com/blog/students-guide-to-raft/), Jon Gjengset, 2016. The bugs students hit implementing Raft for MIT 6.824, and why figure 2 must be followed exactly.

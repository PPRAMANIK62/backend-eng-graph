---
id: paxos
title: Paxos
depth: deep
phase: 12
note: >-
  The original consensus algorithm, and Multi-Paxos for a whole log.
needs: [replicated-state-machine, flp-impossibility]
leads_to: [flexible-quorums]
compare_with: [raft, leases, quorums]
---

# Paxos

Paxos is the algorithm that first showed how a group of machines can
agree on a value while some of them crash and messages get lost or
delayed. Leslie Lamport published it in 1998 and retold it in plain
English in 2001. You'll probably never write it yourself, but plenty of
systems you depend on run it or something close to it, and
[[raft|Raft]] is easiest to understand as a close relative of it.

## One value, several proposers

Say three servers have to agree on who holds a lock, X or Y. That's
[[consensus]] on a single value, which Paxos calls single-decree. The
rules: only a value someone proposed can be chosen, only one value is
ever chosen, and nobody hears that a value was chosen unless it was.

Paxos splits the work into three roles. **Proposers** suggest values.
**Acceptors** vote on them. **Learners** find out what was chosen. In a
real system every server usually plays all three.

The [[failure-models|failure model]] is crash-recovery over an
asynchronous network. Servers run at any speed, stop, and come back.
Messages can be delayed, lost or duplicated, but they aren't corrupted
and nobody lies. (Lying is [[byzantine-fault-tolerance]].)

Two obvious designs fail:

- **One acceptor** that takes the first value it hears. Simple, until it
  dies and nothing can ever be decided again.
- **Several acceptors that each take the first value they hear,** with a
  value chosen once a majority holds it. Two proposers at the same
  moment can split the acceptors half and half. If one acceptor then
  dies, nobody can tell which value won.

So Paxos keeps the majority rule, and lets acceptors accept more than
one proposal under strict conditions. Majority works because any two
majorities of the same group share at least one member (see
[[quorums]]). That shared member is how later proposers learn about
earlier decisions.

## Proposal numbers and the two phases

Every proposal carries a number, and no two proposers ever use the same
one. The usual trick is to give each proposer its own set of numbers:
with n servers, server i only uses numbers that leave remainder i when
divided by n.

The rule that makes Paxos safe is this: once a value is chosen, every
higher-numbered proposal must carry that same value. A proposer can't
see the future, so it asks the acceptors for a promise first. That
gives two phases.

**Phase 1, prepare.** The proposer picks a number n and sends
`prepare(n)` to the acceptors. An acceptor that hasn't already answered
a higher prepare replies with a promise: it won't accept anything
numbered below n. The promise also carries the highest-numbered
proposal this acceptor has already accepted, if any.

**Phase 2, accept.** If a majority promised, the proposer sends
`accept(n, v)`. It doesn't get to pick v freely. It must use the value
of the highest-numbered proposal reported in the promises. Only if no
acceptor reported anything may it use its own value. An acceptor
accepts unless it has promised a higher number in the meantime.

![Sequence diagram with proposers P and Q and acceptors A1, A2, A3. P sends prepare(1) to A1 and A2, both promise with nothing accepted, P sends accept(1, X) and both accept, so X is chosen by a majority. Later Q sends prepare(2) to A2 and A3. A2 promises but reports it already accepted (1, X); A3 reports nothing. Q must send accept(2, X), reusing X.](img/paxos-two-proposers.svg)

*Two proposers, one outcome. Q meets A2, the acceptor its majority shares with P's, and is forced to reuse X.*

Walk through it. P gets X accepted by A1 and A2. That's two of three,
so X is chosen at that moment, even though A3 and P don't know it yet.
Then Q shows up with number 2 and hears back from A2 and A3. Any
majority Q can reach overlaps {A1, A2}, so at least one reply tells Q
about X. Q has to propose X. Its round succeeds, but it only repeats
the value already chosen.

Now change the timing. Suppose Q's `prepare(2)` reaches A2 before P's
`accept(1, X)` does. A2 has promised to ignore anything below 2, so it
refuses P's accept. P never gets a majority, X was never chosen, and
Q is free to propose its own value. Either way, only one value wins.

## What an acceptor has to remember

An acceptor's whole state is small: the number of the highest prepare
it answered, and the highest-numbered proposal it accepted. It must
keep both across a crash. So it writes its answer to stable storage
before sending it, which puts an [[fsync]] on the critical path of
every step.

A proposer keeps almost nothing. It can drop a proposal halfway through
without harm, as long as it never reuses a number, so it only has to
remember the highest number it has tried.

The storage assumption matters more than it looks. A replica whose disk
is wiped comes back with no memory of its promises and may break them.
Google's Chubby team handled this by having such a replica rejoin
without a vote, catching up until a full round that started after its
rebuild had finished.

## Two proposers can duel forever

Safety in Paxos never depends on timing. Progress does. P finishes
phase 1 with number 1. Q finishes phase 1 with number 2, so P's accepts
get refused. P retries with 3, which gets Q's accepts refused. This can
go on forever with nothing chosen.

That's not a flaw you can design away. [[flp-impossibility|FLP]]
shows no consensus algorithm can promise to finish in a fully
asynchronous system where even one process may crash. Paxos gets
around it in practice by letting a single distinguished proposer, the
leader, do all the proposing. Picking that leader needs timeouts or
randomness, which is [[failure-detection]]. If the election goes wrong
and two servers both act as leader, you're back to the duel: slow,
never wrong.

One way to calm the duel: a leader that sees a higher-numbered rival
watches it with pings instead of outbidding it, and only steps in when
the rival goes quiet. The wait grows with the rival's number, so
eventually one leader gets enough time to finish.

## Multi-Paxos: a whole log

A [[replicated-state-machine]] needs an ordered list of commands, not
one value. The simple approach is one Paxos instance per log slot:
instance i chooses command i. With a stable leader this becomes cheap,
and the result is usually called Multi-Paxos.

- **Phase 1 once, for everything.** Phase 1 doesn't depend on the
  value, so a new leader runs it for every slot it doesn't know yet,
  with one number, in one short message. Acceptors only have something
  to report for slots where they already accepted a value.
- **Then phase 2 only.** Each new command costs one round trip from the
  leader to a majority, and no other fault-tolerant agreement algorithm
  can do it in less.
- **Pipelining.** The leader can propose command 142 before 141 is
  chosen. If it crashes, the log can be left with holes.

A new leader has to deal with those holes before anything after them
can run:

![Two rows of log slots 133 to 141. Before: the new leader knows 133, 134, 138 and 139; slots 135, 136, 137, 140 and 141 are unknown. After running phase 1 for slot 135 and everything later: 135 and 140 get the values that acceptors reported, 136 and 137 are filled with no-ops, and 141 takes the next new client command.](img/paxos-log-gaps.svg)

*A new leader filling holes. Adapted from Leslie Lamport, "Paxos Made Simple", section 3 (2001).*

Phase 1 tells it which slots already have a value somewhere. For those
(135 and 140 here) it must re-propose that value. For the rest (136 and
137) nobody accepted anything, so it proposes a no-op that leaves the
state alone. Now 138 onward can run, and new commands go to 141 and up.

Disk cost adds up fast. If every message is logged before it's sent,
Google counted five forced writes per instance on the critical path.
With a stable leader that skips phase 1, it drops to one write per
instance on each replica, done in parallel. Packing several clients'
commands into one instance helps too, the same idea as
[[group-commit]].

Membership can change through the log itself. The set of servers is
part of the replicated state, changed with ordinary commands, so every
server agrees on which servers vote in each slot. (Raft's version is
[[raft-membership-changes]].)

## From paper to production

Chubby, Google's lock service and an early [[coordination-services|coordination service]], was
moved onto a Paxos log. A typical Chubby cell had five replicas. What
the paper left out, the team had to design:

- **Reads.** The leader's local copy can be stale if another leader was
  elected behind its back, and running Paxos for every read is
  expensive. Their fix was a leader [[leases|lease]]: while the lease
  holds, no other replica can get a value through, so the leader reads
  locally. The leader's lease timeout is shorter than the replicas', to
  allow for [[clock-skew|clock drift]]. More on this in
  [[linearizable-reads]].
- **Losing leadership mid-request.** A global epoch number changes
  whenever leadership changes, and every database operation is
  conditional on it. It's the same idea as a
  [[fencing-tokens|fencing token]].
- **A log that grows forever.** The application takes snapshots and the
  log before them is dropped, as in [[raft-snapshots]].
- **Membership.** Changing the set of replicas under Multi-Paxos, with
  disk corruption in the picture, wasn't spelled out anywhere, and they
  had to fill in the details themselves.
- **Testing.** A seeded, single-threaded simulation injected random
  failures, so any failing run could be replayed exactly. Run across
  hundreds of machines, it found bugs that took weeks of simulated time
  to show up. That's [[deterministic-simulation-testing]].

A page of pseudo-code became several thousand lines of C++, and in the
team's own words, the system rested on an unproven protocol.

## Where it gets tricky

**"Paxos" is a family, not one algorithm.** The papers describe
single-decree Paxos carefully and Multi-Paxos in a few paragraphs.
There's no single agreed Multi-Paxos, so implementations fill the gaps
differently. When the Raft paper came out in 2014, the algorithms
inside Chubby and Spanner still hadn't been published in detail.

**Is it hard?** Lamport's 2001 paper calls it among the simplest
distributed algorithms. The Raft authors call it exceptionally
difficult; in their study, 33 of 43 students scored better on Raft
than on Paxos after learning both. Howard and Mortier (2020) then wrote
Multi-Paxos in Raft's vocabulary and found the two about equally hard
to understand. They put most of Raft's edge down to its presentation.

**Paxos and Raft differ only in leader election.** Written side by
side, the steady state is the same: a leader appends, a majority
acknowledges, the entry commits. The differences:

- **Terms.** Paxos gives each server its own numbers (term mod n = server
  id). Raft lets anyone run in any term, and each server votes once per
  term, so votes can split.
- **Who can win.** Paxos lets any server become leader, then catches it
  up with entries the voters send back. Raft only elects a server whose
  log is already up to date, so votes carry no entries and elections
  are lighter.
- **Old entries.** A new Paxos leader re-stamps uncommitted entries
  with its own term. Raft keeps each entry's original term, and won't
  count an old entry as committed until an entry from the current term
  is.

The words differ too: ballot, proposal number and view all mean term;
prepare and promise are Raft's RequestVote, and accept is
AppendEntries. See [[raft-elections]].

**Majorities aren't needed in both phases.** Flexible Paxos (2016)
showed that only phase 1 quorums have to overlap phase 2 quorums, which
lets you trade a cheaper common case for costlier leader changes. See
[[flexible-quorums]].

**Fault tolerance hides mistakes.** One Chubby cell started with a
replica's name misspelled. It ran fine on the other four, tolerating
one failure instead of two, and nothing looked wrong.

## What this means when you build

- Don't write your own Paxos for production. Use a coordination service
  or a database whose replication has years of testing behind it.
- Size the group for crashes you need to survive: 2f + 1 acceptors
  tolerate f, so five survive two.
- Every promise and accept has to be on disk before the reply. Expect an
  fsync per round and batch to pay for it.
- A leader's reads aren't safe by default. They need a lease (and sane
  clocks) or a round of the protocol.
- A bad election costs progress, not correctness, inside the log.
  Anything the leader does outside the log still needs fencing.
- Test with seeded fault-injection runs you can replay.

## Further reading

- [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf), Leslie Lamport, 2001. The algorithm derived step by step from what consensus must guarantee, and the log-with-a-leader version in section 3.
- [Paxos Made Live: An Engineering Perspective](https://research.google.com/archive/paxos_made_live.pdf), Tushar Chandra, Robert Griesemer, Joshua Redstone (Google), 2007. Everything the paper leaves out: disk cost, leases, epochs, snapshots, testing and real outages.
- [Paxos Made Moderately Complex](https://www.cs.cornell.edu/courses/cs7412/2011sp/paxos.pdf), Robbert van Renesse and Deniz Altinbuken, 2015. Full Multi-Paxos with pseudocode, and how to keep leaders from duelling.
- [In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf), Diego Ongaro and John Ousterhout, 2014. The Raft paper; section 3 is the case against Paxos.
- [Paxos vs Raft: Have we reached consensus on distributed consensus?](https://arxiv.org/abs/2004.05074), Heidi Howard and Richard Mortier, 2020. Paxos rewritten in Raft's terms, and exactly where the two differ.
- [Flexible Paxos: Quorum intersection revisited](https://arxiv.org/abs/1608.06696), Heidi Howard, Dahlia Malkhi, Alexander Spiegelman, 2016. Why the two phases can use different quorum sizes.

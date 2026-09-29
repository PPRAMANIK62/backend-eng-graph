---
id: flp-impossibility
title: FLP impossibility
depth: short
phase: 12
note: >-
  No algorithm can guarantee consensus in a fully asynchronous system
  with even one crash.
needs: [consensus, failure-models]
leads_to: [failure-detection, paxos]
compare_with: []
---

# FLP impossibility

In a fully [[failure-models|asynchronous]] system, no deterministic algorithm can
guarantee that nodes will reach [[consensus]] if even one of them might
crash. That's the FLP result, named after Fischer, Lynch and Paterson,
who published the proof in 1985. It doesn't mean consensus can't be done. It
means every real consensus system has to lean on timing or randomness
to make progress, and that it can always, in principle, get stuck.

## What the model takes away

FLP picks a world that is generous in every way but one:

- **The network is perfect.** Every message is delivered, correctly
  and exactly once. It can just take any amount of time, and arrive
  in any order.
- **Only one node may fail**, by stopping, and it doesn't announce it.
- **No clocks.** Nobody knows how fast other nodes run or how long
  messages take, so there's no such thing as a timeout.
- **No way to detect death.** A node can't tell whether another node
  has stopped or is just very slow.

The problem is also as easy as it gets. Each node starts with 0 or 1,
the nodes must agree on one of them, and only *some* node has to
decide for the run to count as success. Even that can't be guaranteed.

## The idea of the proof

Call a state of the whole system *bivalent* if both outcomes, 0 and 1,
can still happen from there, and *univalent* if only one can. Any run
that decides must, at some step, go from bivalent to univalent. That
step is the moment the decision is really made.

The proof has two parts.

1. **Some starting state is undecided.** Line up the possible starting
   states so that neighbours differ in one node's input. Somewhere
   along the line the outcome has to flip from 0 to 1. At that point
   two starting states differ only in the input of one node, and that
   node might be the one that crashes. The others can't tell which
   state they started in, so at least one of the two must still be
   open.
2. **An undecided state can be kept undecided.** From any bivalent
   state, take the next message that's due. It can always be delayed
   a bit, and some other messages delivered first, so that the system
   lands in another bivalent state. Repeat forever. Every node keeps
   taking steps and every message is eventually delivered, so it's a
   fair run with no crash at all, and it never decides.

The key is part 2's delay. The algorithm can't wait for the node whose
message would settle things, because that node might have crashed. It
can't safely go ahead without it either, because that node might just
be slow. With no clock, there's no point at which waiting becomes
"long enough".

The paper's own motivating example was committing a database
transaction across machines, the job [[two-phase-commit]] does. The
commit protocols of the day all seemed to have a "window of
vulnerability", a stretch where one slow or unreachable node could make
everyone wait indefinitely. FLP shows every such protocol must have
one.

## What it doesn't say

FLP is about *guaranteed termination* in a model with no timing at
all. It doesn't say consensus is impossible in practice, and the
authors say so themselves. Change the model a little and consensus
works:

- **If no node actually dies during the run** and a majority is alive
  at the start, the paper itself gives an algorithm that decides.
- **Randomness.** A randomized algorithm can terminate with
  probability 1.
- **Timing, eventually.** In a *partially synchronous* system, delays
  are unbounded for a while but eventually behave. Timeouts then mean
  something, and consensus can be solved with a majority of working
  nodes.

Real systems like [[raft]] and [[paxos]] take the third way. They use
clocks only for [[failure-detection|timeouts that suspect a failed
leader]], and they keep their safety rules no matter what the timing
does. FLP still applies to them: in a bad enough stretch of network
behaviour, they may make no progress. What they never do is decide two different things.

## What this means when you build

- Expect any consensus-based system, such as a Raft cluster, to
  stall, not break, during long network trouble. Alert on "no leader"
  and "no commits", not just on errors.
- Timeouts in these systems are a liveness tool. Tuning them changes
  how fast you recover, never whether the data is correct.
- If a design claims to always reach agreement quickly, whatever the
  network does, look for the timing assumption it's hiding.

## Further reading

- [Impossibility of Distributed Consensus with One Faulty Process](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf), Michael Fischer, Nancy Lynch and Michael Paterson, 1985. The original paper: the model, the bivalence proof, and the conclusion that it points to better models rather than giving up.
- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Section 6.1: FLP in context, and how Paxos and Raft get around it with partial synchrony and timeouts.

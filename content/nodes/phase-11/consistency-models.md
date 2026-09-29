---
id: consistency-models
title: Consistency models
depth: deep
phase: 11
note: >-
  The ladder from eventual to linearizable: what each lets a reader see.
needs: [replication]
leads_to: [eventual-consistency, causal-consistency, linearizability, zanzibar]
compare_with: [isolation-levels, session-guarantees]
---

# Consistency models

Once data lives on more than one machine, a read can land on a copy that
hasn't heard about the latest write. A consistency model is the contract
that says which values a read is allowed to return, given the writes that
came before it or ran alongside it. It's the difference between "you
might see an old value" and "you might see a value that never existed",
and you need to know which one your database promises before you write
code on top of it.

## One score, six answers

Take a baseball game whose score is kept in a [[replication|replicated]]
key-value store, with one key per team. The scorekeeper is the only
writer. So far the writes have gone, in order: home 1, visitors 1,
home 2, home 3, visitors 2, home 4, home 5. The real score right now is
visitors 2, home 5. Some replicas are behind, and an eventually
consistent replica may have received any subset of the writes.

Ask for the score under different guarantees and you get different sets
of possible answers:

| Guarantee | What a read may see | Possible scores |
|---|---|---|
| Strong | every write so far | 2-5 only |
| Eventual | any subset of the writes | any of 18 combinations, from 0-0 to 2-5 |
| Consistent prefix | the writes in order, up to some point | 0-0, 0-1, 1-1, 1-2, 1-3, 2-3, 2-4, 2-5 |
| Bounded staleness | everything older than a bound | with a one-inning bound: 2-3, 2-4, 2-5 |
| Monotonic reads | never older than your last read | after reading 1-3: 1-3, 1-4, 1-5, 2-3, 2-4, 2-5 |
| Read your writes | at least your own writes | the scorekeeper sees 2-5; anyone else, any of the 18 |

Look at the eventual row. It includes 1-0, a score where the visitors
lead, which never happened in this game. The replica that answered had
seen the visitors' first run but not the home team's earlier one. Consistent prefix
rules that out: you might see an old score, but always one that really
existed at some point.

The guarantees in the middle rows are not stacked on top of each other.
None of consistent prefix, bounded staleness, monotonic reads and read
your writes is stronger than the rest, and some readers need two. A
radio reporter who reads the score every 30 minutes wants consistent
prefix, so he never announces a fake score, and monotonic reads, so he
never announces 2-5 and then 1-3 half an hour later. Neither guarantee
alone prevents both mistakes.

That's the whole topic in small: "consistency" is a choice of which
histories you're willing to let readers see.

## A model is a set of allowed histories

To compare models you need a precise picture of what happened. The
usual one:

- A **process** is a single-threaded client. It does one operation at a
  time.
- Each **operation** (a read, a write, a compare-and-set) has an
  **invocation**, when the client sends it, and a **completion**, when
  the answer comes back. Both are measured on an imaginary perfect clock
  that nobody actually has.
- Two operations are **concurrent** if their time windows overlap.
- A **history** is the list of all operations, with their windows and
  results.

A consistency model is then just a set of histories: the ones it allows.
"The system is linearizable" means every history it can produce is in
the linearizable set. A model is **stronger** than another when its set
is smaller, a subset of the other's. Fewer allowed histories means fewer
surprises for you and more work for the database.

An operation that never completes, because it timed out or the client
crashed, is awkward. It might have taken effect or not, so it has to be
treated as concurrent with everything after it started. This matters
later, when you check histories by machine.

## The ladder for single objects

For operations on single objects (a key, a register), the common models
line up in a chain of "implies":

![A chain of consistency models from strongest to weakest. Strict serializable implies linearizable, which implies sequential, which implies causal. Causal implies PRAM and writes follow reads. PRAM implies monotonic reads, monotonic writes and read your writes. Strict serializable, linearizable and sequential are marked unavailable during a partition. Causal, PRAM and read your writes are sticky available, meaning a client must stay on one server. Monotonic reads, monotonic writes and writes follow reads are totally available.](img/consistency-models-ladder.svg)

*The single-object side of the map, with how available each model can be on an asynchronous network. Adapted from Jepsen, "Consistency Models", which adapts Bailis et al. and Viotti and Vukolić.*

From the top down:

- **[[linearizability|Linearizable]].** The system acts like one copy.
  Every operation takes effect at a single instant between its
  invocation and its completion. If a write finished before your read
  started, you see it or something newer.
- **Sequential.** All processes see operations in one total order, and
  that order keeps each process's own operations in the order it issued
  them. There's no real-time rule, so a process can be far behind the
  others and read old state. But once it has seen an operation, it never
  goes back to a state before it.
- **[[causal-consistency|Causal]].** Only operations that are related by
  cause have to appear in the same order everywhere. A reply is never
  visible before the message it replies to. Two writes that didn't know
  about each other can show up in different orders on different
  replicas.
- **Session guarantees.** Weaker still, and about one client's own
  view: **read your writes** (you see your own updates), **monotonic
  reads** (you never see time go backwards), **monotonic writes** (your
  writes are applied in the order you made them), and **writes follow
  reads** (a write you make after reading a value is ordered after the
  write that produced it). PRAM implies the first three.
- **[[eventual-consistency|Eventual]].** At the bottom, and not on the
  chart because it isn't a safety rule at all: stop writing, and the
  copies will eventually agree.

Above linearizable sits **[[strict-serializability|strict serializable]]**, where the "object" is
a whole [[transaction]] over many keys. That's where this chain meets the
transaction side of the map, the [[isolation-levels]].
[[serializability|Serializable]]
on its own has no real-time rule, which is why it isn't on this chain.

## What the stronger rungs cost

Each rung you climb rules out more histories, and ruling out histories
takes coordination: replicas have to talk before they answer. That
shows up in two places.

**Availability.** On a network that can partition, the models fall into
three groups. Linearizable, sequential and anything stronger can't be
totally available: during a [[network-partitions|partition]], some
nodes have to stop answering. Causal, PRAM and read your writes can
survive a partition, but only for clients that stick to one server
(sticky availability). Monotonic reads, monotonic writes and writes
follow reads can be served by any node at any time. The top group's
limit is what the [[cap-theorem]] proves for linearizability.

**Latency.** Even with no partition, stronger models make you wait on
the network. A linearizable read or write can't finish faster than a
time proportional to the network delay between replicas. Sequential
consistency lets you make either reads or writes fast, but not both.
Causal consistency is the strongest model where both can finish without
waiting for other replicas at all. When the network slows down, the
first kind of operation slows down with it, and the second doesn't.

That's the practical reason weak models exist. They let a replica
answer from what it has when the others are far away or cut off.

## Where it gets tricky

**"Strong consistency" names no particular model.** Informal
definitions say "you see the latest write" without saying what "latest"
means when operations overlap. Ask which model, for which
operations, under which faults.

**The same word means different things.** The C in [[acid|ACID]] is
about a finished transaction leaving the database in a valid state. It
has nothing to do with which replica you read. The C in CAP is
linearizability.

**Not every pair of models can be ranked.** The middle rows of the
baseball table don't contain each other. On the transaction
side, [[snapshot-isolation|snapshot isolation]] and repeatable read each allow something the
other forbids.

**Names and hierarchies vary.** "Read my writes" and "read your writes"
are the same guarantee. Some writers file causal and the [[session-guarantees|session
guarantees]] as variations of eventual consistency; the map above puts
causal well above them. Even the map has been disputed: under some
definitions of causality, causal isn't stronger than PRAM. When it
matters, go back to the definition, not the label.

**Session guarantees depend on stickiness.** Read your writes and
monotonic reads are easy when a client always talks to the same server.
Lose that server, or let a load balancer spread requests, and they get
much harder to keep. One fix is for the client to track versions itself
and throw away replies older than what it last saw.

## What this means when you build

- **Choose per operation, not per database.** In the baseball game the
  umpire deciding whether the game is over needs strong reads, the
  scorekeeper gets the same effect from read your writes because he's
  the only writer, and a fan checking season stats is fine with
  eventual. Some stores let you pick per request, for example a
  consistent read or a cheaper, possibly stale one.
- **Write down what you rely on.** "After a user saves their profile,
  their next page load shows it" is read your writes. "A comment never
  appears before the post" is causal. Name the model, then check the
  store gives it.
- **Mix stores deliberately.** Put bulk data in a weakly consistent
  store and the small pointer that says which version is current in a
  linearizable one.
- **Test the claim.** A model is a set of histories, so you can record
  histories and check them. That's [[linearizability-checking]] for
  single objects and [[history-checking]] for transactions.

## Further reading

- [Consistency Models](https://jepsen.io/consistency/models), Jepsen. The map of models, the vocabulary of histories, and which models can stay available.
- [Sequential Consistency](https://jepsen.io/consistency/models/sequential), Jepsen. One order for everyone without a real-time bound, and why a process can lag.
- [Writes Follow Reads](https://jepsen.io/consistency/models/writes-follow-reads), Jepsen. The session guarantee the other sources skip.
- [Replicated Data Consistency Explained Through Baseball](https://www.microsoft.com/en-us/research/wp-content/uploads/2011/10/ConsistencyAndBaseballReport.pdf), Doug Terry, Microsoft Research, 2011. The baseball example, six read guarantees, and which reader needs which.
- [Eventually Consistent - Revisited](https://www.allthingsdistributed.com/2008/12/eventually_consistent.html), Werner Vogels, 2008. The client-side models, sessions and stickiness, from Amazon's side.
- [Strong consistency models](https://aphyr.com/posts/313-strong-consistency-models), Kyle Kingsbury, 2014. Builds the strong models up from a single register, and argues for mixing models.
- [A Critique of the CAP Theorem](https://arxiv.org/pdf/1509.05393), Martin Kleppmann, 2015. Section 4: how operation latency must grow with network delay for linearizable, sequential and causal consistency.

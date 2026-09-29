---
id: cap-theorem
title: The CAP theorem
depth: deep
phase: 11
note: >-
  What it actually says about partitions, and why most people quote it
  wrong.
needs: [linearizability, network-partitions]
leads_to: [pacelc]
compare_with: []
---

# The CAP theorem

The CAP theorem says that when the network between your replicas breaks,
a replicated store has to choose: keep answering every request and risk
stale answers, or stay correct and stop answering on one side. It's
usually quoted as "consistency, availability, partition tolerance: pick
two", and that version is wrong in ways that lead to bad design
arguments. The real theorem is narrower, more precise, and more useful.

## Where it came from

Eric Brewer, then at UC Berkeley and Inktomi, put the idea forward in
the late 1990s, and presented it as a conjecture in his keynote at the
Principles of Distributed Computing conference (PODC) in 2000: a
shared-data system can have at most two of consistency, availability
and tolerance to network partitions. His point was to push designers to
consider the whole space between the strict databases of the time and
the looser, always-on web systems he was building.

In 2002 Seth Gilbert and Nancy Lynch proved a precise version, and that
proof is what "the CAP theorem" formally means.

## What the three letters actually mean

The proof uses narrow definitions, and the theorem only holds for them.

**C, consistency, means [[linearizability]].** Every operation appears to
take effect at a single instant, in one total order. In particular, a
read that starts after a write finished must return that write or a
later one. The object is a single read/write register. This is not the C
in [[acid|ACID]], which is about a [[transaction]] keeping the database's
rules.

**A, availability, means every request to a non-failing node gets a
response.** Not most requests, not "the service is up somewhere". Every
node that hasn't crashed must answer every request it receives. There
is no time limit: an answer after an hour still counts.

**P, partition tolerance, means the network may lose any number of
messages between nodes.** A [[network-partitions|partition]] is the
extreme case: every message from one group of nodes to another is lost.
The theorem asks whether you can keep C and A while that happens.

## The proof in one picture

Split the nodes into two groups, G1 and G2, and lose every message
between them.

![Client A writes x = 1 to a node in G1 and gets ok. The link between G1 and G2 is cut: every message lost. Client B then reads x from a node in G2, which still has x = 0. The node in G2 can either answer now with x = 0, which keeps it available but breaks linearizability because A's write finished first, or wait for G1 or return an error, which keeps it linearizable but means a working node gave no answer, so it's not available.](img/cap-theorem-partition.svg)

*The shape of the proof. Adapted from Seth Gilbert and Nancy Lynch, "Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services".*

1. A client writes a new value to a node in G1. Availability says the
   write must complete, so it does, without G2 hearing about it.
2. After that write has finished, another client reads from a node in
   G2. Availability says the read must return something.
3. G2 has received nothing from G1, so from its point of view nothing
   has changed. It returns the old value.
4. The read started after the write completed and didn't see it. That
   breaks linearizability.

That's the whole proof. Adding clocks doesn't help: the same argument
works when nodes have timers and messages have a known deadline, as
long as messages can be lost. A node can't tell a message that's lost
from one that's just late, so it can't safely assume "no news" means
"nothing happened".

## What it doesn't say

**It's not "pick two".** You don't choose to have partitions or not.
Networks drop and delay messages whether you like it or not, so
"CA" isn't a real option for a system that spans a network. The actual
choice appears only during a partition, and it's between C and A.

**It says nothing when the network is healthy.** Without a partition, a
system can be both linearizable and available. CAP forbids only a small
corner of the design space: perfect consistency and perfect
availability at the same moment during a partition.

**It covers one register and one kind of fault.** No multi-key
transactions, no crashed nodes, no full disks, no bugs. Other results
cover other models: sequential consistency, [[serializability]],
[[snapshot-isolation|snapshot isolation]] and anything stronger can't be totally available either.
[[causal-consistency|Causal consistency]] can survive a partition if clients stay on one
server.

**It says nothing about speed.** A CAP-available system may take as
long as it likes to answer. What users feel is latency, and even with
no partition, a linearizable operation has to wait for a time
proportional to the network delay between replicas. That trade-off,
consistency against latency when nothing is broken, is what
[[pacelc|PACELC]] adds.

**Most real systems are neither CP nor AP.** Take a database with one
leader and asynchronous followers. A client cut off from the leader
can't write, so it isn't CAP-available. A client reading from a follower
can get stale data, so it isn't linearizable either. ZooKeeper, often
called "CP", doesn't give [[linearizable-reads|linearizable reads]] by default, and has a
read-only mode that keeps answering reads on the minority side of a
partition. A Dynamo-style store is CAP-available with one-replica reads
and writes, and not with majority [[quorums]]. The label depends on the
operation and the settings.

## What the choice looks like in practice

In a running system the CAP decision happens at a timeout. A request is
waiting on another node that hasn't answered. You can give up (and lose
availability for this request) or go ahead without it (and risk
inconsistency). Retrying forever is choosing consistency.

So a partition, in practice, is any time the answer doesn't come back
within your deadline. Different nodes may disagree about whether there
is one, and a tight deadline will treat a merely slow network as a
partition.

Choosing linearizability doesn't have to mean an outage. If the side
that holds the majority, or the leader, keeps working and you can send
all clients there, users may see no downtime at all. The minority side
is "unavailable" only in CAP's strict sense.

Choosing availability means deciding up front what happens to your
invariants. Brewer's later advice: detect the partition, switch into an
explicit partition mode where some operations are limited or recorded
for later, and run a recovery step when the network heals to merge
state and compensate for mistakes. Some invariants can be broken and
repaired: allow duplicate keys during the partition and merge them
after. Others can't, like charging a credit card, so those operations
get queued until the partition ends.

## Where it gets tricky

**Brewer himself says "2 of 3" was misleading.** Twelve years after the
keynote he wrote that it oversimplified: partitions are rare, the
choice can differ per operation, per piece of data, even per user, and
all three properties are more continuous than on-off.

**People redefine the words and keep the name.** If "consistent" means
"eventually consistent" or "available" means "has an uptime SLA", the
theorem no longer applies, and neither does the CP/AP label. An uptime
SLA can be met by systems that are not CAP-available at all.

**Some argue CAP should be retired.** One critique is that its
definitions are ambiguous and the CP/AP buckets hide too much, and
proposes reasoning instead about whether each operation's latency has
to grow with network delay. That framing covers slow networks, not just
cut ones.

## What this means when you build

- **Decide per operation what happens at the timeout.** Refuse, wait,
  or answer from local state. Recording an order and charging a card
  can make different choices in the same system.
- **Don't describe a system as CP or AP.** Say which operations are
  linearizable, under which settings, and what each side of a partition
  can still do.
- **If you choose availability, list your invariants** and write the
  merge and compensation logic before you need it.
- **If you choose consistency, make the majority side easy to reach**,
  so "unavailable" in the theorem doesn't become an outage for users.

## Further reading

- [Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services](https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf), Seth Gilbert and Nancy Lynch, 2002. The definitions and the proof, including the partially synchronous case.
- [Towards Robust Distributed Systems](https://people.eecs.berkeley.edu/~brewer/cs262b-2004/PODC-keynote.pdf), Eric Brewer, PODC keynote slides, 2000. Where the conjecture was first put to that community, with example systems for each trade-off.
- [CAP Twelve Years Later: How the "Rules" Have Changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/), Eric Brewer, 2012. Why "2 of 3" misleads, the timeout view, and how to manage partitions.
- [Please stop calling databases CP or AP](https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html), Martin Kleppmann, 2015. Why single-leader databases, Dynamo-style stores and ZooKeeper don't fit either bucket.
- [A Critique of the CAP Theorem](https://arxiv.org/pdf/1509.05393), Martin Kleppmann, 2015. The ambiguities, and the delay-sensitivity alternative.
- [Strong consistency models](https://aphyr.com/posts/313-strong-consistency-models), Kyle Kingsbury, 2014. CAP's precise terms, and which other models also can't be totally available.

---
id: distributed-transactions
title: Distributed transactions
depth: deep
phase: 12
note: >-
  How Spanner and CockroachDB run transactions across shards: two-phase
  commit over Raft groups, with clocks to order them.
needs: [two-phase-commit, raft, hybrid-logical-clocks, partitioned-secondary-indexes, mvcc, clock-skew]
leads_to: [commit-wait]
compare_with: [sagas]
---

# Distributed transactions

A distributed transaction reads and writes data that lives on several
machines, and still commits or aborts as one. Databases like Google's
Spanner and CockroachDB give you this across many shards by
combining three pieces you've met separately: [[two-phase-commit]] for
the all-or-nothing, [[raft]] or Paxos so no single crash can lose a
vote, and clocks to put every transaction in an order. Knowing how
they fit explains what these databases cost and why they ask you to
retry.

## The setup: every shard is a replicated group

Both databases [[partitioning|split the data into ranges]] of keys.
Each range is stored on a few machines that run a consensus group: Paxos in Spanner, Raft in CockroachDB. One
replica leads, and every write goes through the group's log, so the
range behaves like one machine that doesn't lose data when a replica
dies. That's a [[replicated-state-machine]] per range.

A transaction that touches one range is the easy case. The range's
leader locks and writes, the write goes through consensus once, done.
Spanner notes that most of its transactions are like this and skip the
transaction machinery entirely. CockroachDB has a similar one-phase
fast path.

The hard case is a transaction that touches two ranges: a transfer
from Alice, whose row lives in range 1, to Bob, whose row lives in
range 2. Now two groups have to agree to commit or abort together.
That's atomic commit, and both databases use two-phase commit for it.

## Two-phase commit, but every participant is a group

Classic 2PC has one weak spot: if the coordinator crashes after
everyone voted yes, participants are stuck in doubt until it comes
back. The fix both databases use is simple to state. Every piece of 2PC
state, each participant's "prepared" and the coordinator's "committed",
is written through a consensus group instead of one machine's disk. If
a leader dies, another replica of the same group takes over with the
same state, and the protocol carries on. Blocking would now need a
majority of a group to be down, not one machine.

**In Spanner,** the leader of each range involved acts as a
participant. One of the groups is picked as the coordinator. Writes are
buffered at the client until commit, and then the client itself drives
2PC, which saves sending the data twice across wide-area links. Each
non-coordinator participant takes its write locks, picks a prepare
timestamp and logs a prepare record through Paxos. The coordinator
takes its own locks but skips preparing, picks the commit timestamp
once all the others have answered, and logs the commit through Paxos.
Isolation comes from [[two-phase-locking]], with reads in read-write
transactions using wound-wait to avoid [[deadlock|deadlocks]].

**In CockroachDB,** the same protocol looks different on disk:

- Each write becomes a **write intent**: a provisional value on the
  key that also acts as a lock, replicated through that range's Raft
  group like any other write.
- One **transaction record**, stored in the range of the first key
  written, holds the transaction's status: `PENDING`, `STAGING`,
  `COMMITTED` or `ABORTED`. Every intent points to it.

Writing the intents is the prepare phase. Flipping the record to
`COMMITTED` is the commit. After that, any reader that meets an intent
looks up the record to see whether to treat it as real, so cleaning up
the intents afterwards is only an optimization. The coordinator also
sends heartbeats to the record, so other transactions can tell a live
transaction from one whose coordinator died.

## Two rounds of consensus, then one

Running 2PC over consensus groups has a price. The commit record can't
be written until every intent has finished replicating, and writing the
record is itself another round of consensus. That's two consensus
round trips in a row before the client hears "committed". In a cluster
spread across regions, each round is a wide-area round trip.

CockroachDB saw this in a surprising place. Adding the first secondary
index to a table made inserts twice as slow, because the index lives
in other ranges: every insert became a cross-range transaction and
lost the one-phase fast path.

Its fix, Parallel Commits (CockroachDB 19.2), changes what "committed"
means. At commit time the coordinator writes the record in a new
`STAGING` state that lists every write the transaction made, at the
same time as the last intents are still replicating. The rule is now:
a transaction is committed if its record says `STAGING` and every
write it lists has been replicated. Everything replicates in parallel,
so the client gets its answer after one round of consensus instead of
two. The record is moved to `COMMITTED`, and the intents resolved, in
the background afterwards.

![Two timelines for a transaction that writes to two ranges. Before: both intent writes replicate in consensus round 1, then the transaction record is written as COMMITTED in consensus round 2, and only then is the client acknowledged. After, with Parallel Commits: the two intent writes and a STAGING record listing the writes replicate together in one consensus round, the client is acknowledged, and the record is marked COMMITTED and the intents resolved later in the background.](img/distributed-transactions-parallel-commits.svg)

*Commit latency before and after Parallel Commits, simplified. Adapted from Nathan VanBenschoten, "Parallel Commits", figures 1 and 2 (Cockroach Labs, 2019).*

The hard part is the unhappy path. If the coordinator dies while the
record says `STAGING`, the transaction is neither clearly committed nor
clearly aborted. Another transaction that runs into one of its intents
checks each listed write. If all are there, the transaction committed.
If one is missing, it makes sure that write can never succeed later,
and declares the transaction aborted. Heartbeats keep this rare: it
only runs when the coordinator has actually stopped. The team also
checked the protocol's atomicity and durability with a TLA+ model.

In their tests, commit latency with Parallel Commits grew at the same
rate as the network round-trip time, where before it grew at twice
that rate.

## Why clocks come into it

Committing atomically isn't the whole job. The database also has to
put transactions in an order everyone agrees on, and give readers a
consistent snapshot. Both databases use [[mvcc]]: every value is
stored with the timestamp of the transaction that wrote it, and a read
at time t sees the newest version at or before t.

That only works if timestamps respect real order: if T1 commits before
T2 starts, T1 must get the smaller timestamp. Spanner calls this
external consistency, which is [[linearizability]] for transactions.
Plain machine clocks can't promise it, because of [[clock-skew]]: a
node whose clock runs behind can give a later transaction an earlier
timestamp. [[lamport-clocks|Logical clocks]] don't fix it either when
the two transactions are linked only by a person who saw the first
result and then clicked something, since no timestamp travels with the
person.

The two databases handle this differently.

**Spanner waits.** Its TrueTime API returns an interval guaranteed to
contain the true time, backed by GPS and atomic clocks. The commit
timestamp is set at the latest end, and the write stays invisible until
that timestamp is certainly past: [[commit-wait]], about 5 ms in the
2012 paper. After it, any transaction that starts later, anywhere,
gets a larger timestamp.

**CockroachDB sometimes retries reads.** On ordinary NTP clocks,
waiting out the error on every write would be too slow. Instead each
transaction carries an **uncertainty interval**, its
[[hybrid-logical-clocks|hybrid logical clock]] timestamp up to that
plus the cluster's maximum clock offset. A read that finds a value
written inside the window can't tell which came first, so it moves its
timestamp past the value and retries, at most once per node. Spanner
always waits after writes; CockroachDB sometimes retries reads.

The trade is in the guarantee. Spanner gives linearizability.
CockroachDB promises [[serializability]], and only [[strict-serializability|strict ordering]] for
causally related transactions if clocks stay within the configured
offset. A node that finds its clock too far from the others shuts
itself down rather than break that.

## Where it gets tricky

**Clocks are part of correctness.** In both systems a clock that's more
wrong than the database believes breaks guarantees silently, not
loudly. Spanner evicts machines whose clocks drift faster than the
assumed bound; CockroachDB nodes kill themselves when their offset gets
too big. If CockroachDB's clock skew does exceed the bound, the docs
say serializable isolation still holds, but single-key linearizability
between causally dependent transactions can break. The anomaly has a
name, **causal reverse**: T2 started after T1 finished but appears
earlier in the history. It needs the two transactions to touch
disjoint keys and to be linked through something outside the database.

**Interactive transactions shape everything.** Some research designs,
like Calvin, get around this by requiring each transaction to declare
the rows it will write before it starts. A SQL client that decides its next
statement from the last result can't do that, which is why CockroachDB
kept the protocol described above.

**Participants add up.** Spanner's own test showed 2PC scaling
reasonably to 50 participants, with latency rising noticeably at 100.
More ranges in a transaction means more consensus groups to hear from
and more chances to wait on a slow one.

**You still have to retry.** CockroachDB runs at `SERIALIZABLE` by
default. When a transaction's timestamp has to move forward and its
earlier reads can't be revalidated, or when two transactions deadlock
on each other's intents and one is aborted, the client gets an error
and must run the whole transaction again. The database hides the
distribution; it doesn't hide contention.

**Cleanup isn't free.** Parallel Commits halves the time until the
client hears back. Resolving the intents still takes two rounds of
consensus in the background, so a transaction that writes many rows
leaves work behind that competes with the next one.

## What this means when you build

- Keep data that changes together close in the key space where you
  can, so more transactions stay inside one range. A single-range
  transaction skips 2PC altogether.
- Expect a cross-range write to cost at least one consensus round trip,
  and more if the replicas are far apart. Every [[partitioned-secondary-indexes|secondary index]] can
  turn a single-range write into a cross-range one.
- Write every transaction as a retry loop. Serializable distributed
  databases will abort some of them.
- Run clock synchronization on every node and alert on offset; in
  CockroachDB a bad clock takes the node down.
- Keep transactions short and touching few keys. Long ones hold intents
  and locks that everyone else runs into.

## Further reading

- [Spanner: Google's Globally-Distributed Database](https://static.googleusercontent.com/media/research.google.com/en//archive/spanner-osdi2012.pdf), Corbett et al., 2012. 2PC over Paxos groups, TrueTime, commit wait and their measured cost.
- [Distributed Systems lecture notes](https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf), Martin Kleppmann, University of Cambridge. Sections 7.1 and 8: atomic commit, and a clear walk through Spanner's timestamps and commit wait.
- [Parallel Commits](https://www.cockroachlabs.com/blog/parallel-commits/), Nathan VanBenschoten, Cockroach Labs, 2019. Intents and transaction records as 2PC, why it cost two consensus rounds, and the STAGING protocol that cut it to one.
- [Transaction Layer](https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer), Cockroach Labs, v26.3 docs. Write intents, transaction records, HLC timestamps, uncertainty and the max clock offset rule.
- [Living without atomic clocks](https://www.cockroachlabs.com/blog/living-without-atomic-clocks/), Spencer Kimball and Irfan Sharif, Cockroach Labs, 2022. How CockroachDB's uncertainty intervals differ from Spanner's commit wait, and causal reverse.

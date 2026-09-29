---
id: cockroach-parallel-commits-2019
title: "Parallel Commits: An atomic commit protocol for globally distributed transactions"
author: Nathan VanBenschoten (Cockroach Labs)
url: https://www.cockroachlabs.com/blog/parallel-commits/
kind: blog
primary: true
---

## Summary

Cockroach Labs' engineering post (2019, for CockroachDB 19.2) on how a
transaction commits across ranges: write intents plus a transaction
record, why that is two-phase commit run over Raft groups, why it costs
two rounds of consensus, and how Parallel Commits (a STAGING state that
lists the in-flight writes) cuts it to one. Also covers the recovery
procedure when the coordinator dies, and the TLA+ check.

## Key claims

- Intents plus a transaction record is a form of 2PC. "the process of writing intents is analogous to the “prepare” phase of 2PC and the process of marking the transaction record as committed is analogous to the “commit” phase of 2PC." (The problem with two-phase commit)
- Why 2PC blocks. "If the transaction coordinator were to crash, then it would be impossible for others to know the final outcome of the transaction." (The problem with two-phase commit)
- Their fix for blocking: replicate the transaction state with consensus. "systems like CockroachDB run 2PC on top of a consensus protocol, ensuring that transaction state is just as highly available and resilient to failure as the rest of the system." (The problem with two-phase commit)
- The cost: two sequential rounds of consensus. "the major downside to this strategy, when run in a partitioned-consensus system like CockroachDB, is that it requires two sequential rounds of consensus writes." (The problem with two-phase commit)
- Commit is a flip of one record that every intent points to. "a transaction commit simply flips a bit on its transaction record to mark the transaction as committed." (Atomicity in CockroachDB)
- Atomicity is about visibility. "it’s fundamentally a game of managing “visibility” of the transaction’s operations such that all of a transaction’s operations appear to be committed (or rolled back) instantaneously to all observers." (What is transaction atomicity?)
- Intents are cleaned up after the client is told, as an optimization. "Like hint bits in PostgreSQL, this is a performance optimization and not strictly necessary for atomicity." (Atomicity in CockroachDB)
- Interactive SQL rules out declaring the write set up front. "requiring transactions to pre-declare which rows they intend to write to ahead of time is a common theme in various attempts to solve this problem." (Parallel Commits)
- The new commit condition. "A transaction is considered committed if its record is in this state and an observer can prove that all of the writes listed in its transaction record have successfully achieved consensus." (Changing the commit condition)
- Status recovery: find a missing intent and block it, or find all of them. "If any intents are missing, we use an in-memory data structure in CockroachDB called the “timestamp cache” to prevent the missing write from ever succeeding in the future. We then consider the transaction ABORTED." (Status recovery procedure)
- Recovery runs only when the coordinator has died, because coordinators heartbeat their record. "in practice the transaction status recovery procedure is only ever run in cases where the transaction coordinator dies." (Status recovery procedure)
- Result: cross-range commits in half the time. "CockroachDB is now able to commit cross-range transactions in half the time it previously was able to." (Benchmark results)
- Before it, adding the first secondary index doubled insert latency, because the insert became a cross-range transaction. "This had the effect of doubling the latency of transactions once the first secondary index was added to a table." (Benchmark results)
- Latency slope vs round-trip time. "Without Parallel Commits, we see the client-perceived latency of the transaction grow at twice the rate that the round trip time (RTT) grows. With Parallel Commits, we see the latency grow at exactly the same rate as the RTT." (Benchmark results)
- A cross-range transaction loses the one-phase fast path. "This transition forced CockroachDB to fall back from its “one-phase commit” fast-path to the standard two-phase commit protocol." (Benchmark results)
- Shipped on by default in 19.2. "The new atomic commit protocol is enabled by default in CockroachDB v19.2" (Conclusion)
- Calvin is their example of designs that need the write set up front. "more exotic approaches like Thomson et al.’s Calvin: Fast Distributed Transactions for Partitioned Database Systems" (Parallel Commits)
- Verified with TLA+. "we developed a formal specification of Parallel Commits with an associated model that asserted the atomicity and durability properties we expected from the new commit protocol." (Verification)

## Visuals worth redrawing

- Figures 1 and 2: the transaction timeline without and with Parallel
  Commits (intent writes, then the record write, then async intent
  resolution). The node's figure is redrawn from these.

## My notes

- The TPC-C experiment used three VMs and tc to set inter-node latency;
  the post gives slopes, not absolute numbers in text.

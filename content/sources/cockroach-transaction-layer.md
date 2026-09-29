---
id: cockroach-transaction-layer
title: Transaction Layer (CockroachDB architecture docs)
author: Cockroach Labs
url: https://www.cockroachlabs.com/docs/stable/architecture/transaction-layer
kind: docs
primary: true
---

## Summary

CockroachDB's architecture page for its transaction layer (v26.3 docs
when read). It explains how every transaction timestamp is a hybrid
logical clock value, how nodes pass HLC timestamps on every request,
and what happens when a node's clock drifts past the configured
maximum offset.

## Key claims

- CockroachDB uses HLC timestamps. "CockroachDB implements hybrid-logical clocks (HLC) which are composed of a physical component (always close to local wall time) and a logical component (used to distinguish between events with the same physical component)." (Time and hybrid logical clocks)
- HLC time is never behind the wall clock. "This means that HLC time is always greater than or equal to the wall time." (Time and hybrid logical clocks)
- Every transaction timestamp is an HLC value. "Whenever a transaction’s timestamp is mentioned, it’s an HLC value." (Time and hybrid logical clocks)
- Receivers fold the sender's timestamp into their own HLC. "When nodes receive requests, they inform their local HLC of the timestamp supplied with the event by the sender." (Time and hybrid logical clocks)
- It still needs synchronized clocks. "CockroachDB requires moderate levels of clock synchronization to preserve data consistency." (Max clock offset enforcement)
- A node whose clock drifts too far kills itself. "it crashes immediately." (Max clock offset enforcement)
- Skew past the bound breaks linearizability for causally related transactions, not serializability. "skew outside the configured clock offset bounds can result in violations of single-key linearizability between causally dependent transactions." (Max clock offset enforcement)
- Reads use an uncertainty window set by the max offset. "if the write falls in the read’s uncertainty window (this is dictated by the maximum clock offset configured for the cluster)" (Non-blocking transactions)
- Write intents are a replicated provisional value plus lock. "They can be thought of as a combination of a replicated lock and a replicated provisional value." (Write intents)
- The transaction record lives in the range of the first write, with one of four states. "A transaction record stored in the range where the first write occurs, which includes the transaction’s current state (which is either PENDING, STAGING, COMMITTED, or ABORTED)." (Overview)
- Anyone who meets an intent checks the record, so cleanup is only an optimization. "any operation can resolve or remove write intents by checking the transaction record’s status." (Commits)
- The coordinator heartbeats the record; if it stops, the record is aborted. "If the TxnCoordSender’s heartbeating stops, the transaction record is moved to the ABORTED status." (TxnCoordSender)
- A deadlock between intents is broken by aborting one at random. "one of the transactions is randomly aborted." (Transaction conflicts)
- Parallel Commits halves commit latency. "Parallel Commits is an optimized atomic commit protocol that cuts the commit latency of a transaction in half, from two rounds of consensus down to one." (Parallel Commits)
- Resolving intents still takes two rounds. "two rounds of consensus are still required to resolve intents." (Parallel Commits)
- A read that meets a value in its uncertainty window pushes its timestamp. "This is handled by attempting to push the transaction’s timestamp beyond the uncertain value" (Transaction conflicts, read within uncertainty window)
- Ranges replicate through Raft; followers apply Raft commands. "piggybacking closed timestamps onto Raft commands such that the replication stream is synchronized with timestamp closing." (Closed timestamps)
- SERIALIZABLE is the default. "By default, CockroachDB executes all transactions at the strongest ANSI transaction isolation level: SERIALIZABLE, which permits no concurrency anomalies." (Isolation levels)
- A pushed SERIALIZABLE transaction must revalidate its reads; if that fails, it retries. "If the refreshing is unsuccessful (also known as read invalidation), then the transaction must be retried at the pushed timestamp." (Read refreshing)
- READ COMMITTED retries single statements; SERIALIZABLE needs whole-transaction retries, usually from the client. "Statement-level retries are automatically performed without involving the client, whereas transaction-level retries (as required with SERIALIZABLE isolation) usually require" client-side handling (Isolation levels; the last words are a link)
- The leaseholder can serve reads because the read's HLC time is above the value it reads. "the transaction reading the data is at an HLC time greater than the MVCC value it’s reading" (Time and hybrid logical clocks)

## Visuals worth redrawing

None.

## My notes

- The crash rule in full: a node crashes when its clock is out of sync
  with at least half the other nodes by 80% of the maximum offset
  allowed. The last words are a link in the page, so the quote above
  starts after it.
- The default maximum offset is on the cockroach start page (500 ms
  when read); that page has no note, so the number isn't used.

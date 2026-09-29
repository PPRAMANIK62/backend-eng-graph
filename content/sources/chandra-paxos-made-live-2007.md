---
id: chandra-paxos-made-live-2007
title: "Paxos Made Live: An Engineering Perspective"
author: Tushar Chandra, Robert Griesemer, Joshua Redstone
url: https://research.google.com/archive/paxos_made_live.pdf
kind: paper
primary: true
---

## Summary

Google's account of replacing the third-party replicated database under
Chubby (its lock service) with its own Paxos-based replicated log (PODC
2007). The paper is about the gap between the published algorithm and a
production system: disk corruption, leases for reads, epoch numbers,
membership, snapshots, testing, and the failures they hit in production.

## Key claims

- A typical Chubby cell has five replicas, one of them master. "A typical Chubby cell consists of five replicas, running the same code, each running on a dedicated machine." (2)
- One page of pseudo-code became several thousand lines of C++. "While Paxos can be described with a page of pseudo-code, our complete implementation contains several thousand lines of C++ code." (1)
- Paxos keeps working as long as a majority runs long enough without failures. "If eventually a majority of the replicas run for long enough without crashing and there are no failures, all running replicas are guaranteed to agree on one of the values that was submitted." (4.1)
- Paxos allows several coordinators at once; it orders them by sequence number and restricts each one's choice of value. "Paxos does not require that only one replica act as coordinator at a time." (4.1)
- Replicas can pick unique sequence numbers by id: replica r picks numbers s with s mod n = its id. (4.1, footnote 1)
- Naive Paxos puts five forced disk writes on the critical path. "the algorithm requires a sequence of five writes (for each of the propose, promise, accept, acknowledgment, and commit messages) to disk on its critical path." (4.2)
- With a stable master, propose messages can be skipped, leaving one disk write per instance on each replica. "With this optimization, the Paxos algorithm only requires a single write to disk per Paxos instance on each replica, executed in parallel with each other." (4.2)
- Values from many threads can be batched into one instance. "it is possible to batch a collection of values submitted by different application threads into a single Paxos instance." (4.2)
- A replica that loses its disk may break promises it made; it rejoins as a non-voting member until one full instance has passed. "When a replica’s disk is corrupted and it loses its persistent state, it may renege on promises it has made to other replicas in the past." (5.1)
- Reads from the master's local copy can be stale without a lease, because another master may have been elected. "read operations cannot be served out of the master’s copy of the data structure because it is possible that other replicas have elected another master and modified the data structure without notifying the old master." (5.2)
- Master leases let the master serve reads locally. "as long as the master has the lease, it is guaranteed that other replicas cannot successfully submit values to Paxos." (5.2)
- The master's lease timeout is shorter than the replicas', to allow for clock drift. "The master maintains a shorter timeout for the lease than the replicas – this protects the system against clock drift." (5.2)
- A disconnected old master can come back with a higher number and take over again, over and over; they fix it by periodically boosting the master's sequence number. "this behavior can degenerate into rapid master changes in a network with poor connectivity." (5.2)
- Epoch numbers detect that mastership was lost (or lost and regained) during a request, and all database operations are conditional on them. "all database operations are made conditional on the value of the epoch number." (5.3)
- Membership changes with Multi-Paxos aren't spelled out in the literature. "Unfortunately the literature does not spell this out, nor does it contain a proof of correctness for algorithms related to group membership changes using Paxos." (5.4)
- The log grows forever without snapshots; the application takes snapshots and the framework truncates the log. (5.5)
- Testing: a seeded, single-threaded random-failure simulation, later run on hundreds of machines; some bugs took weeks of simulated time to find. "We found additional bugs, some of which took weeks of simulated execution time (at extremely high failure rates) to find." (6.3)
- Fault tolerance can hide misconfiguration: a misspelled replica name left a five-replica cell tolerating one failure instead of two. "However in this configuration the system only tolerates one faulty replica instead of the expected two." (6.3)
- A Linux 2.4 kernel flush of a small file could hang for seconds behind other buffered writes. "it could take several seconds for the kernel to flush an unrelated small write to the Paxos log." (7)
- The gap between paper and system is large. "There are significant gaps between the description of the Paxos algorithm and the needs of a real-world system." (9)
- And the result rests on an unproven protocol. "the final system will be based on an unproven protocol." (9)
- The replicated state machine idea in one paragraph: the same log applied to the same starting database gives the same database everywhere. "if the log contains a sequence of database operations, and if the same sequence of operations is applied to the (local) database on each replica, eventually all replicas will end up with the same database content (provided that they all started with the same initial database state)." (1)
- Real systems face faults the algorithm doesn't model: bugs, operator error. "the real world exposes software to a wide variety of failure modes, including errors in the algorithm" (1)
- Runtime check: the master puts a checksum request in the log and every replica checksums its database at that point. "Since the Paxos log serializes all operations identically on all replicas, we expect all replicas to compute the same checksum." (6.2)
- They had three database inconsistency incidents: an operator error, a possible hardware memory corruption, and a suspected illegal memory access. "We have had three database inconsistency incidents thus far:" (6.2)
- Chubby is Google's lock service. "Chubby [1] is a fault-tolerant system at Google that provides a distributed locking mechanism and stores small files." (2)
- A replica with a lost disk stays non-voting until one full new instance completes. "It remains in this state until it observes one complete instance of Paxos that was started after the replica started rebuilding its state." (5.1)
- The failure test was run on several hundred machines. "we started running this test on a farm of several hundred Google machines at a time." (6.3)
- Same seed, same run, by running single-threaded. "We ensure that two test runs with the same random number seed are identical by running the test in a single thread" (6.3)

- Disk corruption does happen to them. "Replicas witness disk corruption from time to time." (5.1)
- The gaps between theory and practice are real work. "Our experience suggests that these gaps are non-trivial and that they merit attention by the research community." (9)
- Each replica snapshots on its own schedule. "Snapshots are not synchronized across replicas; each replica independently decides when to create a snapshot." (5.5)
- A snapshot records where it sits in the log via a snapshot handle holding the Paxos instance number and the membership. "In our system, it contains the Paxos instance number corresponding to the (log) snapshot and the group membership at that point." (5.5)
## Visuals worth redrawing

- Figure 1: one Chubby replica as three layers (Paxos log, replicated
  database, Chubby).

## My notes

- The throughput table (section 8) compares against 3DB on Pentium-class
  machines; too old and too specific to quote in an article.

---
id: vanrenesse-chain-replication-2004
title: Chain Replication for Supporting High Throughput and Availability
author: Robbert van Renesse, Fred B. Schneider
url: https://www.cs.cornell.edu/home/rvr/papers/OSDI04.pdf
kind: paper
primary: true
---

## Summary

The paper that introduced chain replication (OSDI 2004). The servers
holding an object form a line: updates enter at the head and flow down,
queries and all replies come from the tail. A separate master detects
failed servers and relinks the chain. Compared with primary/backup and
evaluated in simulation.

## Key claims

- Servers are assumed fail-stop: they halt on failure, and the halt can be detected. "each server halts in response to a failure rather than making erroneous state transitions, and" (3)
- With t servers, up to t−1 can fail without losing the object. "With an object replicated on t servers, as many as t−1 of the servers can fail without compromising the object’s availability." (3)
- The tail sends every reply. "The reply for every request is generated and sent by the tail." (3)
- Queries go to the tail and run there. "Each query request is directed to the tail of the chain and processed there atomically using the replica of objID stored at the tail." (3)
- Updates enter at the head and are forwarded down reliable FIFO links to the tail. "Each update request is directed to the head of the chain." (3)
- Strong consistency follows because the tail processes all queries and updates in one order. "Strong consistency thus follows because query requests and update requests are all processed serially at a single server (the tail)." (3)
- The head computes the new value once and forwards it, so updates can be non-deterministic. "the non-deterministic choice is made once, by the head." (3)
- A master detects failures, relinks neighbours and tells clients the new head and tail; the master itself is replicated with Paxos. "our prototype implementation of chain replication actually replicates a master process on multiple hosts, using Paxos [16] to coordinate those replicas" (3)
- Each server's update history is a prefix of its predecessor's (Update Propagation Invariant). "the sequence of updates received by each server is a prefix of those received by its successor." (3)
- Head failure: the next server becomes head. Tail failure: the previous server becomes tail. Middle failure: the predecessor re-sends what the successor may have missed, using a Sent list that the tail's acks trim. (3)
- New servers are added at the tail. "In practice, adding a server T + to the very end of a chain seems simplist." (3, sic)
- Chain replication is a form of primary/backup where the head orders updates and the tail orders queries among them. "The head sequences update requests; the tail extends that sequence by interleaving query requests." (4)
- Updates travel serially, so latency is the sum of hops, not the max. "with serial dissemination, it is proportional to the sum of those latencies." (4)
- Detecting a failure dominates recovery time, the same for both approaches. "The delay to detect a server failure is by far the dominant cost, and this cost is identical for both chain replication and the primary/backup approach." (4)
- Head failure: queries continue, updates are unavailable for 2 message delays. Tail failure: both unavailable for 2 message delays. Middle failure: no outage, updates delayed by 4 message delays. Primary failure in primary/backup: 5 message delays. (4)
- A "weak-chain" variant sending queries to any server gives up strong consistency. "Note, weak-chain and weak-p/b do not implement the strong consistency guarantees that chain and p/b do." (5.1)
- A primary must wait for backups' acks of earlier updates before answering a query; the tail never waits. "Compare that to the primary backup approach, where the primary, before responding to a query, must await acknowledgements from backups for prior updates." (4)
- Clients retry requests that get no reply, so a lost request is just a retry. "a client re-issues a request if too much time has elapsed without receiving a reply." (2)
- A new tail is filled by the current tail forwarding its copy, then takes over the tail role. "having the chain’s current tail T forward the object replica Hist TobjID it stores to T +" (3)

## Visuals worth redrawing

- Figure 2: a chain, updates in at the head, queries and replies at the
  tail.
- Figure 3: the four messages for removing a middle server.

## My notes

- The simulation numbers (1 ms links, 5 ms and 50 ms service times) are
  assumed, not measured; not worth quoting.

---
id: howard-flexible-paxos-2016
title: "Flexible Paxos: Quorum intersection revisited"
author: Heidi Howard, Dahlia Malkhi, Alexander Spiegelman
url: https://arxiv.org/abs/1608.06696
kind: paper
primary: true
---

## Summary

Shows that Paxos only needs every phase 1 quorum to overlap every phase
2 quorum. Two phase 2 quorums don't need to overlap each other, so
replication can use smaller quorums if leader changes use bigger ones
(arXiv v1, 2016). Includes a TLA+ spec that was model-checked.

## Key claims

- Majorities in both phases are more than Paxos needs. "Majority quorums are not necessary as intersection is required only across phases." (abstract)
- The observation stated plainly. "We observe that it is only necessary for phase 1 quorums (Q1 ) and phase 2 quorums (Q2 ) to intersect." (3)
- Example: ten nodes, three for replication, eight for a leader change. "in a system of 10 nodes, we can safely allow only 3 nodes to participate in replication, provided that we require 8 nodes to participate when recovering from leader failure." (1)
- The price is availability during leader changes. "The price we pay for this is reduced availability as the system can tolerate fewer failures whilst recovering from leader failure." (1)
- Replication (phase 2) happens far more often than leader election (phase 1) in Multi-Paxos. "the second phase of Paxos (replication) is far more frequent than the first phase (leader election) in Multi-Paxos." (3)
- In Multi-Paxos, phase 1 is independent of the value and can be done once for many slots. "The first phase of Paxos is independent of the value proposed for any given instance, therefore phase 1 can be executed prior to knowledge of which value to propose." (2)
- Classic Paxos progresses while a majority is up: floor(n/2)+1 acceptors. (2)
- More replicas mean higher latency and lower throughput in their LibPaxos3 runs. "As we would expect, increasing the number of replicas will increase latency and decrease throughput." (2, figure 1)
- With an even number of acceptors, phase 2 quorum can drop by one with the same phase 1 quorum, and fault tolerance improves. "we can safely reduce the size of Q2 by one from n/2 + 1 to n/2 and keep Q1 the same." (4.1)
- Two phase 2 quorums (and two phase 1 quorums) don't need to overlap. "There is no need to require that Q1 's intersect with each other nor Q2 's intersect with each other." (3)
- Smaller replication quorums help latency and throughput. "The simple quorum system reduces latency, as leaders will no longer be required to wait for a majority of participants to accept proposals." (1)
- And spread load. "it improves steady state throughput as disjoint sets of participants can now accept proposals, enabling better utilization of participants and decreased network load." (1)
- Grid quorums. "Grid quorum schemes arrange the N nodes into a matrix of N1 columns by N2 rows, where N1 × N2 = N and quorums are composed of rows and columns." (4.3)
- With FPaxos, one row for phase 1 and one column for phase 2 is enough. "In FPaxos, we can safely reduce our quorums to one row of size N1 for Q1 and one column of size N2 for Q2" (4.3)
- Failures aren't independent, so spread acceptors. "In practice, failures are not independent and so we can distribute acceptors across the machines, racks or even data centers to minimize the likelihood of simultaneous failure." (4.3)

## Visuals worth redrawing

- Figure 2: four acceptors with Q1 of 3 and Q2 of 2, two proposers.

## My notes

- Flexible Paxos is an idea, not a named product; it shows up in later
  systems' quorum choices. Not checked here which ones.

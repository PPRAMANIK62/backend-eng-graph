---
id: alquraan-network-partitions-2018
title: An Analysis of Network-Partitioning Failures in Cloud Systems
author: Ahmed Alquraan, Hatem Takruri, Mohammed Alfatafta and Samer Al-Kiswany (University of Waterloo)
url: https://www.usenix.org/system/files/osdi18-alquraan.pdf
kind: paper
primary: true
---

## Summary

An OSDI 2018 study of 136 real failures caused by network partitions in 25
widely used distributed systems (MongoDB, Elasticsearch, Redis, HDFS, Kafka,
RethinkDB and others). Most failures were catastrophic and silent, easy to
trigger, and reproducible on three to five nodes. It names three kinds of
partition (complete, partial, simplex) and introduces NEAT, a test framework
that injects them, which found 32 new failures in seven systems.

## Key claims

- Scope. "We present a comprehensive study of 136 system failures attributed to network-partitioning faults from 25 widely used distributed systems." (Abstract)
- Fault vs failure. "A fault is the initial root cause, including machine and network problems and software bugs. If not properly handled a fault may lead to a user-visible system failure." (footnote 1)
- Three partition types. Complete: two disconnected groups. Partial: two groups can't talk but a third reaches both. Simplex: traffic flows one way only. "Partial partitions isolate a set of nodes from some, but not all, nodes in the cluster, leading to a confusing system state in which the nodes disagree whether a server is up or down." (1)
- Simplex partitions are rarest; example: a NIC dropped inbound packets while outbound heartbeats kept the failover server from taking over. "This is the least common failure and can be caused by inconsistent forwarding rules or hardware failures" (2.1)
- Causes of complete partitions in datacenters: core, aggregation or top-of-rack switch failures, NIC failures, correlated failures during upgrades. "Microsoft and Google report that ToR failures are common and have led to 40 network partitions in two years at Google [21] and caused 70% of the downtime at Microsoft [22]." (2.1)
- Complete partitions also happen between data centers, and partial ones when two data centers lose their link but both reach a third. "Partial partitions are caused by a loss of connectivity between two data centers [23] while both are reachable by a third center" (2.1)
- A NIC failure can isolate a single node. "NIC failures [46] or bugs in the networking stack can lead to the isolation of a single node" (2.1)
- Finding 1: 80% of failures catastrophic, data loss most common (27%). "A large percentage (80%) of the studied failures have a catastrophic impact, with data loss being the most common (27%)" (4)
- Finding 2: 90% silent. "The majority (90%) of the failures are silent" (4)
- Finding 3: 21% leave lasting damage after the partition heals. "Twenty one percent of the failures lead to permanent damage to the system." (4)
- Finding 4: leader election, configuration change, request routing and data consolidation are the most vulnerable; leader election is hit by 40%. "Leader election is the most vulnerable to network partitioning (was affected by 40% of the failures)." (4)
- The most common leader-election flaw is two leaders at once, and an isolated leader may still serve stale reads. "the most common leader election flaw is the simultaneous presence of two leaders." (4)
- Simple election rules (longest log, latest timestamp, lowest id) can pick a minority node and erase the majority's writes. "These criteria can cause data loss when a node from the minority partition becomes a leader and erases all updates performed by the majority" (4)
- Finding 5: 64% need no client access or access to only one side, so "just keep clients on one side" doesn't protect you. "The majority (64%) of the failures either do not require any client access or require client access to only one side of the network partition" (4)
- Finding 6: 29% caused by partial partitions. "a significant percentage of them (29%) are caused by partial partitions" (4)
- Finding 9: 88% triggered by isolating a single node. "The majority (88%) of the failures manifest by isolating a single node" (5)
- Finding 10: 80% deterministic or with known timing constraints (62% deterministic). "The majority (80%) of the failures are either deterministic or have known timing constraints." (5)
- The few nondeterministic failures come from thread interleavings and internal background work. "Only 7% of the failures are nondeterministic; these failures are caused by multithreaded interleavings and by overlapping the manifestation sequence with hard-to-predict internal system operations." (5.2)
- All multi-event failures need their events in a specific order. "All of the failures that involve multiple events only manifest if the events happen in a specific order." (5.1)
- Finding 11: 47% needed a redesign of a mechanism to fix. "The resolution of 47% of the failures required redesigning a system mechanism" (5.3)
- Finding 12: all reproducible on five nodes, 83% on three. "All failures can be reproduced on a cluster of five nodes, with the majority (83%) of the failures being reproducible with three nodes only" (5)
- Finding 13: 93% reproducible with a fault-injection framework. "The majority of the failures (93%) can be reproduced through tests by using a fault injection framework such as NEAT." (5)
- Developers mostly tested partitions with mocks, on one component and one side only. "In most cases, developers used mocking [26, 27] to test the impact of network partitioning on only one component and on just one side of the partition." (1)
- NEAT creates partitions with OpenFlow switch rules, or iptables on the hosts. "we built a basic version using iptables [36] to alter firewall rules at end hosts." (1)
- Jepsen does random testing with partitions but, per the authors, doesn't readily support all partition types. "Jepsen does not readily support unit testing or all types of network partitioning." (2.3)

## Visuals worth redrawing

- Figure 1: the three partition types (complete, partial, simplex) as groups of nodes with cut links.

## My notes

- The Jepsen claim is from 2018; Jepsen's current combined nemesis has a
  "majorities-ring" partition, which is a partial partition (see
  jepsen-library). The criticism may be dated.

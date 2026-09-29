---
id: terrace-craq-2009
title: "Object Storage on CRAQ: High-throughput chain replication for read-mostly workloads"
author: Jeff Terrace, Michael J. Freedman
url: https://www.usenix.org/legacy/event/usenix09/tech/full_papers/terrace/terrace.pdf
kind: paper
primary: true
---

## Summary

CRAQ (Chain Replication with Apportioned Queries) lets every node in a
chain answer reads while keeping chain replication's strong consistency
(USENIX ATC 2009). Nodes keep clean and dirty versions of each object
and ask the tail only when their newest version is dirty.

## Key claims

- In basic chain replication all reads for an object hit one node. "All reads for an object must go to the same node, leading to potential hotspots." (1)
- Across datacenters, the tail may be far away. "as all reads to a chain may then be handled by a potentially-distant node (the chain’s tail)." (1)
- A write is committed when it reaches the tail. "Once the write reaches the tail node, it has been applied to all replicas in the chain, and it is considered committed." (2.2)
- Sending all reads to the tail caps read throughput at one node. "it reduces read throughput to that of a single node, instead of being able to scale out with chain size." (2.2)
- Nodes keep versions marked clean or dirty; a write is dirty until the tail's ack comes back up the chain. "If the node is not the tail, it marks the version as dirty, and propagates the write to its successor." (2.3)
- A clean read is answered locally; a dirty read triggers a version query to the tail. "the node contacts the tail and asks for the tail’s last committed version number (a version query)." (2.3)
- Any node can then serve reads. "CRAQ enables any chain node to handle read operations while preserving strong consistency" (1)
- For read-mostly loads, read throughput grows with chain length: about 200% better for three nodes and 600% for seven. "approximately a 200% improvement for three-node chains, and 600% for seven-node chains." (1)
- CRAQ uses ZooKeeper to track chain membership. (5)
- Many chains placed by consistent hashing still leave a popular object on one tail. "these algorithms might still find load imbalances if particular objects are disproportionally popular" (1)
- Reading from middle nodes in plain CR would break strong consistency. "concurrent reads to different nodes could see different writes as they are in the process of propagating down the chain." (2.2)
- Their definition of strong consistency: one order, and reads see the latest write. "a read to an object always sees the latest written value." (2.1)

## Visuals worth redrawing

- Figures 2 and 3: clean reads at any node, dirty reads with a version
  query to the tail.

## My notes

- Their implementation has the head reply after the tail's ack, since
  the head already has a TCP connection to the client.

---
id: hunt-zookeeper-2010
title: "ZooKeeper: Wait-free coordination for Internet-scale systems"
author: Patrick Hunt, Mahadev Konar, Flavio P. Junqueira, Benjamin Reed (Yahoo!)
url: https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf
kind: paper
primary: true
---

## Summary

The USENIX ATC 2010 paper by ZooKeeper's builders. Instead of offering
locks directly (like Chubby), ZooKeeper offers a small tree of in-memory
data nodes (znodes) with a few non-blocking operations: ephemeral nodes
tied to a client session, sequential nodes with a rising counter, watches
that fire once on change, and version checks. Clients build locks, leader
election, group membership and configuration on top ("recipes"). Writes
are linearizable through a leader-based broadcast protocol (Zab); reads
are served locally by whichever server the client is connected to.

## Key claims

- ZooKeeper gives primitives, not locks; clients build their own. "we moved away from implementing specific primitives on the server side, and instead we opted for exposing an API that enables application developers to implement their own primitives." (Introduction)
- It avoided blocking primitives like locks, because slow clients would slow everyone. "Blocking primitives for a coordination service can cause, among other problems, slow or faulty clients to impact negatively the performance of faster clients." (Introduction)
- The two ordering guarantees: FIFO per client and linearizable writes. "guaranteeing both FIFO client ordering of all operations and linearizable writes enables an efficient implementation of the service" (Introduction)
- Writes go through Zab; reads are local and not ordered by Zab. "In ZooKeeper, servers process read operations locally, and we do not use Zab to totally order them." (Introduction)
- Only writes are linearizable. "even though only writes are linearizable." (Introduction)
- Target workloads are read-heavy, 2:1 to 100:1. "We show for the target workloads, 2:1 to 100:1 read to write ratio, that ZooKeeper can handle tens to hundreds of thousands of transactions per second." (Abstract)
- Ephemeral znodes disappear when the session that made them ends. "let the system remove them automatically when the session that creates them terminates (deliberately or due to a failure)." (Service overview)
- Sequential znodes get a counter that never goes down under a parent. "Nodes created with the sequential flag set have the value of a monotonically increasing counter appended to its name." (Service overview)
- Watches are one-time and say that something changed, not what. "Watches indicate that a change has happened, but do not provide the change." (Service overview)
- Sessions have a timeout; a client that sends nothing for that long is considered faulty. "ZooKeeper considers a client faulty if it does not receive anything from its session for more than that timeout." (Service overview)
- The client library heartbeats after s/3 idle and switches server after 2s/3 of silence, where s is the session timeout. "the ZooKeeper client library sends a heartbeat after the session has been idle for s/3 ms" (Implementation, client-server interactions)
- sync makes a following read see all earlier writes (a "slow read"). "sync causes a server to apply all pending write requests before processing the read without the overhead of a full write." (ZooKeeper guarantees)
- A simple lock is an ephemeral znode; its problem is the herd effect. "If there are many clients waiting to acquire a lock, they will all vie for the lock when it is released even though only one client can acquire the lock." (Examples of primitives, Simple Locks)
- The no-herd lock: sequential ephemeral nodes, each client watching the one just before it. "The removal of a znode only causes one client to wake up, since each znode is watched by exactly one other client" (Examples of primitives)
- ZooKeeper isn't a lock service but can build one. "Although ZooKeeper is not a lock service, it can be used to implement locks." (Examples of primitives)
- The whole tree is in memory, with a write-ahead log and snapshots; each znode holds at most 1 MB by default. "Each znode in the tree stores a maximum of 1MB of data by default" (Implementation)

## Visuals worth redrawing

- The lock recipe as a row of `lock-000N` znodes, each watching the one
  before it.

## My notes

- Local reads mean a ZooKeeper read can be stale; sync or a write first
  fixes it. The etcd docs' comparison table says ZooKeeper has no
  linearizable reads for the same reason.

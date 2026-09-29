---
id: cassandra-architecture-dynamo
title: "Dynamo (Apache Cassandra architecture docs)"
author: Apache Cassandra project
url: https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html
kind: docs
primary: true
---

## Summary

The Cassandra 5.0 architecture page on what Cassandra took from Dynamo:
a hash ring with virtual nodes, replication to N replicas where every
replica takes writes, tunable consistency levels as a version of
R + W > N, and last-write-wins by timestamp instead of Dynamo's vector
clocks. It also says which repair mechanisms are best effort and which
one guarantees convergence.

## Key claims

- Every replica takes writes for its keys, so every key needs a version. "As every replica can independently accept mutations to every key that it owns, every key must be versioned." (Dataset Partitioning)
- Cassandra dropped Dynamo's vector clocks for last write wins by timestamp, deletes included. "Cassandra uses a simpler last-write-wins model where every mutation is timestamped (including deletes)" (Dataset Partitioning)
- Cassandra calls this multi-master replication. "Multi-master replication using versioned data and tunable consistency" (Dynamo, list of techniques)
- Timestamps come from the client or the coordinator's clock, so correctness depends on synchronized clocks. "Cassandra’s correctness does depend on these clocks, so make sure a proper time synchronization process is running such as NTP." (Data Versioning)
- Last write wins applies per column, not per row. "Cassandra applies separate mutation timestamps to every column of every row within a CQL partition." (Data Versioning)
- Read repair and hints are best effort; only anti-entropy repair guarantees convergence. "These techniques are only best-effort, however, and to guarantee eventual consistency Cassandra implements anti-entropy repair" (Replica Synchronization)
- Beyond Dynamo, Cassandra has sub-range and incremental repair. "Incremental repair allows Cassandra to only repair the partitions that have changed since the last repair." (Replica Synchronization)
- Consistency levels are Dynamo's R and W under other names. "Cassandra’s consistency levels are a version of Dynamo’s R + W > N consistency mechanism" (Tunable Consistency)
- QUORUM is a majority of the replicas. "A majority (n/2 + 1) of the replicas must respond." (Tunable Consistency, QUORUM)
- ANY lets a stored hint count as the write. "A single replica may respond, or the coordinator may store a hint." (Tunable Consistency, ANY)
- Writes always go to every replica; the level only sets how many answers to wait for. "Write operations are always sent to all replicas, regardless of consistency level." (Tunable Consistency)
- "The consistency level simply controls how many responses the coordinator waits for before responding to the client." (Tunable Consistency)
- Reads go only to as many replicas as the level needs (plus speculative retry). "For read operations, the coordinator generally only issues read commands to enough replicas to satisfy the consistency level." (Tunable Consistency)
- QUORUM writes plus QUORUM reads overlap in at least one replica. "If QUORUM is used for both writes and reads, at least one of the replicas is guaranteed to participate in both the write and the read request" (Picking Consistency Levels)
- LOCAL_QUORUM only promises the latest write from the same datacenter. "reads are guaranteed to see the latest write from within the same datacenter." (Picking Consistency Levels)
- Naive hashing is `hash mod buckets`. "In naive data hashing, you typically allocate keys to buckets by taking a hash of the key modulo the number of buckets." (Consistent Hashing using a Token Ring)
- Adding one node then remaps nearly everything. "In this naive scheme, however, adding a single node might invalidate almost all of the mappings." (Consistent Hashing using a Token Ring)
- A ring moves only a small fraction. "The main difference of consistent hashing to naive data hashing is that when the number of nodes (buckets) to hash into changes, consistent hashing only has to move a small fraction of the keys." (Consistent Hashing using a Token Ring)
- With one token per node, a small cluster can't grow by one node and stay balanced. "with evenly spaced tokens and a small number of physical nodes, incremental scaling (adding just a few nodes of capacity) is difficult because there are no token selections for new nodes that can leave the ring balanced." (Multiple Tokens per Physical Node)
- Vnodes: several tokens per physical node. "Virtual nodes solve the problem by assigning multiple tokens in the token ring to each physical node." (Multiple Tokens per Physical Node)
- More tokens mean more neighbours, so more failure combinations lose part of the ring. "Every token introduces up to 2 * (RF - 1) additional neighbors on the token ring, which means that there are more combinations of node failures where we lose availability for a portion of the token ring." (Multiple Tokens per Physical Node)
- More tokens also slow repair. "as the number of tokens per node is increased, the number of discrete repair operations the cluster must do also increases." (Multiple Tokens per Physical Node)
- Cassandra 2.x picked tokens at random, which needed 256 per node for balance. "the only token allocation algorithm available was picking random tokens" (Multiple Tokens per Physical Node)
- 3.x and later have a deterministic allocator that needs far fewer. "a new deterministic token allocator was added which intelligently picks tokens such that the ring is optimally balanced while requiring a much lower number of tokens per physical node." (Multiple Tokens per Physical Node)
- Membership and failure detection by gossip. "Distributed cluster membership and failure detection via a gossip protocol" (Dynamo, list of techniques)
- Replicas: walk the ring to RF distinct nodes. "then we "walk" the ring in a clockwise fashion until we encounter three distinct nodes" (Consistent Hashing using a Token Ring)
- Random tokens needed 256 per node for balance in 2.x. "to keep balance the default number of tokens per node had to be quite high, at 256" (Multiple Tokens per Physical Node)
- Cassandra calls its row model a CRDT. "Cassandra uses a Last-Write-Wins Element-Set conflict-free replicated data type for each CQL row" (Dataset Partitioning)
- Different keys in a partition don't conflict. "This means that updates to different primary keys within a partition can actually resolve without conflict!" (Data Versioning)

## Visuals worth redrawing

- The eight-node token ring with RF=3, showing a token range stored on
  three successive nodes (Consistent Hashing using a Token Ring).

## My notes

- Docs are for Cassandra 5.0. My reading of the ANY entry: only at ANY
  does a stored hint count toward the write, so the other levels are
  closer to Dynamo's strict quorum than its sloppy one.

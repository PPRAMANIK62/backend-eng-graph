---
id: etcd-why
title: etcd versus other key-value stores
author: etcd authors
url: https://etcd.io/docs/v3.6/learning/why/
kind: docs
primary: true
---

## Summary

The etcd v3.6 docs page on what etcd is for and how it compares with
ZooKeeper, Consul and NewSQL databases (written by the etcd team, and it
says so). etcd is a small, consistent key-value store on one Raft group,
meant for metadata and coordination, not bulk data. Its last section is
an unusually frank note that etcd's lock API does not give mutual
exclusion on its own, and that the revision number is the fencing token.

## Key claims

- etcd picks consistency over availability. "These are systems that will never tolerate split-brain operation and are willing to sacrifice availability to achieve this end." (etcd versus other key-value stores)
- Uses: configuration, service discovery, coordination; leader election, locks and liveness. "Common distributed patterns using etcd include leader election, distributed locks, and monitoring machine liveness." (intro)
- Kubernetes keeps its cluster state in etcd and watches it. "The Kubernetes API server persists cluster state into etcd." (Use cases)
- Comparison table: etcd reliable up to several gigabytes, ZooKeeper hundreds of megabytes, NewSQL terabytes. "Maximum reliable database size" row: etcd "Several gigabytes", ZooKeeper "Hundreds of megabytes (sometimes several gigabytes)". (Comparison chart)
- Comparison table: etcd has linearizable reads, ZooKeeper doesn't. "Linearizable Reads" row: etcd "Yes", ZooKeeper "No". (Comparison chart)
- One replication group, a revision for every change. "Each modification of cluster state, which may change multiple keys, is assigned a global unique ID, called a revision in etcd, from a monotonically increasing counter for reasoning over ordering." (Using etcd for metadata)
- Writes commit through Raft in the one replication group. "Since there’s only a single replication group, the modification request only needs to go through the raft protocol to commit." (Using etcd for metadata)
- Elections and locks come built in. "etcd has distributed coordination primitives such as event watches, leases, elections, and distributed shared locks out of the box" (Using etcd for distributed coordination)
- No sharding, so it doesn't scale out. "The replication behind etcd cannot horizontally scale because it lacks data sharding." (Using etcd for metadata)
- Rule of thumb: etcd for metadata, a NewSQL database past a few GB. "If storing more than a few GB of data or if full SQL queries are needed, choose a NewSQL database." (NewSQL)
- Locking algorithms are easy to get subtly wrong. "it is easy to develop a locking algorithm that appears to work, only to suddenly break due to thundering herd and timing skew." (Using etcd for distributed coordination)
- Lease basics: a TTL, and the server revokes it when time runs out. "When the server detects the passage of time longer than the TTL, it revokes the lease." (Notes on the usage of lock and lease)
- The lock API isn't mutual exclusion by itself. "However, the lock APIs cannot be used as mutual exclusion mechanism by themselves." (Notes on the usage of lock and lease)
- Because server and client each measure the TTL with their own clock, they can disagree. "It allows a situation that the server revokes the lease but the client still claims it owns the lease." (Notes on the usage of lock and lease)
- Mutual exclusion inside etcd comes from conditions on revision and lease ID in Put/Txn (compare and swap). "In etcd's RPCs like Put or Txn, we can specify required conditions about revision number and lease ID for the operations." (Notes on the usage of lock and lease)
- The revision is etcd's fencing token. "The authors interpret that fencing token is revision number in the case of etcd." (Notes on the usage of lock and lease)
- Leases are an optimization that cuts aborted requests. "leases provide an optimization mechanism for reducing a number of aborted requests." (Notes on the usage of lock and lease)
- External resources must do their own version check. "The lock feature of etcd itself cannot be used for protecting external resources." (Notes on the usage of lock and lease)

## Visuals worth redrawing

- The comparison chart (etcd, ZooKeeper, Consul, NewSQL) could be a small
  table, but it's the etcd team's own view.

## My notes

- Pages in the same docs: the etcd API page (v3.6) says a lease "expires
  if the etcd cluster does not receive a keepAlive within a given TTL
  period" and that attached keys are deleted when it expires. Not given a
  separate note.

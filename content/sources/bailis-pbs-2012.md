---
id: bailis-pbs-2012
title: "Probabilistically Bounded Staleness for Practical Partial Quorums"
author: Peter Bailis, Shivaram Venkataraman, Michael J. Franklin, Joseph M. Hellerstein, Ion Stoica
url: http://www.bailis.org/papers/pbs-vldb2012.pdf
kind: paper
primary: false
---

## Summary

A VLDB 2012 paper that asks how stale Dynamo-style reads really are when
R + W is not greater than N. It models the chance that a read started
t milliseconds after a write sees it, fits the model to production
latency data from LinkedIn (Voldemort) and Yammer (Riak), and finds that
partial quorums are usually consistent within tens of milliseconds while
cutting tail latency a lot.

## Key claims

- A partial quorum is when read and write sets don't have to overlap. "partial quorums imply R+W ≤N" (1.1)
- Eventual consistency by itself gives no bound on staleness. "eventually consistent systems make no guarantees on the staleness (recency in terms of versions written) of data items returned" (1)
- Coordinators send every request to every replica and take the first responses. "Coordinators send all requests to all replicas but consider only the first R" (2.2)
- So the write keeps spreading after the client got its ack. "the write quorum size increases even after the operation returns, growing via anti-entropy" (2.2)
- Replication factors in practice are small. "replication factors for data stores are low, typically between one and three" (2.2)
- Defaults at the time: Cassandra N=3, R=W=1. "Cassandra defaults to N =3, R=W =1" (2.3)
- Riak N=3, R=W=2. "Riak defaults to N =3, R=W =2" (2.3)
- Headline result. "eventually consistent systems frequently return consistent data within tens of milliseconds while offering significant latency benefits." (Abstract)
- SSDs vs spinning disks at LinkedIn. "(e.g., 1.85ms versus 45.5ms wait time for a 99.9% probability of consistent reads)" (1)
- Yammer's trade. "we observe an 81.1% combined read and write latency improvement at the 99.9th percentile (230 to 43.3ms) for a 202ms window of inconsistency (99.9% probability consistent reads)." (1)
- R=W=1 on the Yammer fit. "For YMMR, R=W =1 results in low latency reads and writes (16.4ms) but high t-visibility (1364ms)." (5.6)
- Right after a write, on disks, a read is often stale. "immediately after write commit, LNKD-DISK had only a 43.9% probability of consistent reads" (5.6)
- Read repair works like an extra write per read. "Read repair acts like an additional write for every read, except old values are re-written." (4.1)
- Dynamo's open-source descendants. "Quorum-replicated data stores such as Dynamo [20] and its open source descendants Apache Cassandra [41], Basho Riak [3], and Project Voldemort [24]" (1.1)
- The real-time results are modeled from production latency distributions. "model real-time staleness for representative Dynamo-style systems under internet-scale production workloads" (Abstract)
- The Yammer comparison is partial quorum R=2, W=1 against the fastest strict quorum. "setting R=2 and W =1 reduces t-visibility to 202ms and the combined read and write latencies are 81.1% (186.7ms) lower than the fastest strict quorum (W =1, R=3)." (5.6)
- Most Cassandra users wrote with W=1. "The Apache Cassandra 1.0 documentation claims that “a majority of users do writes at consistency level [W =1]”" (2.3)

## Visuals worth redrawing

- Figure 1: client write to a coordinator, forwarded to three replicas,
  ack after W=2 responses.

## My notes

- Numbers are from models fitted to production latency distributions
  (and checked against a modified Cassandra), not from live staleness
  measurements. Say so when using them.
- The defaults quoted are from when the paper was written (Cassandra
  1.0 era), not today's.

---
id: abadi-pacelc-2012
title: Consistency Tradeoffs in Modern Distributed Database System Design
author: Daniel J. Abadi
url: https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf
kind: paper
primary: true
---

## Summary

Abadi's IEEE Computer article (2012) that sets out PACELC. CAP only
says what happens during a partition; the tradeoff that shaped most
replicated databases is consistency against latency, which is there
all the time. PACELC names both: under a partition, availability or
consistency; else, latency or consistency.

## Key claims

- CAP says nothing about normal operation. "In reality, CAP only posits limitations in the face of certain types of failures, and does not constrain any system capabilities during normal operation." (intro)
- Replication alone creates the tradeoff. "As soon as a DDBS replicates data, a tradeoff between consistency and latency arises." (Data replication)
- It exists with no partition at all. "This tradeoff exists even when there are no network partitions, and thus is completely separate from the tradeoffs CAP describes." (Consistency/latency tradeoff)
- Availability and latency blur together. "Note that availability and latency are arguably the same thing: an unavailable system essentially provides extremely high latency." (Consistency/latency tradeoff)
- Over a WAN there's no escape. "For data replication over a WAN, there is no way around the consistency/latency tradeoff." (Tradeoff examples)
- A study of Cassandra found quorum reads much slower than reads from any replica. "The difference in latency between these two options can be a factor of four or more." (Tradeoff examples)
- The definition. "if there is a partition (P), how does the system trade off availability and consistency (A and C); else (E), when the system is running normally in the absence of partitions, how does the system trade off latency (L) and consistency (C)?" (PACELC)
- ELC only applies when you replicate. "Note that the latency/consistency tradeoff (ELC) only applies to systems that replicate data." (PACELC)
- Dynamo-style stores by default. "The default versions of Dynamo, Cassandra, and Riak are PA/EL systems" (PACELC)
- Fully ACID systems. "Fully ACID systems such as VoltDB/H-Store and Megastore are PC/EC" (PACELC)
- MongoDB as it was then. "MongoDB can be classified as a PA/EC system." (PACELC)
- Yahoo's PNUTS. "PNUTS is a PC/EL system." (PACELC)
- PC doesn't mean fully consistent. "PC does not indicate that the system is fully consistent; rather it indicates that the system does not reduce consistency beyond the baseline consistency level when a network partition occurs—instead, it reduces availability." (PACELC)
- The labels are defaults; the knobs move them. "these systems have user-adjustable settings to alter the ELC tradeoff" (PACELC)
- Its own limit. "neither CAP nor PACELC can explain them all." (conclusion)
- BigTable and HBase too. "BigTable and related systems such as HBase are also PC/EC." (PACELC)
- Partitions are rarer than other failures. "Nonetheless, in general, network partitions are somewhat rare, and are often less frequent than other serious types of failure events in DDBSs." (CAP is for failures)
- PNUTS serves reads from any replica and makes items unavailable for writes if their master is cut off. "In other words, the PNUTS default configuration is actually CP" (Tradeoff examples)
- Synchronous replication over a WAN costs latency. "synchronous actions across independent entities, especially over a WAN, increase latency" (Data replication)
- Why PA/EL systems give up both. "Giving up both Cs in PACELC makes the design simpler" (PACELC)
- MongoDB (then) kept unreplicated writes of a failed master aside. "it stores all writes that have been sent to the master node but not yet replicated in a local rollback directory." (PACELC)
- PNUTS reads from any replica. "PNUTS can serve reads from any replica" (Tradeoff examples)
- And blocks writes to items whose master is cut off. "the system by default makes the data item unavailable for updates." (Tradeoff examples)
- How to say it. "rewriting CAP as PACELC (pronounced “pass-elk”)" (PACELC)
- Quorums: reads touch a synchronously updated node when R + W > N. "If it routes reads to at least one node that has been synchronously updated—for example, when R + W > N in a quorum protocol" (Data replication)
- The Cassandra study compared weak reads from any replica with quorum reads. "The second option, “quorum reads,” requires the system to explicitly check for inconsistency across multiple replicas before reading data." (Tradeoff examples, Rao, Shekita and Tata)
- Raising R + W buys consistency with latency. "by increasing R + W, they gain more consistency at the expense of latency" (PACELC)

## Visuals worth redrawing

None in the article. A PACELC decision tree is our own drawing.

## My notes

- Abadi first proposed PACELC in a 2010 blog post ("Problems with CAP,
  and Yahoo's little known NoSQL system"); opened, not given a note.
- The MongoDB classification is from 2012; see mongodb-write-concern
  for today's default.

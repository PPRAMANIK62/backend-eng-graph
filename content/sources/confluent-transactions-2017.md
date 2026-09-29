---
id: confluent-transactions-2017
title: Transactions in Apache Kafka
author: Apurva Mehta and Jason Gustafson, Confluent
url: https://www.confluent.io/blog/transactions-apache-kafka/
kind: blog
primary: true
---

## Summary

The 2017 follow-up to Kafka's exactly-once announcement, by two of the
engineers who built transactions. It defines exactly-once processing
for a read-process-write loop, names the three ways it breaks
(producer retries, reprocessing after a crash, zombie instances), and
explains how transactions, offset commits in the same transaction,
transactional.id fencing, the transaction coordinator and commit
markers fix the last two.

## Key claims

- Transactions were built for read-process-write. "We designed transactions in Kafka primarily for applications that exhibit a “read-process-write” pattern where the reads and writes are from and to asynchronous data streams such as Kafka topics." (Why Transactions?)
- Formal definition: A consumed if and only if B produced. "More formally, if a stream processing application consumes message A and produces message B such that B = F(A), then exactly-once processing means that A is considered consumed if and only if B is successfully produced, and vice versa." (Why Transactions?)
- Reprocessing after a crash duplicates output. "Reprocessing may happen if the stream processing application crashes after writing B but before marking A as consumed." (Why Transactions?)
- Zombie instances: a replaced instance that's still alive. "We call this the problem of “zombie instances.”" (Why Transactions?)
- Transactions solve reprocessing and zombies; the idempotent producer solves retries. "We designed transaction APIs in Kafka to solve the second and third problems." (Why Transactions?)
- An offset commit is just a write to the offsets topic, so it can join the transaction. "Thus since an offset commit is just another write to a Kafka topic, and since a message is considered consumed only when its offset is committed, atomic writes across multiple topics and partitions also enable atomic read-process-write cycles" (Atomic multi-partition writes)
- The transactional.id plus an epoch fences zombies. "Once the epoch is bumped, any producers with same transactional.id and an older epoch are considered zombies and are fenced off, ie. future transactional writes from those producers are rejected." (Zombie fencing)
- Consumers see only committed transactional messages, but that isn't an atomic read. "It is worth noting that the guarantees above fall short of atomic reads." (Reading Transactional Messages)
- A transaction coordinator in every broker, with a transaction log topic. "The transaction coordinator is a module running inside every Kafka broker." (The Transaction Coordinator and Transaction Log)
- Transaction state is in a replicated topic, so a new coordinator can rebuild it. "If a given broker fails, a new coordinator is elected as the leader for the transaction log partitions the dead broker owned, and it reads the messages from the incoming partitions to rebuild its in-memory state for the transactions in those partitions." (Data flow)
- Commit is a two-phase commit run by the coordinator. "After the producer initiates a commit (or an abort), the coordinator begins the two-phase commit protocol." (Data flow)
- Once prepare_commit is logged, the commit will happen. "Once this is done the transaction is guaranteed to be committed no matter what." (Data flow)
- Phase two writes commit markers into each partition. "The coordinator then begins phase 2, where it writes transaction commit markers to the topic-partitions which are part of the transaction." (Data flow)
- Fencing only works if each transactional.id always handles the same input partitions. "The key to fencing out zombies properly is to ensure that the input topics and partitions in the read-process-write cycle is always the same for a given transactional.id." (How to pick a transactional.id)
- Overhead is per transaction, not per message. "As we can see the overhead is independent of the number of messages written as part of a transaction." (How transactions perform, and how to tune them)
- Measured by them: 1 KB records, commit every 100 ms, 3% lower throughput. "In practice, for a producer producing 1KB records at maximum throughput, committing messages every 100ms results in only a 3% degradation in throughput." (How transactions perform, and how to tune them)
- A read_committed consumer can't move past an open transaction. "Instead, the broker does not allow it to advance to offsets which include open transactions." (How transactions perform, and how to tune them)
- In Kafka, offset commits are writes to an internal offsets topic. "In Kafka, we record offset commits by writing to an internal Kafka topic called the offsets topic." (Atomic multi-partition writes)
- Every transactional.id maps to one coordinator, by hashing to a transaction log partition. "This means that exactly one coordinator owns a given transactional.id." (The Transaction Coordinator and Transaction Log)
- One marker per partition in the transaction, so an extra write per partition. "But we cannot avoid one additional write to each partition in the transaction." (How transactions perform, and how to tune them)
- Longer transactions mean higher end-to-end latency for read_committed readers. "So the longer the interval between commits, the longer consuming applications will have to wait, increasing the end-to-end latency." (How transactions perform, and how to tune them)
- Side effects in other systems aren't covered. "For instance, if the processing has side effects on other storage systems, the APIs covered here are not sufficient to guarantee exactly-once processing." (Conclusion)
- Transactions arrived in Kafka 0.11.0. "The components introduced with the transactions API in Kafka 0.11.0 are the Transaction Coordinator and the Transaction Log" (The Transaction Coordinator and Transaction Log)
- After the markers, the coordinator marks the transaction complete. "Once the markers are written, the transaction coordinator marks the transaction as “complete” and the producer can start the next transaction." (Data flow)
- Registering the transactional.id closes pending transactions and bumps the epoch. "At this point, the coordinator closes any pending transactions with that transactional.id and bumps the epoch to fence out zombies." (Data flow)
- The extra cost: RPCs to register partitions, one marker per partition, and transaction log writes. "Finally, we write state changes to the transaction log." (How transactions perform, and how to tune them)

## Visuals worth redrawing

- The read-process-write loop with the output record and the offset
  commit inside one transaction, and the markers written at the end.

## My notes

- The page's byline shows Apurva Mehta; the footer bio is Jason
  Gustafson. The 3% figure is Confluent's own measurement on Kafka
  0.11; don't repeat it as current.
- The "picking a transactional.id" problem is what KIP-447 (Kafka 2.6)
  fixed.

---
id: kafka-kip-98
title: "KIP-98: Exactly Once Delivery and Transactional Messaging"
author: Apurva Mehta and others, Apache Kafka project
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging
kind: spec
primary: true
---

## Summary

The design proposal, adopted for Kafka 0.11.0.0, that added the
idempotent producer and transactions. Explains the producer ID (PID),
per-partition sequence numbers, what the broker does with a duplicate
or a gap, the producer epoch, and why the fields sit in the batch
header.

## Key claims

- The problem: a broker crash between writing and acking makes the retry a duplicate. "the broker may crash between committing a message and sending an acknowledgment to the producer, causing the producer to retry" (Motivation)
- Each new producer gets a PID; sequence numbers start at zero per partition. "For a given PID, sequence numbers will start from zero and be monotonically increasing, with one sequence number per topic partition produced to." (Idempotent Producer Guarantees)
- The broker accepts only the next number. "The broker will reject a produce request if its sequence number is not exactly one greater than the last committed message from that PID/TopicPartition pair." (Idempotent Producer Guarantees)
- Lower means duplicate (ignorable), higher means lost data (fatal). "Messages with a lower sequence number result in a duplicate error, which can be ignored by the producer. Messages with a higher number result in an out-of-sequence error, which indicates that some messages have been lost, and is fatal." (Idempotent Producer Guarantees)
- Only within one producer session. "since each new instance of a producer is assigned a new, unique, PID, we can only guarantee idempotent production within a single producer session." (Idempotent Producer Guarantees)
- A TransactionalId keeps the same PID across restarts and bumps the epoch to fence the old instance. "Bumps up the epoch of the PID, so that the any previous zombie instance of the producer is fenced off and cannot move forward with its transaction." (2.1)
- Without a TransactionalId, idempotence is per session only. "If no TransactionalId is specified in the configuration, a fresh PID is assigned, and the producer only enjoys idempotent semantics and transactional semantics within a single session." (2.2)
- The fields live once per batch, not per message, to save space. "we can locate these fields only at the message set level which allows the additional overhead to be amortized across batches of messages rather than paying the cost for each message separately." (Message Format)
- Sequence and epoch wrap around safely. "Both the epoch and sequence number will wrap around once int16_max and int32_max are reached." (Message Format)
- The log cleaner must keep sequence ranges. "we must preserve the range of sequence numbers that were ever used in a message set since we depend on this to determine the next sequence number expected for each PID." (Message Set Fields)
- The original design required one in-flight request. "When idempotence is enabled, we enforce that acks=all, retries > 1, and max.inflight.requests.per.connection=1." (New Configurations, enable.idempotence)
- Idempotence was off by default in this design. "Whether or not idempotence is enabled (false by default)." (New Configurations, enable.idempotence)

- Transactions, not idempotence, cover several partitions at once. "transactional guarantees enable applications to produce to multiple TopicPartitions atomically" (Transactional Guarantees)

## Visuals worth redrawing

- The data-flow diagram is about transactions; not needed for the
  idempotent producer node.

## My notes

- "max.inflight=1" is outdated: Kafka 4.3 allows up to 5
  (kafka-producer-configs). The default flipped to true in 3.0
  (kafka-kip-679).

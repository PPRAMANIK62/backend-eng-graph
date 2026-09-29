---
id: confluent-exactly-once-2017
title: "Exactly-once Semantics are Possible: Here's How Apache Kafka Does it"
author: Neha Narkhede, Confluent
url: https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/
kind: blog
primary: true
---

## Summary

The 2017 announcement of exactly-once semantics in Kafka 0.11, by one
of Kafka's creators. Explains the three failure cases (broker,
producer-to-broker RPC, client), the idempotent producer, transactions
across partitions, and what "exactly once" means for stream
processing, including its limits.

## Key claims

- At least once, from the producer's side: a retry after a lost ack writes the message twice. "If the broker had failed right before it sent the ack but after the message was successfully written to the Kafka topic, this retry leads to the message being written twice and hence delivered more than once to the end consumer." (Messaging Semantics Explained)
- At most once: don't retry, accept that some messages won't get through. "in order to avoid the possibility of duplication, we accept that sometimes messages will not get through." (Messaging Semantics Explained)
- Exactly once needs the messaging system and the application to cooperate. "This is because it requires a cooperation between the messaging system itself and the application producing and consuming the messages." (Messaging Semantics Explained)
- Framed as hard, not impossible. "In this post, I’d like to tell you what Kafka’s exactly-once semantics mean, why it is a hard problem, and how the new idempotence and transaction features in Kafka enable correct exactly-once" (intro)
- A missing ack doesn't mean the request failed. "Failure to receive that ack does not necessarily mean that the request itself failed." (Failures That Must Be Handled)
- Zombie producers must be fenced. "for correctness, the broker should discard messages sent by a zombie producer." (Failures That Must Be Handled)
- The idempotent producer works like TCP's sequence numbers, but they're persisted in the replicated log. "Unlike TCP, though—which provides guarantees only within a transient in-memory connection—this sequence number is persisted to the replicated log" (Idempotence)
- Because the sequence numbers are in the log, a new leader can spot duplicates too. "so even if the leader fails, any broker that takes over will also know if a resend is a duplicate." (Idempotence)
- Turned on with enable.idempotence=true. "configure your producer to set “enable.idempotence=true”." (Idempotence)
- Exactly once in stream processing means each input's results are reflected once. "exactly-once for stream processing guarantees that for each received record, its processed results will be reflected once, even under failures." (What Is Exactly-Once for Stream Processing?)
- The guarantee stops at Kafka's edge: an RPC to a remote store isn't covered. "Note that exactly-once semantics is guaranteed within the scope of Kafka Streams’ internal processing only" (What Is Exactly-Once for Stream Processing?)
- The guarantee covers input read from Kafka, state written to Kafka, and output written back to Kafka. "It offers end-to-end exactly-once guarantees for a stream processing application that extends from the data read from Kafka, any state materialized to Kafka by the Streams app, to the final output written back to Kafka." (quote block)
- The right way to think about it: output as if each message was seen once. "The correct way to think of exactly-once stream processing guarantees for deterministic operations is to ensure that the output of a read-process-write operation would be the same as it would if the stream processor saw each message exactly one time—as it would in a case where no failure occurred." (quote block)
- Not magic for plain consumers: commit state together with offsets. "Exactly-once processing is an end-to-end guarantee and the application has to be designed to not violate the property as well." (Is This Magical Pixie Dust)
- Measured cost (Confluent's benchmark): 3% lower producer throughput than at-least-once in-order, for 1 KB messages and 100 ms transactions. "For 1 KB messages and transactions lasting 100 ms, the producer throughput declines only by 3%, compared to the throughput of a producer configured for at least once, in-order delivery" (The Good News: Kafka Is Still Fast!)

## Visuals worth redrawing

None needed.

## My notes

- Written by a vendor announcing its own feature; the benchmark numbers
  are theirs, at Kafka 0.11. Don't repeat them as current.
- Opens by answering the "exactly-once is impossible" posts, e.g.
  treat-exactly-once-2015.

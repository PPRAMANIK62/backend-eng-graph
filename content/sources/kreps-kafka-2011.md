---
id: kreps-kafka-2011
title: "Kafka: a Distributed Messaging System for Log Processing"
author: Jay Kreps, Neha Narkhede, Jun Rao (LinkedIn)
url: https://notes.stephenholiday.com/Kafka.pdf
kind: paper
primary: true
---

## Summary

The first Kafka paper, from the NetDB workshop (2011). Why the
messaging systems of the day didn't fit LinkedIn's log data, and the
choices that made Kafka different: a partition is a log of segment
files, messages are addressed by offset, the broker keeps no record of
what each consumer has read, and data is deleted by age.

## Key claims

- Older brokers expect queues to stay short. "Finally, many messaging systems assume near immediate consumption of messages, so the queue of unconsumed messages is always fairly small." (2. Related Work)
- And slow down when they don't. "Their performance degrades significantly if messages are allowed to accumulate" (2. Related Work)
- A partition is a log. "Each partition of a topic corresponds to a logical log." (3.1 Simple storage)
- No message ids, just offsets. "Instead, each message is addressed by its logical offset in the log." (3.1 Simple storage)
- Acknowledging an offset covers everything before it. "If the consumer acknowledges a particular message offset, it implies that the consumer has received all messages prior to that offset in the partition." (3.1 Simple storage)
- The broker doesn't track consumers. "the information about how much each consumer has consumed is not maintained by the broker, but by the consumer itself." (3.1 Stateless broker)
- So deletion is by time. "Kafka solves this problem by using a simple time-based SLA for the retention policy." (3.1 Stateless broker)
- Typically a week, at the time. "A message is automatically deleted if it has been retained in the broker longer than a certain period, typically 7 days." (3.1 Stateless broker)
- Consumers can rewind. "This violates the common contract of a queue, but proves to be an essential feature for many consumers." (3.1 Stateless broker)
- Within a group, one consumer per message. "each message is delivered to only one of the consumers within the group." (3.2 Distributed Coordination)
- Across groups, everyone gets everything. "Different consumer groups each independently consume the full set of subscribed messages and no coordination is needed across consumer groups." (3.2)
- The partition is the unit of parallelism. "Our first decision is to make a partition within a topic the smallest unit of parallelism." (3.2)
- So you need more partitions than consumers. "In order for the load to be truly balanced, we require many more partitions in a topic than the consumers in each group." (3.2)
- Order only within a partition. "Kafka guarantees that messages from a single partition are delivered to a consumer in order. However, there is no guarantee on the ordering of messages coming from different partitions." (3.3 Delivery Guarantees)
- At least once. "In general, Kafka only guarantees at-least-once delivery." (3.3 Delivery Guarantees)
- One consumer per partition per group. "This means that at any given time, all messages from one partition are consumed only by a single consumer within each consumer group." (3.2)
- After a crash, messages since the last committed offset come again. "the consumer process that takes over those partitions owned by the failed consumer may get some duplicate messages that are after the last offset successfully committed to zookeeper." (3.3 Delivery Guarantees)

## Visuals worth redrawing

- Figure 1: producers, brokers holding topic partitions, consumers.
- Figure 2: a partition as segment files with an in-memory offset index.

## My notes

- Describes Kafka before replication and before ZooKeeper's removal;
  it used ZooKeeper for consumer registries and offsets. Old for
  details, good for the why.

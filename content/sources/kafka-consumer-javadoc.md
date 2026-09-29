---
id: kafka-consumer-javadoc
title: KafkaConsumer (Apache Kafka 4.3 Javadoc)
author: Apache Kafka project
url: https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html
kind: docs
primary: true
---

## Summary

The class docs for the Java consumer, Kafka 4.3. The long header is the
best official explanation of how a consumer works: offsets and the two
kinds of position, consumer groups and rebalancing, how a dead consumer
is detected, automatic and manual commits, storing offsets outside
Kafka, seeking, and how read_committed consumers see transactions.

## Key claims

- An offset identifies a record within a partition and is also the consumer's position. "This offset acts as a unique identifier of a record within that partition, and also denotes the position of the consumer in the partition." (Offsets and Consumer Position)
- Position 5 means records 0 to 4 are consumed and 5 comes next. "For example, a consumer which is at position 5 has consumed records with offsets 0 through 4 and will next receive the record with offset 5." (Offsets and Consumer Position)
- Offsets can have gaps (compacted topics, transactions). "Note that offsets are not guaranteed to be consecutive (such as compacted topic or when records have been produced using transactions)." (Offsets and Consumer Position)
- The position is one past the highest offset seen and moves on every poll. "It will be one larger than the highest offset the consumer has seen in that partition. It automatically advances every time the consumer receives messages in a call to poll(Duration)." (Offsets and Consumer Position)
- The committed position is what a restarted consumer goes back to. "The committed position is the last offset that has been stored securely. Should the process fail and restart, this is the offset that the consumer will recover to." (Offsets and Consumer Position)
- Consumers with the same group.id form one group. "All consumer instances sharing the same group.id will be part of the same consumer group." (Consumer Groups and Topic Subscriptions)
- Each partition goes to exactly one consumer in the group; four partitions and two consumers means two each. "This is achieved by balancing the partitions between all members in the consumer group so that each partition is assigned to exactly one consumer in the group. So if there is a topic with four partitions, and a consumer group with two processes, each process would consume from two partitions." (Consumer Groups and Topic Subscriptions)
- When a member fails or joins, partitions move: a rebalance. "This is known as rebalancing the group and is discussed in more detail below." (Consumer Groups and Topic Subscriptions)
- New partitions and new topics that match a regex also trigger a rebalance. "Group rebalancing is also used when new partitions are added to one of the subscribed topics or when a new topic matching a subscribed regex is created." (Consumer Groups and Topic Subscriptions)
- A group acts as one logical subscriber; many groups can read a topic without copying data. "Conceptually you can think of a consumer group as being a single logical subscriber that happens to be made up of multiple processes." (Consumer Groups and Topic Subscriptions)
- One group gives queue behaviour; one group per process gives pub-sub. "To get semantics similar to pub-sub in a traditional messaging system each process would have its own consumer group, so each process would subscribe to all the records published to the topic." (Consumer Groups and Topic Subscriptions)
- A ConsumerRebalanceListener lets you commit or clean up when partitions move. "consumers can be notified through a ConsumerRebalanceListener, which allows them to finish necessary application-level logic such as state cleanup, manual offset commits, etc." (Consumer Groups and Topic Subscriptions)
- A consumer that stops heartbeating for session.timeout.ms is declared dead. "If the consumer crashes or is unable to send heartbeats for a duration of session.timeout.ms, then the consumer will be considered dead and its partitions will be reassigned." (Detecting Consumer Failures)
- A consumer that heartbeats but doesn't call poll within max.poll.interval.ms leaves the group (livelock guard). "Basically if you don't call poll at least as frequently as the configured max interval, then the client will proactively leave the group so that another consumer can take over its partitions." (Detecting Consumer Failures)
- After that, its commit fails; only active members may commit. "This is a safety mechanism which guarantees that only active members of the group are able to commit offsets." (Detecting Consumer Failures)
- For slow, variable processing, hand work to another thread and commit only finished offsets. "Some care must be taken to ensure that committed offsets do not get ahead of the actual position." (Detecting Consumer Failures)
- Auto commit: enable.auto.commit with auto.commit.interval.ms. "Setting enable.auto.commit means that offsets are committed automatically with a frequency controlled by the config auto.commit.interval.ms." (Automatic Offset Committing)
- Manual commit after a database insert: a crash between insert and commit repeats the batch, which is at least once. "In this case the process that took over consumption would consume from last committed offset and would repeat the insert of the last batch of data." (Manual Offset Control)
- Auto commit is also at least once, but only if you finish each poll's records before the next poll. "If you fail to do either of these, it is possible for the committed offset to get ahead of the consumed position, which results in missing records." (Manual Offset Control, note)
- Commit the offset of the next record to read, not the last one read. "The committed offset should always be the offset of the next message that your application will read." (Manual Offset Control, note)
- Store the offset with the results in your own store, atomically, for stronger than at-least-once. "This is not always possible, but when it is it will make the consumption fully atomic" (Storing Offsets Outside Kafka)
- Example: offset and results in one relational transaction. "If the results of the consumption are being stored in a relational database, storing the offset in the database as well can allow committing both the results and offset in a single transaction." (Storing Offsets Outside Kafka)
- You can seek backwards or forwards. "This means a consumer can re-consume older records, or skip to the most recent records without actually consuming the intermediate records." (Controlling The Consumer's Position)
- A consumer far behind on time-sensitive data may skip to the end. "One case is for time-sensitive record processing it may make sense for a consumer that falls far enough behind to not attempt to catch up processing all records, but rather just skip to the most recent records." (Controlling The Consumer's Position)
- read_committed consumers stop at the last stable offset, the first open transaction. "Instead, the end offset of a partition for a read_committed consumer would be the offset of the first message in the partition belonging to an open transaction. This offset is known as the 'Last Stable Offset'(LSO)." (Reading Transactional Messages)
- Lag metrics for read_committed consumers are measured against the LSO. "Finally, the fetch lag metrics are also adjusted to be relative to the LSO for read_committed consumers." (Reading Transactional Messages)
- Commit and abort markers take up offsets, so transactional topics show gaps. "As a result, applications reading from topics with transactional messages will see gaps in the consumed offsets." (Reading Transactional Messages)

## Visuals worth redrawing

- A partition with the committed offset and the current position marked
  on it, and the log end further right. Our own drawing.

## My notes

- The class docs describe the classic protocol's heartbeat settings;
  with group.protocol=consumer (KIP-848) session timeouts move to the
  broker (see kafka-consumer-configs).

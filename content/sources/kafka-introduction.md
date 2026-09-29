---
id: kafka-introduction
title: Introduction (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/getting-started/introduction/
kind: docs
primary: true
---

## Summary

The getting-started page of the Kafka 4.3 docs. Defines events,
producers, consumers, topics, partitions and replication in a few
paragraphs, with a figure of one topic split into four partitions.

## Key claims

- Kafka publishes, stores and processes streams of events. "To store streams of events durably and reliably for as long as you want." (Apache Kafka is an event streaming platform, item 2)
- The servers that store data are the brokers. "Some of these servers form the storage layer, called the brokers." (How does Kafka work in a nutshell?)
- An event has a key, a value, a timestamp and headers. "Conceptually, an event has a key, value, timestamp, and optional metadata headers." (Main Concepts and Terminology)
- Producers and consumers don't know about each other. "In Kafka, producers and consumers are fully decoupled and agnostic of each other, which is a key design element to achieve the high scalability that Kafka is known for." (Main Concepts and Terminology)
- Producers don't wait for consumers. "For example, producers never need to wait for consumers." (Main Concepts and Terminology)
- Topics take many producers and many consumers. "Topics in Kafka are always multi-producer and multi-subscriber" (Main Concepts and Terminology)
- Reading doesn't delete. "Events in a topic can be read as often as needed-unlike traditional messaging systems, events are not deleted after consumption." (Main Concepts and Terminology)
- Retention is a per-topic setting. "Instead, you define for how long Kafka should retain your events through a per-topic configuration setting, after which old events will be discarded." (Main Concepts and Terminology)
- Storing a lot doesn't slow it down. "Kafka’s performance is effectively constant with respect to data size, so storing data for a long time is perfectly fine." (Main Concepts and Terminology)
- A topic is split into partitions on different brokers. "Topics are partitioned, meaning a topic is spread over a number of “buckets” located on different Kafka brokers." (Main Concepts and Terminology)
- A published event is appended to one partition. "When a new event is published to a topic, it is actually appended to one of the topic’s partitions." (Main Concepts and Terminology)
- Same key, same partition, read in write order. "Events with the same event key (e.g., a customer or vehicle ID) are written to the same partition, and Kafka guarantees that any consumer of a given topic-partition will always read that partition’s events in exactly the same order as they were written." (Main Concepts and Terminology)
- Replication factor 3 is common. "A common production setting is a replication factor of 3, i.e., there will always be three copies of your data." (Main Concepts and Terminology)
- Replication is per partition. "This replication is performed at the level of topic-partitions." (Main Concepts and Terminology)

## Visuals worth redrawing

- Topic with four partitions P1 to P4, two producers writing
  independently, same-key events (by colour) landing in the same
  partition. (Main Concepts and Terminology)

## My notes

- The page's example event carries a calendar date as its timestamp;
  not copied here.

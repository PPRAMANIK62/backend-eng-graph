---
id: kafka-streams-architecture
title: Kafka Streams Architecture
author: Apache Kafka
url: https://kafka.apache.org/43/streams/architecture/
kind: docs
primary: true
---

## Summary

The Kafka 4.3 docs on how Kafka Streams runs: stream tasks fixed by the
input partitions, local state stores, and fault tolerance by replaying
compacted changelog topics, with standby replicas to shorten restores.

## Key claims

- Parallelism is bounded by input partitions. "the maximum parallelism at which your application may run is bounded by the maximum number of stream tasks, which itself is determined by maximum number of partitions of the input topic(s) the application is reading from." (Stream Partitions and Tasks)
- Each task can embed local state stores. "Every stream task in a Kafka Streams application may embed one or more local state stores that can be accessed via APIs to store and query data required for processing." (Local State Stores)
- Each store is backed by a replicated changelog topic. "For each state store, it maintains a replicated changelog Kafka topic in which it tracks any state updates." (Fault Tolerance)
- Changelogs are compacted. "Log compaction is enabled on the changelog topics so that old data can be purged safely to prevent the topics from growing indefinitely." (Fault Tolerance)
- Restore time is dominated by replaying the changelog. "the cost of task (re)initialization typically depends primarily on the time for restoring the state by replaying the state stores’ associated changelog topics." (Fault Tolerance)
- Standby replicas cut restore time. "users can configure their applications to have standby replicas of local states (i.e. fully replicated copies of the state)." (Fault Tolerance)

## Visuals worth redrawing

None.

## My notes

- Contrast with Flink: Kafka Streams restores from a changelog per store; Flink loads a snapshot.

---
id: kafka-upgrade-notes
title: Upgrading (Apache Kafka 4.3 docs, notable changes per release)
author: Apache Kafka project
url: https://kafka.apache.org/43/getting-started/upgrade/
kind: docs
primary: true
---

## Summary

The upgrade guide in the Kafka 4.3 docs, with a "notable changes"
list for each release. Used for when KIP-848 (the new consumer
rebalance protocol), KIP-890 (transactions server-side defense) and
KIP-932 (share groups) shipped.

## Key claims

- KIP-848 is GA in Kafka 4.0. "The Next Generation of the Consumer Rebalance Protocol (KIP-848) is now Generally Available (GA) in Apache Kafka 4.0." (Notable changes in 4.0.0)
- KIP-890 ships in 4.0: with 4.0 producers the epoch is bumped on every transaction. "When using 4.0 producer clients, the producer epoch is bumped on every transaction to ensure every transaction includes the intended messages and duplicates are not written as part of the next transaction." (Notable changes in 4.0.0)
- Applications should handle TransactionAbortableException. "It is important for applications to properly manage both TimeoutException and TransactionAbortableException when working with transaction producers." (Notable changes)
- Share groups (KIP-932) were a preview in 4.1. "Apache Kafka 4.1 ships with a preview of Queues for Kafka (KIP-932)." (Notable changes in 4.1.0)
- Share groups are production-ready in 4.2. "Queues for Kafka (KIP-932) is production-ready in Apache Kafka 4.2." (Notable changes in 4.2.0)
- Share groups add per-record acks and delivery counting, for records handled one at a time. "Share groups also introduce per-record acknowledgement and counting of delivery attempts." (Notable changes in 4.2.0)
- Share group consumers don't each own whole partitions. "Consumers in a share group cooperatively consume records from topics, without assigning each partition to just one consumer." (Notable changes in 4.2.0)
- Meant for one-at-a-time work, not ordered streams. "Use share groups in cases where records are processed one at a time, rather than as part of an ordered stream." (Notable changes in 4.2.0)
- ZooKeeper is gone since 4.0. "Apache Kafka 4.0 only supports KRaft mode - ZooKeeper mode has been removed." (Notable changes in 4.0.0)
- KRaft was production ready from 3.3. "(the first version when KRaft mode was deemed production ready)" (Upgrading to 4.0)

## Visuals worth redrawing

None.

## My notes

- KIP-848 is on by default on the server after the 4.0 upgrade, but the
  client setting group.protocol still defaults to classic in 4.3
  (kafka-consumer-configs).

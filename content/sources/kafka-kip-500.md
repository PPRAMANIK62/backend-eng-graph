---
id: kafka-kip-500
title: "KIP-500: Replace ZooKeeper with a Self-Managed Metadata Quorum"
author: Colin McCabe
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-500%3A+Replace+ZooKeeper+with+a+Self-Managed+Metadata+Quorum
kind: spec
primary: true
---

## Summary

The Kafka improvement proposal that planned the move off ZooKeeper.
Cluster metadata becomes a log inside Kafka, kept by a small Raft
quorum of controllers; brokers fetch changes from it the way consumers
fetch records.

## Key claims

- Before: ZooKeeper held the metadata and picked the controller. "Currently, Kafka uses ZooKeeper to store its metadata about partitions and brokers, and to elect a broker to be the Kafka Controller." (Motivation)
- Pushed notifications could leave brokers out of step. "This can leave brokers in a divergent state." (Motivation, Metadata as an Event Log)
- The fix: keep metadata in Kafka itself. "Rather than being stored in a separate system, metadata should be stored in Kafka itself." (Motivation, Metadata as an Event Log)
- Two systems to run. "This means that system administrators need to learn how to manage and deploy two separate distributed systems in order to deploy Kafka." (Simpler Deployment and Configuration)
- Controllers form a Raft quorum over a metadata log. "The controller nodes comprise a Raft quorum which manages the metadata log." (The Controller Quorum)
- Its leader is the active controller. "The leader of the metadata log is called the active controller." (The Controller Quorum)
- Brokers pull metadata instead of having it pushed. "Instead of the controller pushing out updates to the other brokers, those brokers will fetch updates from the active controller via the new MetadataFetch API." (Broker Metadata Management)
- Standby controllers already hold the state. "Because the controllers will now all track the latest state, controller failover will not require a lengthy reloading period where we transfer all the state to the new controller." (The Controller Quorum)
- A log gives brokers changes in one order. "This ensures that metadata changes will always arrive in the same order." (Motivation, Metadata as an Event Log)

## Visuals worth redrawing

- Before and after: four brokers plus three ZooKeeper nodes, versus
  four brokers plus three controller nodes with arrows pointing towards
  the active controller. (Architecture, Overview)

## My notes

- A proposal: RPC names like MetadataFetch changed in follow-up KIPs.
  Use it for the why, and the 4.3 docs for what shipped.

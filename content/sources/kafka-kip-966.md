---
id: kafka-kip-966
title: "KIP-966: Eligible Leader Replicas"
author: Calvin Liu (Apache Kafka project)
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-966%3A+Eligible+Leader+Replicas
kind: spec
primary: true
---

## Summary

The Kafka improvement proposal (status: accepted) behind Eligible
Leader Replicas. It shows how the ISR rules could still lose committed
data when the last in-sync replica crashes and loses unflushed writes,
and splits the ISR's two jobs: the set a write must reach, and the set
a new leader may come from.

## Key claims

- Replicas can lose unflushed data in an unclean shutdown. "A partition replica can experience local data loss in unclean shutdown scenarios where unflushed data in the OS page cache is lost - such as an availability zone power outage or a server error." (Motivation)
- Normally such a replica leaves the ISR until caught up. "The Kafka replication protocol is designed to handle these situations by removing such replicas from the ISR and only re-adding them once they have caught up and therefore recovered any lost data." (Motivation)
- The last-replica-standing case turns local loss into global loss. "When the last replica in the ISR experiences an unclean shutdown and loses committed data, it will be reelected leader after starting up again, causing rejoining followers to truncate their logs and thereby removing the last copies of the committed records which the leader lost initially." (Motivation)
- The walk-through: three replicas, min ISR 2, brokers 0 and 1 drop out, broker 2 crashes and loses log, comes back as leader. "At T4, broker 2 restarts and becomes the leader. Then, the replication begins and results in global data loss." (Motivation)
- Before this, min ISR only mattered for accepting acks=all. "Notably, in the current system, min ISR is a factor only useful when accepting an ack=all request. It has no use in accepting ack=0/1 requests and the HWM advancement." (Proposed Changes)
- The new rule. "We propose to enforce that High Watermark can only advance if the ISR size is larger or equal to min.insync.replicas." (Proposed Changes)
- The high watermark is the highest offset known to be committed. "In ISR, each server maintains a high watermark, which represents the highest offset of the replicated log known to be committed / durably stored." (Proposed Changes)
- The ISR had two jobs. "It acts as a quorum for replication." / "It functions as a candidate set for the leader." (Eligible Leader Replicas)
- ELR members have the data up to the high watermark though they're out of the ISR. "At a high level, we use ELR to store the replicas that are not in ISR but guarantee to have the data at least to High Watermark." (Eligible Leader Replicas)

## Visuals worth redrawing

- The T0 to T4 timeline with brokers 0, 1, 2. Could be a small
  sequence figure.

## My notes

- The KIP doesn't say which release shipped it; the operations page
  (kafka-eligible-leader-replicas) does: 4.0, default on from 4.1.

---
id: kafka-eligible-leader-replicas
title: "Eligible Leader Replicas (Apache Kafka 4.3 operations docs)"
author: Apache Kafka project
url: https://kafka.apache.org/43/operations/eligible-leader-replicas/
kind: docs
primary: true
---

## Summary

The operations page for Eligible Leader Replicas (ELR), the first part
of KIP-966 (Kafka 4.3 docs). With the "strict min ISR" rule, the high
watermark can't advance while the ISR is below `min.insync.replicas`,
which makes some replicas outside the ISR safe to elect. Available from
4.0, on by default for new clusters from 4.1.

## Key claims

- Versions. "Starting from Apache Kafka 4.0, Eligible Leader Replicas (KIP-966 Part 1) is available for the users to an improvement to Kafka replication (ELR is enabled by default on new clusters starting 4.1)." (Overview)
- The strict min ISR rule. "the high watermark for the data partition can’t advance if the size of the ISR is smaller than the min ISR(min.insync.replicas), it makes some replicas that are not in the ISR safe to become the leader." (Overview)
- The controller keeps them in a field called Eligible Leader Replicas. "The KRaft controller stores such replicas in the PartitionRecord field called Eligible Leader Replicas." (Overview)
- Not on by default in 4.0. "The ELR is not enabled by default for 4.0. To enable the new protocol on the server, set eligible.leader.replicas.version=1." (Upgrade & Downgrade)
- With ELR on, min.insync.replicas becomes a cluster-level setting and broker-level values are removed. "The previously set min.insync.replicas value at the broker-level config will be removed." (Upgrade & Downgrade)

## Visuals worth redrawing

None.

## My notes

- The KIP (kafka-kip-966) has the "last replica standing" scenario that
  explains why this was needed.

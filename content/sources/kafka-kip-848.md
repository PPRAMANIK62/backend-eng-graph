---
id: kafka-kip-848
title: "KIP-848: The Next Generation of the Consumer Rebalance Protocol"
author: David Jacot, Guozhang Wang, Jason Gustafson (Apache Kafka)
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-848%3A+The+Next+Generation+of+the+Consumer+Rebalance+Protocol
kind: spec
primary: true
---

## Summary

The Kafka Improvement Proposal for the new consumer group protocol.
It lists what was wrong with the old one (thick clients, a group-wide
barrier on every rebalance, growing complexity) and replaces it with
a declarative target assignment that the broker's group coordinator
computes and pushes to members through heartbeats, so each member
converges on its own. GA in Kafka 4.0.

## Key claims

- GA in 4.0, with server-side assignors. "The consumer rebalance protocol with server side assignors is GA in Apache Kafka 4.0." (Status notes)
- Client-side assignors weren't implemented. "The client side assignors are not implemented yet." (Status notes)
- The old protocol relies on thick clients. "The protocol relies on thick clients." (Motivation)
- The old protocol has a group-wide barrier: one bad member disturbs everyone. "This means that a single misbehaving consumer can take down or disturb the whole group because a rebalance of the whole group is required whenever a consumer joins, leaves or fails." (Motivation)
- Rebalance cost grows with group size. "This also limits its scalability as the cost of a rebalance increases with the number of members in the group." (Motivation)
- Even cooperative rebalancing blocks offset commits during a rebalance. "Specifically, one of the deficiencies of the cooperative protocol is that offsets cannot be committed while the consumer is waiting on the rebalance to complete." (Motivation)
- Goal: a member whose assignment doesn't change isn't affected at all. "Ideally, a consumer should not be impacted at all by a rebalance if its assignment is not changed." (Design Goals)
- Same guarantee as before: at least once in the worst case. "The protocol should provide the same guarantee as the current protocol that is at-least-once in the worst case scenario and exactly-once when the hand off between members is clean." (Design Goals)
- Declarative assignment plus reconciliation loops. "The proposed rebalance protocol is based on the concept of a declarative assignment for the group and the use of reconciliation loops to drive members toward their desired assignment." (Rebalance Protocol in a Nutshell)
- The coordinator drives everything; the heartbeat carries assignments. "It is important to note that the entire rebalance process is driven by the group coordinator with this new protocol." (Rebalance Protocol in a Nutshell)
- The group has an epoch that goes up when a new assignment is needed. "The epoch is incremented by the group coordinator when a new assignment is required for the group." (Data Model, Group Epoch)

## Visuals worth redrawing

- The reconciliation: target assignment, each member's current
  assignment, and partitions revoked before they're handed to another
  member.

## My notes

- Kafka Connect isn't covered; Streams moved to KIP-1071.

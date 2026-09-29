---
id: confluent-cooperative-rebalancing-2020
title: From Eager to Smarter in Apache Kafka Consumer Rebalances
author: Sophie Blee-Goldman, Confluent
url: https://www.confluent.io/blog/cooperative-rebalancing-in-kafka-streams-consumer-ksqldb/
kind: blog
primary: true
---

## Summary

A 2020 post by a Kafka committer explaining the classic consumer group
rebalance: the JoinGroup and SyncGroup phases, the leader that computes
the assignment, and why the original "eager" protocol stops every
consumer. Then it explains incremental cooperative rebalancing (Kafka
2.4), which keeps partitions that don't move and pays for it with a
second rebalance.

## Key claims

- One broker is the group's point of contact, the group coordinator. "By nominating a single broker to act as the point of contact for the group, you can isolate all of the group management in the group coordinator and allow each consumer to focus only on the application-level work of consuming messages." (Consumer groups and the rebalance protocol)
- The group coordinator is a broker that tracks members and partitions. "The group coordinator is ultimately responsible for tracking two things: the partitions of subscribed topics and the members in the group." (Consumer groups and the rebalance protocol)
- Its one tool is the rebalance. "So when it detects such changes, the group coordinator picks up its one and only tool: the consumer group rebalance." (Consumer groups and the rebalance protocol)
- In the classic protocol, one member is the group leader and computes the assignment. "To allow the client to dictate the protocol followed by a group of non-communicating consumers, a single member is chosen to be the group leader for a rebalance, which then progresses in two phases." (Consumer groups and the rebalance protocol)
- Members never talk to each other directly. "During the entire rebalance phase, individual members never communicate with each other directly." (Consumer groups and the rebalance protocol)
- The rule: no partition owned by two consumers at once. "This includes managing the transfer of partition ownership from one consumer to another, while guaranteeing that no partition may be owned by more than one consumer in a group at the same time." (Consumer groups and the rebalance protocol)
- Eager: everyone revokes all partitions before rejoining. "Thus, to keep the protocol as simple as possible, the eager rebalancing protocol was born: each member is required to revoke all of its owned partitions before sending a JoinGroup request and participating in a rebalance." (Consumer groups and the rebalance protocol, eager protocol)
- The cost: nobody works during the rebalance, and it scales with partition count. "No member of the group can do any work for the duration of the rebalance" / "The rebalance duration scales with partition count, as each member has to revoke and then resume every partition in its assignment" (Consumer groups and the rebalance protocol, drawbacks of eager)
- Cooperative: keep your partitions, revoke only those that move, then a second rebalance hands them out. "Any member that revoked partitions then rejoins the group, triggering a second rebalance so that its revoked partitions can be assigned." (The incremental cooperative rebalancing protocol)
- The barrier isn't gone, it's moved. "The synchronization barrier hasn’t been dropped at all; it turns out that it just needed to be moved." (The incremental cooperative rebalancing protocol)
- The assignor must be sticky, or cooperative is just eager with more rebalances. "You would just end up back at the eager protocol where you started, but with more rebalances." (DIY cooperative rebalancing)
- Cooperative rebalancing arrived in Kafka 2.4. "Fortunately, he sees that Kafka 2.4 introduced a new rebalancing protocol, which he hopes will help." (Can you DIY in Kafka Streams?)

## Visuals worth redrawing

- Figure 2 (eager, everyone idle for the whole rebalance) next to
  Figure 5 (cooperative, only the moved partition pauses). Redrawn as
  one timeline figure for consumer-groups.

## My notes

- The benchmark figures in the post are throughput charts without
  numbers in the text; nothing cited from them.

---
id: eip-competing-consumers
title: Competing Consumers (Enterprise Integration Patterns)
author: Gregor Hohpe, Bobby Woolf
url: https://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html
kind: book
primary: false
---

## Summary

The pattern page from Enterprise Integration Patterns (2003), with a
later note on Kafka. Several consumers on one point-to-point channel
share its messages; Kafka gets the same effect with partitions, which
decides up front who reads what.

## Key claims

- The pattern. "Create multiple Competing Consumers on a single channel so that the consumers can process multiple messages concurrently." (solution)
- On a publish-subscribe channel it just makes copies. "multiple consumers on a Publish-Subscribe Channel just create more copies of each message." (explanation)
- Kafka assigns up front. "This design implies that the decision which consumer receives the message is made a priori, meaning consumers don't actually compete but rather read from independent channels." (Kafka example)
- An idle consumer can't help a busy one. "if one channel runs empty, the corresponding consumer won't be able to aid other consumers whose channels still have messages." (Kafka example)
- Consumers are capped by partitions. "there can't be more competing consumers in a consumer group than there are partitions on that topic." (Kafka example)

## Visuals worth redrawing

- Kafka topic of three partitions read by two consumers. (Kafka example)

## My notes

- The Kafka section predates share groups (KIP-932).

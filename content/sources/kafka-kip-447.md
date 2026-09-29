---
id: kafka-kip-447
title: "KIP-447: Producer scalability for exactly once semantics"
author: Jason Gustafson and others (Apache Kafka)
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-447%3A+Producer+scalability+for+exactly+once+semantics
kind: spec
primary: true
---

## Summary

The proposal that fixed the mismatch between consumer groups (where
partitions move between members) and transactional producers (where
each transactional.id assumed a fixed set of input partitions). It
lets one producer per consumer commit offsets inside a transaction
and be fenced by consumer group metadata (generation, member id).
Adopted in Kafka 2.6.

## Key claims

- A transactional.id allows only one active producer at a time, fenced by an epoch. "Essentially this allows us to guarantee that for a given transactional Id, there can only be one producer instance that is active and permitted to make progress at any time." (Motivation)
- The mismatch: groups move partitions, transactions assumed static inputs. "In a consumer group, ownership of partitions can transfer between group members through the rebalance protocol. For transactional producers, assignments are assumed to be static." (Motivation)
- The old workaround, one producer per input partition, didn't scale. "To preserve the static partition mapping in a consumer group where assignments are frequently changing, the simplest solution is to create a separate producer for every input partition." (Motivation)
- Transaction coordinators don't know about consumer groups. "The root of the problem is that transaction coordinators have no knowledge of consumer group semantics." (Proposed Changes)
- A new consumer is made to wait while offsets are still pending in an open transaction. "The proposed solution is to reject FetchOffset request by sending out a new exception called PendingTransactionException to new client when there is pending transactional offset commits, so that old transaction will eventually expire due to transaction timeout." (Proposed Changes)
- They call it a trade between availability and correctness. "This is a trade-off between availability and correctness." (Proposed Changes)
- The transactional offset commit now carries the group generation and member id, so a zombie gets fenced. "If one of the field is not matching correctly on server side, the client will be fenced immediately." (Fence Zombie)
- Worked zombie case: a long GC pause, a rebalance, the old client comes back. "1. Client A tries to commit offsets for topic partition P1, but haven't got the chance to do txn offset commit before a long GC." (Fence Zombie)
- Status: adopted in 2.6.0. "Current state: Adopted (2.6.0)" (Status)
- Why one producer per partition scaled badly. "Every producer come with separate memory buffers, a separate thread, separate network connections." (Motivation)

## Visuals worth redrawing

- The zombie timeline: A pauses, the group rebalances P1 to B, A wakes
  up and tries to commit, and the generation check rejects it.

## My notes

- Kafka Streams exposes this as processing.guarantee=exactly_once_v2
  (it was called exactly_once_beta in 2.6).

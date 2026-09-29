---
id: kafka-kip-932
title: "KIP-932: Queues for Kafka"
author: Andrew Schofield
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-932%3A+Queues+for+Kafka
kind: spec
primary: true
---

## Summary

The proposal that added share groups: consumers that share a topic's
records without owning partitions, with per-record acknowledgements,
locks with timeouts and delivery counts. Queue behaviour built on top
of a Kafka log. Status: accepted.

## Key claims

- Consumer groups tie consumer count to partition count. "Users of Kafka often have to “over-partition” simply to ensure they can have sufficient parallel consumption to cope with peak loads." (Motivation)
- What a queue is good for. "For example, a queue is perfect for a situation in which messages are independent work items that can be processed concurrently by a pool of applications, and individually retried or acknowledged as processing completes." (Motivation)
- It adds cooperative consumption, not a new queue object. "It does not add the concept of a “queue” to Kafka per se, but rather that introduces cooperative consumption to accommodate these queuing use-cases using regular Kafka topics." (Motivation)
- Order is lost, especially on redelivery. "The records in a share-partition can be delivered out of order to a consumer, in particular when redeliveries occur." (Proposed Changes, Ordering)
- Delivery counts stop poison records looping. "The records also have a delivery count in order to prevent unprocessable records being endlessly delivered to consumers." (Proposed Changes, delivery count)
- Each share group has its own view of a partition. "For a topic-partition subscribed in more than one share group, each share group has its own share-partition." (Concepts)
- The share-partition leader lives with the partition leader, so no fetch-from-follower. "This means that the fetch-from-follower optimization is not supported by share-groups." (Concepts)
- State is persisted by a share coordinator on an internal topic. "The share coordinator is responsible for persistence of share-group state on a new internal topic." (Concepts)
- Four record states: Available, Acquired, Acknowledged, Archived. "The record has been acquired for a specific consumer, with a time-limited acquisition lock" (Concepts, table)
- Each acquisition bumps the delivery count. "Every time that a record is acquired by a consumer in a share group, its delivery count increments by 1." (Concepts)
- At the limit (5 by default) a failed record is archived. "If the delivery count has reached the cluster's share delivery attempt limit (5 by default), the record moves into Archived state and is not eligible for additional delivery attempts." (Concepts)
- Delivery is at least once. "This means that the delivery behavior is at-least-once." (Concepts)
- The delivery count isn't exact. "These updates are not performed with exactly-once semantics, so the delivery count cannot be relied upon to be precise in all situations." (Concepts)
- Within one batch, offsets increase; across batches, no promise. "There are no guarantees about the ordering of offsets between different batches." (Ordering)
- The in-flight window between SPSO and SPEO is capped by group.share.partition.max.record.locks; there's no queue depth limit. "Unlike existing queuing systems, there's no “maximum queue depth”, but there is a limit to the number of in-flight records at any point in time." (In-flight records)
- No seeking. "The consumer group concepts of seeking and position do not apply to share groups." (Managing the SPSO and SPEO)
- A new share group starts at the latest offset by default. "By default, the SPSO for each share-partition is initialized to the latest offset for the corresponding topic-partitions." (Managing the SPSO and SPEO)
- Size-based retention can delete records not yet delivered. "it does potentially silently remove records that were eligible for delivery." (Managing the SPSO and SPEO)
- With read_committed, an open transaction stalls the group. "an open transaction blocks the progress of the share group with read_committed isolation level." (Read committed isolation level)
- Acknowledging after the lock expired fails. "If a record had reached its acquisition lock timeout and reverted to Available state, the attempt to acknowledge it will fail with org.apache.kafka.common.errors.InvalidRecordStateException" (Client programming interface)
- No transactional (exactly-once) acknowledgements in this KIP. "Finally, this KIP does not include support for acknowledging delivery using transactions for exactly-once semantics." (Future work)
- Resetting a share group is an admin action on an empty group and wipes its state. "Resetting the SPSO discards all of the in-flight record state and delivery counts." (Managing the SPSO and SPEO)
- Copying failed records to a dead-letter queue is left as future work, not part of this KIP. "An obvious future extension is the ability to copy records that failed to be delivered onto a dead-letter queue." (Future work)

## Visuals worth redrawing

- The ordering example: consumer 1 takes records 100 to 109 and
  crashes, consumer 2 finishes 110 to 119, then gets 100 to 109 again
  with delivery count 2. (Proposed Changes, Ordering)

## My notes

- Versions for preview (4.1) and production (4.2) are in kafka-upgrade-notes.

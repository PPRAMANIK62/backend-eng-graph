---
id: kafka-broker-configs
title: Broker Configs (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/configuration/broker-configs/
kind: docs
primary: true
---

## Summary

The Kafka 4.3 broker settings reference. Used for how long committed
offsets are kept, for the share group delivery attempt limit, and for
how long a partition leader remembers an idempotent producer.

## Key claims

- Committed offsets expire: after the retention period once a group is empty, or once it stops subscribing to a topic. "For subscribed consumers, committed offset of a specific partition will be expired and discarded when 1) this retention period has elapsed after the consumer group loses all its consumers (i.e. becomes empty)" (offsets.retention.minutes)
- The default is 10080 minutes (7 days). (offsets.retention.minutes, "Default: 10080")
- Share groups cap delivery attempts per record: 5 by default, 2 to 10 allowed. "The maximum number of delivery attempts for a record delivered to a share group." (group.share.delivery.count.limit; Default: 5; Valid Values: [2,...,10])
- The share group lock on a record lasts 30 seconds by default. "The record acquisition lock duration in milliseconds for share groups." (group.share.record.lock.duration.ms; Default: 30000 (30 seconds))
- producer.id.expiration.ms: a partition leader forgets an idempotent producer's ID after a day without writes by default. "The time in ms that a topic partition leader will wait before expiring producer IDs." (producer.id.expiration.ms; Default: 86400000 (1 day))
- Producer IDs can also vanish early when retention deletes their last write. "Note that producer IDs may expire sooner if the last write from the producer ID is deleted due to the topic's retention settings." (producer.id.expiration.ms)
- Keep it at least as long as the producer's delivery timeout. "Setting this value the same or higher than delivery.timeout.ms can help prevent expiration during retries and protect against message duplication" (producer.id.expiration.ms)
- The in-flight record cap per share-partition: 2000 by default, 100 to 10000 allowed. "Share-group record lock limit per share-partition." (group.share.partition.max.record.locks; Default: 2000; Valid Values: [100,...,10000])

## Visuals worth redrawing

None.

## My notes

- 10080 minutes is 7 days; the page gives only the minutes.

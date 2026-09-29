---
id: kafka-monitoring
title: Monitoring (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/operations/monitoring/
kind: docs
primary: true
---

## Summary

The Kafka 4.3 metrics reference. Used for the consumer lag metrics the
client publishes, and the docs' one-line advice on what to watch on the
consumer side.

## Key claims

- records-lag-max is measured by the consumer from its current position, not the committed offset. "The maximum lag in terms of number of records for any partition in this window. NOTE: This is based on current offset and not committed offset" (Consumer Fetch Metrics)
- Lag is published by the consumer, not the broker. "Number of messages the consumer lags behind the producer by. Published by the consumer, not broker." (Common monitoring metrics table)
- Per-partition metrics records-lag, records-lag-avg and records-lag-max exist. "The latest lag of the partition." (Consumer Fetch Metrics, per partition)
- There is also a lead metric, records-lead-min. "The minimum lead in terms of number of records for any partition in this window" (Consumer Fetch Metrics)
- The docs' advice: max lag under a threshold, and a fetch rate above zero. "For a consumer to keep up, max lag needs to be less than a threshold and min fetch rate needs to be larger than 0." (Monitoring, what to watch)

## Visuals worth redrawing

None.

## My notes

- The page names the lead metric but doesn't explain it further.

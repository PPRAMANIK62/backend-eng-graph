---
id: kafka-producer-configs
title: Producer Configs (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/configuration/producer-configs/
kind: docs
primary: true
---

## Summary

The reference for Kafka 4.3 producer settings. Used here for
enable.idempotence and the settings it requires (acks, retries,
max.in.flight.requests.per.connection), and for transactional.id.

## Key claims

- enable.idempotence writes exactly one copy of each message; without it, retries can duplicate. "When set to 'true', the producer will ensure that exactly one copy of each message is written in the stream. If 'false', producer retries due to broker failures, etc., may write duplicates of the retried message in the stream." (enable.idempotence)
- It requires at most 5 in-flight requests, retries, and acks=all. "Note that enabling idempotence requires max.in.flight.requests.per.connection to be less than or equal to 5 (with message ordering preserved for any allowable value), retries to be greater than 0, and acks must be 'all'." (enable.idempotence)
- On by default unless conflicting settings turn it off silently. "Idempotence is enabled by default if no conflicting configurations are set. If conflicting configurations are set and idempotence is not explicitly enabled, idempotence is disabled." (enable.idempotence)
- The limit of 5 comes from the broker caching only 5 batches per producer. "enabling idempotence requires the value of this configuration to be less than or equal to 5, because broker only retains at most 5 batches for each producer." (max.in.flight.requests.per.connection)
- Without idempotence, more than one in-flight request plus retries can reorder messages. "there is a risk of message reordering after a failed send due to retries (i.e., if retries are enabled); if retries are disabled or if enable.idempotence is set to true, ordering will be preserved." (max.in.flight.requests.per.connection)
- acks=all waits for all in-sync replicas. "This means the leader will wait for the full set of in-sync replicas to acknowledge the record." (acks)
- delivery.timeout.ms bounds the whole send, retries included; default 2 minutes. "An upper bound on the time to report success or failure after a call to send() returns." Default "120000 (2 minutes)" (delivery.timeout.ms)
- Without a transactional.id the producer only gets idempotence within its session. "If no TransactionalId is provided, then the producer is limited to idempotent delivery." (transactional.id)
- With a key and no explicit partition, the partition comes from a hash of the key. "If no partition is specified but a key is present, choose a partition based on a hash of the key." (partitioner.class)
- Without a key, records stick to one partition per batch. "If no partition or key is present, choose the sticky partition that changes when at least batch.size bytes are produced to the partition." (partitioner.class)
- Keys are used by default (partitioner.ignore.keys defaults to false). "If 'false', producer would choose a partition based on a hash of the key when a key is present." (partitioner.ignore.keys)
- How retries reorder when idempotence is off. "Allowing retries while setting enable.idempotence to false and max.in.flight.requests.per.connection to greater than 1 will potentially change the ordering of records because if two batches are sent to a single partition, and the first fails and is retried but the second succeeds, then the records in the second batch may appear first." (retries)
- max.in.flight.requests.per.connection defaults to 5. (max.in.flight.requests.per.connection, Default: 5)

- Explicitly enabling idempotence with conflicting settings fails. "If idempotence is explicitly enabled and conflicting configurations are set, a ConfigException is thrown." (enable.idempotence)
- More than 5 in flight risks the broker having dropped the batches a retry should match. "If the value is more than 5, previous batches may be removed on broker side." (max.in.flight.requests.per.connection)

## Visuals worth redrawing

None.

## My notes

- KIP-98 originally required max.in.flight=1 with idempotence; 4.3
  allows up to 5.

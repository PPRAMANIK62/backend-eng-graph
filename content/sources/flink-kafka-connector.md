---
id: flink-kafka-connector
title: Apache Kafka Connector (Flink)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/kafka/
kind: docs
primary: true
---

## Summary

The Kafka source and sink docs as linked from the Flink 2.3 docs. The
KafkaSink's three delivery guarantees, and how EXACTLY_ONCE rides on Kafka
transactions committed at each checkpoint.

## Key claims

- Default is no guarantee. "By default the KafkaSink uses DeliveryGuarantee.NONE." (Fault Tolerance)
- At-least-once can duplicate on restart. "messages may be duplicated when Flink restarts because Flink reprocesses old input records." (Fault Tolerance)
- Exactly-once uses a transaction per checkpoint. "In this mode, the KafkaSink will write all messages in a Kafka transaction that will be committed to Kafka on a checkpoint." (Fault Tolerance)
- Readers must read committed data. "if the consumer reads only committed data (see Kafka consumer config isolation.level), no duplicates will be seen in case of a Flink restart." (Fault Tolerance)
- Output is visible only after the checkpoint. "However, this delays record visibility effectively until a checkpoint is written, so adjust the checkpoint duration accordingly." (Fault Tolerance)
- Transaction ids must be unique per job. "Please ensure that you use unique transactionalIdPrefix across your applications running on the same Kafka cluster" (Fault Tolerance)
- The transaction timeout must cover checkpoint plus restart, or data can be lost. "data loss may happen when Kafka expires an uncommitted transaction." (Fault Tolerance)
- A timeout fences the producer. "The reason for this exception is most likely a transaction timeout on the broker side." (ProducerFencedException)
- After a timeout, pending transactions are aborted. "the (producerId, epoch) will be fenced off after a transaction timeout and all of its pending transactions are aborted" (ProducerFencedException)
- The timeout to tune is the Kafka producer's transaction.timeout.ms. "it is highly recommended to tweak Kafka transaction timeout (see Kafka producer transaction.timeout.ms)" (Fault Tolerance)

## Visuals worth redrawing

None.

## My notes

- The recommended setting is transaction.timeout.ms greater than maximum checkpoint duration plus maximum restart duration.

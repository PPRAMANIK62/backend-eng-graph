---
id: kafka-kip-1034
title: "KIP-1034: Dead letter queue in Kafka Streams"
author: Damien Gasparina, Loic Greffier, Sebastien Viale (Apache Kafka)
url: https://cwiki.apache.org/confluence/display/KAFKA/KIP-1034%3A+Dead+letter+queue+in+Kafka+Streams
kind: spec
primary: true
---

## Summary

The proposal that added a built-in dead-letter queue to Kafka Streams.
It explains why neither built-in choice for a bad record (stop the
whole app, or log and skip) works well, and adds a setting that sends
the raw record, with the error and its source position in headers, to
a DLQ topic. Status: adopted.

## Key claims

- The two built-in options: log and continue, or fail and stop (the default). "Each handler proposes two options: either to log the faulty message and continue processing, or to fail and stop KafkaStreams, the default value." (Motivation)
- Neither suits most cases. "Both out-of-the-box implementations are not suitable for most use-cases as stopping Kafka Streams due to a single faulty message might be problematic and logging and skipping is at high risk of being missed if the user does not actually check the logs." (Motivation)
- Most apps use a DLQ: the bad message goes to a separate topic. "Most applications tend to rely on the Dead Letter Queue (DLQ) pattern: in case of an issue, the faulty message that can not be processed is stored in a separate topic." (Motivation)
- Benefits: replay, alerts, metadata, separate retention. "It is easy to access or replay faulty messages." (Motivation)
- Kafka Connect already had it. "DLQ pattern is becoming a standard, it is already available out of the box in Kafka Connect." (Motivation)
- The new setting. "A new configuration will be added: errors.dead.letter.queue.topic.name." (Proposed Changes)
- The raw bytes are sent, so no serializer has to be guessed; error details go in headers. "Storing the raw key and the raw value allows us to send those raw information in the DLQ topic without having to infer the right serializer." (Proposed Changes)
- Headers carry the exception, stack trace, topic, partition and offset. "All metadata, e.g. Exceptions, StackTrace, topic, partitions and offset would be provided in the record headers by default." (Proposed Changes)
- Status: adopted. "Current state: Adopted" (Status)

## Visuals worth redrawing

None.

## My notes

- The KIP page doesn't state which release shipped it.

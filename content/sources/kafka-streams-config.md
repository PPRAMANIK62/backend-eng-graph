---
id: kafka-streams-config
title: Configuring a Streams Application (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/streams/developer-guide/config-streams/
kind: docs
primary: true
---

## Summary

The Kafka Streams configuration guide for Kafka 4.3. Used for the
processing guarantee setting, the commit interval, and the exception
handlers that decide what happens to a record that can't be
deserialized or processed: stop, skip, or send to a dead-letter topic.

## Key claims

- The processing guarantee is at_least_once (the default) or exactly_once_v2, and exactly_once_v2 needs brokers 2.5 or newer. "(for EOS version 2, requires broker version 2.5+)" (processing.guarantee)
- Offsets are committed every 30 seconds by default under at-least-once, every 100 ms under exactly-once. "The frequency in milliseconds with which to save the position (offsets in source topics) of tasks." (commit.interval.ms; default 30000 ms at-least-once, 100 ms exactly-once)
- Records that can't be deserialized go to a handler: corrupt data, a serializer bug, or an unknown type. "This can be caused by corrupt data, incorrect serialization logic, or unhandled record types." (deserialization.exception.handler)
- The handler returns FAIL (shut down) or CONTINUE (skip). "Returning FAIL will signal that Streams should shut down and CONTINUE will signal that Streams should ignore the issue and continue processing." (deserialization.exception.handler)
- LogAndContinue skips bad records so the app makes progress. "This log-and-skip strategy allows Kafka Streams to make progress instead of failing if there are records that fail to deserialize." (deserialization.exception.handler)
- LogAndFail stops. "This handler logs the deserialization exception and then signals the processing pipeline to stop processing more records." (deserialization.exception.handler)
- A custom handler can send the record to a dead-letter topic, but a manual write falls outside Streams' guarantees. "The drawback of this approach is that “manual” writes are side effects that are invisible to the Kafka Streams runtime library, so they do not benefit from the end-to-end processing guarantees of the Streams API" (deserialization.exception.handler)
- The built-in dead-letter queue (KIP-1034) exists in 4.3: the page documents StreamsConfig.ERRORS_DEAD_LETTER_QUEUE_TOPIC_NAME_CONFIG and its limits. "Dead Letter Queue (DLQ) functionality is not supported for global store/KTable." (processing.exception.handler.global.enabled, Important Notes)
- There is a matching processing.exception.handler for errors in your own code; its listed default is LogAndFailProcessingExceptionHandler. "Exception handling class that implements the ProcessingExceptionHandler interface." (processing.exception.handler)

## Visuals worth redrawing

None.

## My notes

- The parameter table on this page lists LogAndFailExceptionHandler as
  the default of the deprecated default.deserialization.exception.handler
  but LogAndContinueExceptionHandler next to the new
  deserialization.exception.handler. That looks inconsistent (KIP-1034
  says fail is the default). Not cited either way.

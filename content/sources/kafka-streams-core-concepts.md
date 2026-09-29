---
id: kafka-streams-core-concepts
title: Kafka Streams Core Concepts (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/streams/core-concepts/
kind: docs
primary: true
---

## Summary

The Kafka Streams core concepts page for Kafka 4.3. What a stream and a
processor topology are, the three notions of time (event, processing,
ingestion) and "stream time", streams vs tables, how aggregations
handle out-of-order records, windows with a grace period, and which
joins handle out-of-order data.

## Key claims

- Kafka Streams is a library, not a cluster. "Kafka Streams is a client library for processing and analyzing data stored in Kafka." (intro)
- It scales by running more instances of your application. "you only need to run additional instances of your application on multiple machines to scale up to high-volume production workloads." (intro)
- One record at a time, event-time windows with out-of-order arrival. "Employs one-record-at-a-time processing to achieve millisecond processing latency, and supports event-time based windowing operations with out-of-order arrival of records." (intro)
- What a stream is. "A stream is an ordered, replayable, and fault-tolerant sequence of immutable data records, where a data record is defined as a key-value pair." (Stream Processing Topology)
- A topology is a graph of processors joined by streams. "a processor topology is a graph of stream processors (nodes) that are connected by streams (edges)." (Stream Processing Topology)
- Source and sink processors read from and write to topics. "A source processor is a special type of stream processor that does not have any upstream processors." (Stream Processing Topology)
- Event time is when the record was created at the source, e.g. a GPS reading. "The point in time when an event or data record occurred, i.e. was originally created “at the source”." (Time)
- Processing time can lag by milliseconds or by hours (batch). "The processing time may be milliseconds, hours, or days etc. later than the original event time." (Time)
- Ingestion time is when the broker appended the record. "The point in time when an event or data record is stored in a topic partition by a Kafka broker." (Time)
- Whether record timestamps mean event time or ingestion time is a Kafka topic/broker setting. "The choice between event-time and ingestion-time is actually done through the configuration of Kafka (not Kafka Streams)" (Time)
- Stream time only moves when records arrive. "As a result, this time will only advance when a new record arrives at the processor. We call this data-driven time the stream time of the application" (Time)
- Aggregation results are a table so late records can update them. "This allows Kafka Streams to update an aggregate value upon the out-of-order arrival of further records after the value was produced and emitted." (Aggregations)
- Grace period: a record is dropped if stream time has passed window end plus grace. "a record is discarded if its timestamp dictates it belongs to a window, but the current stream time is greater than the end of the window plus the grace period." (Windowing)
- Out-of-order only means something in event time. "out-of-order records can only be considered as such for event-time." (Windowing)
- Handling disorder is a trade-off between latency, cost and correctness. "making trade-off decisions between latency, cost, and correctness." (Out-of-Order Handling)
- Stream-table joins without versioned stores don't handle out-of-order records. "if not using versioned stores, then out-of-order records are not handled" (Out-of-Order Handling)
- Sink processors write to a Kafka topic. "It sends any received records from its up-stream processors to a specified Kafka topic." (Stream Processing Topology, Sink Processor)

## Visuals worth redrawing

None needed.

## My notes

- The unversioned docs URL now redirects via script; cite the 4.3 page.

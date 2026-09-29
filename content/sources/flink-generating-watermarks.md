---
id: flink-generating-watermarks
title: Generating Watermarks (Apache Flink 2.3 DataStream docs)
author: Apache Flink project
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/event-time/generating_watermarks/
kind: docs
primary: true
---

## Summary

How a Flink job assigns event timestamps and generates watermarks (docs
version 2.3): watermark strategies, bounded out-of-orderness, idle
sources, watermark alignment, periodic vs punctuated generators,
per-Kafka-partition watermarks, and how operators process watermarks.

## Key claims

- A WatermarkStrategy bundles a timestamp assigner and a watermark generator. "The Flink API expects a WatermarkStrategy that contains both a TimestampAssigner and WatermarkGenerator." (Introduction to Watermark Strategies)
- The common strategy in the examples is bounded out-of-orderness, e.g. 20 seconds. `forBoundedOutOfOrderness(Duration.ofSeconds(20))` (Introduction to Watermark Strategies, code)
- Generate watermarks at the source when you can: it knows the partitions. "it allows sources to exploit knowledge about shards/partitions/splits in the watermarking logic." (Using Watermark Strategies)
- An idle partition holds the watermark back because the watermark is a minimum. "the watermark will be held back, because it is computed as the minimum over all the different parallel watermarks." (Dealing With Idle Sources)
- `withIdleness` marks an input idle. `.withIdleness(Duration.ofMinutes(1))` (Dealing With Idle Sources, code)
- A fast source makes downstream operators buffer its data while the slowest input holds the minimum. "All records emitted by the fast input will hence have to be buffered in the said downstream operator state, which can lead into uncontrollable growth of the operator’s state." (Watermark alignment)
- Alignment pauses sources that run too far ahead. "In order to achieve the alignment Flink will pause consuming from the source/task, which generated watermark that is too far into the future." (Watermark alignment)
- Periodic vs punctuated generators. "A periodic generator usually observes the incoming events via onEvent() and then emits a watermark when the framework calls onPeriodicEmit()." (Writing WatermarkGenerators)
- Bounded out-of-orderness logic: highest timestamp seen minus the bound (minus 1). "emit the watermark as current highest timestamp minus the out-of-orderness bound" (Writing a Periodic WatermarkGenerator, code comment)
- A watermark per event is possible but costly. "because each watermark causes some computation downstream, an excessive number of watermarks degrades performance." (Writing a Punctuated WatermarkGenerator)
- Reading several Kafka partitions interleaves them and destroys per-partition order. "multiple partitions often get consumed in parallel, interleaving the events from the partitions and destroying the per-partition patterns" (Watermark Strategies and the Kafka Connector)
- With per-partition generation, strictly ascending timestamps per partition give perfect watermarks. "if event timestamps are strictly ascending per Kafka partition, generating per-partition watermarks with the ascending timestamps watermark generator will result in perfect overall watermarks." (same)
- Operators emit everything a watermark triggers before forwarding it. "all elements produced due to occurrence of a watermark will be emitted before the watermark." (How Operators Process Watermarks)
- A two-input operator's watermark is the minimum of both inputs. "the current watermark of the operator is defined as the minimum of both of its inputs." (How Operators Process Watermarks)

## Visuals worth redrawing

- Per-Kafka-partition watermarks merged at the source operator.

## My notes

- Timestamps and watermarks are milliseconds since the Unix epoch.

---
id: flink-timely-stream-processing
title: Timely Stream Processing (Apache Flink 2.3 docs)
author: Apache Flink project
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/
kind: docs
primary: true
---

## Summary

Flink's concepts page on time (docs version 2.3). Defines processing
time and event time, what each costs, how watermarks carry event-time
progress through a Flink job, how an operator with several inputs picks
its event time, and what late elements are.

## Key claims

- Processing time is the clock of the machine running the operator. "Processing time refers to the system time of the machine that is executing the respective operation." (Notions of Time)
- Example: an hourly processing-time window in an app started at 9:15 covers 9:15 to 10:00 first. "if an application begins running at 9:15am, the first hourly processing time window will include events processed between 9:15am and 10:00am" (Notions of Time)
- Processing time is simplest and fastest but not deterministic. "It provides the best performance and the lowest latency. However, in distributed and asynchronous environments processing time does not provide determinism" (Notions of Time)
- Event time is when the event happened on the producing device, carried in the record. "Event time is the time that each individual event occurred on its producing device." (Notions of Time)
- Event-time progress depends on the data. "In event time, the progress of time depends on the data, not on any wall clocks." (Notions of Time)
- Event time costs latency waiting for out-of-order events, and you can only wait so long. "As it is only possible to wait for a finite period of time, this places a limit on how deterministic event time applications can be." (Notions of Time)
- Event-time windows hold the right records whatever the arrival order. "an hourly event time window will contain all records that carry an event timestamp that falls into that hour, regardless of the order in which they arrive, or when they are processed." (Notions of Time)
- Replaying stored data can run through weeks of event time in seconds. "another streaming program might progress through weeks of event time with only a few seconds of processing, by fast-forwarding through some historic data already buffered in a Kafka topic" (Event Time and Watermarks)
- Flink cites the Dataflow model. "Flink implements many techniques from the Dataflow Model." (Event Time and Watermarks)
- Watermark(t) definition. "A Watermark(t) declares that event time has reached time t in that stream, meaning that there should be no more elements from the stream with a timestamp t’ <= t (i.e. events with timestamps older or equal to the watermark)." (Event Time and Watermarks)
- Watermarks flow inside the stream. "Watermarks flow as part of the data stream and carry a timestamp t." (Event Time and Watermarks)
- Each parallel source generates its own watermarks. "Each parallel subtask of a source function usually generates its watermarks independently." (Watermarks in Parallel Streams)
- An operator with several inputs takes the minimum. "Such an operator’s current event time is the minimum of its input streams’ event times." (Watermarks in Parallel Streams)
- Late elements exist because some delays can't be bounded, and even bounded ones would delay windows too much. "delaying the watermarks by too much is often not desirable, because it causes too much delay in the evaluation of event time windows." (Lateness)
- Late elements defined. "Late elements are elements that arrive after the system’s event time clock (as signaled by the watermarks) has already passed the time of the late element’s timestamp." (Lateness)
- Windows can be time driven or data driven; tumbling, sliding, session. "Windows can be time driven (example: every 30 seconds) or data driven (example: every 100 elements)." (Windowing)
- You can't count all elements of an infinite stream, so aggregates are scoped by windows. "it is impossible to count all elements in a stream, because streams are in general infinite (unbounded)." (Windowing)

## Visuals worth redrawing

- In-order stream with watermarks as periodic markers; out-of-order
  stream with watermarks; parallel streams with per-operator event time.

## My notes

- Docs version 2.3 when read; "stable" URL moves with releases.

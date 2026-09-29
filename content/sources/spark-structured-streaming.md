---
id: spark-structured-streaming
title: Structured Streaming Programming Guide, APIs on DataFrames and Datasets (Spark 4.2.0 docs)
author: Apache Spark project
url: https://spark.apache.org/docs/latest/streaming/apis-on-dataframes-and-datasets.html
kind: docs
primary: true
---

## Summary

Part of Spark's Structured Streaming guide (Spark 4.2.0). Used for its
event-time windows and its watermark: the maximum event time seen minus
a threshold, which decides when window state is dropped and which late
records are ignored.

## Key claims

- A late record updates the window it belongs to by event time. "The application should use the time 12:04 instead of 12:11 to update the older counts for the window 12:00 - 12:10." (Handling Late Data and Watermarking)
- Watermarking (since Spark 2.1) exists to bound state. "in Spark 2.1, we have introduced watermarking, which lets the engine automatically track the current event time in the data and attempt to clean up old state accordingly." (same)
- The rule: keep a window ending at T while max event time seen minus the threshold is at most T. "the engine will maintain state and allow late data to update the state until (max event time seen by the engine - late threshold > T)." (same)
- Worked example with a 10-minute threshold: (12:09, cat) still counts; after the watermark reaches 12:11, (12:04, donkey) is ignored. "all subsequent data (e.g. (12:04, donkey)) is considered “too late” and therefore ignored." (same)
- Append mode writes only final counts, after the watermark passes the window. "the final counts of window 12:00 - 12:10 is appended to the Result Table only after the watermark is updated to 12:11." (same)
- On a batch Dataset, withWatermark does nothing. "Note that using withWatermark on a non-streaming Dataset is no-op." (same)
- Three window types: tumbling, sliding, session. "Spark supports three types of time windows: tumbling (fixed), sliding and session." (Types of time windows)
- The guarantee is one way: data under the threshold is never dropped; later data may or may not be. "Data delayed by more than 2 hours is not guaranteed to be dropped; it may or may not get aggregated." (Semantic Guarantees of Aggregation with Watermarking)
- In update mode, changed counts are written after every trigger. "Note that after every trigger, the updated counts (i.e. purple rows) are written to sink as the trigger output, as dictated by the Update mode." (Handling Late Data and Watermarking)

## Visuals worth redrawing

- The watermark (max event time minus 10 minutes) drawn against
  arriving records.

## My notes

- "latest" URL tracks the current Spark release; 4.2.0 when read.

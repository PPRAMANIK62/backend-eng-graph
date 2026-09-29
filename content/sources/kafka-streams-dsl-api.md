---
id: kafka-streams-dsl-api
title: Streams DSL (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/streams/developer-guide/dsl-api/
kind: docs
primary: true
---

## Summary

The Kafka Streams DSL guide for Kafka 4.3. Used here for its windowing
section (hopping, tumbling, sliding and session windows), window
retention, grace periods, and suppression for final results.

## Key claims

- Windows are tracked per record key. "Windows are tracked per record key." (Windowing)
- Window state is kept at least the retention period, one day by default. "Kafka Streams guarantees to keep a window for at least this specified time; the default value is one day and can be changed via Materialized#withRetention()." (Windowing)
- Hopping windows: size plus advance; they overlap. "A hopping window is defined by two properties: the window’s size and its advance interval (aka “hop”)." (Hopping time windows)
- Kafka Streams' hopping = other tools' sliding. "Hopping windows are sometimes called “sliding windows” in other stream processing tools. Kafka Streams follows the terminology in academic literature, where the semantics of sliding windows are different to those of hopping windows." (Hopping time windows, note)
- Hopping and tumbling windows are aligned to the epoch, start inclusive, end exclusive. "“Aligned to the epoch” means that the first window starts at timestamp zero." (Hopping time windows)
- Tumbling is hopping with advance equal to size. "A tumbling window is a hopping window whose window size is equal to its advance interval." (Tumbling time windows)
- Kafka Streams' sliding windows depend on differences between record timestamps. "two data records are said to be included in the same window if (in the case of symmetric windows) the difference of their timestamps is within the window size." (Sliding time windows)
- Sliding windows align to records and include both bounds. "Sliding windows are aligned to the data record timestamps, not to the epoch." (Sliding time windows)
- Session windows are separated by a gap of inactivity; windows of different keys differ. "Sessions represent a period of activity separated by a defined gap of inactivity (or “idleness”)." (Session Windows)
- Out-of-order records can merge or extend sessions. "Note the two out-of-order data records at t=4 (green) and t=5 (blue), which lead to a merge of sessions and an extension of a session, respectively." (Session Windows)
- By default windowed results update continuously. "In Kafka Streams, windowed computations update their results continuously." (Window Final Results)
- Some consumers need only the final result, e.g. alerts. "Common examples of this are sending alerts or delivering results to a system that doesn’t support updates." (Window Final Results)
- Grace example: a 1-hour window with 10 minutes grace accepts records for 09:00-10:00 until 10:10. "the 09:00 to 10:00 window will accept out-of-order records until 10:10, at which point, the window is closed." (Window Final Results)
- Suppression emits nothing until the window closes, then one final value. "This configures the suppression operator to emit nothing for a window until it closes, and then emit the final result." (Window Final Results)
- Kafka Streams sliding windows include both ends. "the lower and upper window time interval bounds of sliding windows are both inclusive." (Sliding time windows)

## Visuals worth redrawing

- Session merge example with the two out-of-order records.

## My notes

- The pages opened don't state a default grace period; examples use
  `ofSizeWithNoGrace` or `ofSizeAndGrace` explicitly.

---
id: flink-windows
title: Windows (Apache Flink 2.3 DataStream docs)
author: Apache Flink project
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/operators/windows/
kind: docs
primary: true
---

## Summary

Flink's reference page for windows in the DataStream API (docs version
2.3). Covers a window's lifecycle, the built-in assigners (tumbling,
sliding, session, global), window functions and their state cost,
triggers, evictors, allowed lateness, side outputs for late data, and
how watermarks fire windows.

## Key claims

- Lifecycle: created at the first element, removed when time passes the end plus allowed lateness. "a window is created as soon as the first element that should belong to this window arrives, and the window is completely removed when the time (event or processing time) passes its end timestamp plus the user-specified allowed lateness" (Window Lifecycle)
- Example: 5-minute tumbling windows with 1 minute allowed lateness; the 12:00-12:05 window is removed when the watermark passes 12:06. "it will remove it when the watermark passes the 12:06 timestamp." (Window Lifecycle)
- Keyed streams window in parallel; non-keyed windowing runs as one task. "all the windowing logic will be performed by a single task, i.e. with parallelism of 1." (Keyed vs Non-Keyed Windows)
- With a keyed stream, every element of one key goes to the same parallel task. "All elements referring to the same key will be sent to the same parallel task." (Keyed vs Non-Keyed Windows)
- Time windows: start inclusive, end exclusive. "Time-based windows have a start timestamp (inclusive) and an end timestamp (exclusive)" (Window Assigners)
- Tumbling windows: fixed size, no overlap. "Tumbling windows have a fixed size and do not overlap." (Tumbling Windows)
- Windows align with the epoch; offsets shift them, e.g. for time zones. "An important use case for offsets is to adjust windows to timezones other than UTC-0." (Tumbling Windows)
- Without an offset, hourly windows run from the top of each hour. "without offsets hourly tumbling windows are aligned with epoch, that is you will get windows such as 1:00:00.000 - 1:59:59.999, 2:00:00.000 - 2:59:59.999 and so on." (Tumbling Windows)
- Sliding windows overlap when the slide is smaller than the size, and elements go into several windows. "sliding windows can be overlapping if the slide is smaller than the window size. In this case elements are assigned to multiple windows." (Sliding Windows)
- Example: 10-minute windows sliding by 5 minutes. "you could have windows of size 10 minutes that slides by 5 minutes." (Sliding Windows)
- Session windows close after a gap of inactivity, no fixed start or end. "a session window closes when it does not receive elements for a certain period of time, i.e., when a gap of inactivity occurred." (Session Windows)
- Sessions are built by creating a window per record and merging. "a session window operator creates a new window for each arriving record and merges windows together if they are closer to each other than the defined gap." (Session Windows)
- The global window needs a custom trigger or nothing is ever computed. "the global window does not have a natural end at which we could process the aggregated elements." (Global Windows)
- ReduceFunction and AggregateFunction aggregate as elements arrive; ProcessWindowFunction buffers every element. "Flink has to buffer all elements for a window internally before invoking the function." (Window Functions)
- Default trigger for event-time windows fires when the watermark passes the window end. "This trigger simply fires once the watermark passes the end of a window." (Default Triggers of WindowAssigners)
- Allowed lateness defaults to 0; late elements are dropped. "By default, the allowed lateness is set to 0. That is, elements that arrive behind the watermark will be dropped." (Allowed Lateness)
- Within allowed lateness, a late element is added and may fire the window again. "Depending on the trigger used, a late but not dropped element may cause the window to fire again." (Allowed Lateness)
- Flink keeps window state until allowed lateness expires. "Flink keeps the state of windows until their allowed lateness expires." (Allowed Lateness)
- The global window never has late data. "When using the GlobalWindows window assigner no data is ever considered late because the end timestamp of the global window is Long.MAX_VALUE." (Allowed Lateness)
- Dropped late data can go to a side output. "Using Flink’s side output feature you can get a stream of the data that was discarded as late." (Getting late data as a side output)
- Late firings mean several results for one window; downstream must treat them as updates. "The elements emitted by a late firing should be treated as updated results of a previous computation, i.e., your data stream will contain multiple results for the same computation." (Late elements considerations)
- A late element can bridge two sessions and merge them. "In case of session windows, late firings can further lead to merging of windows, as they may “bridge” the gap between two pre-existing, unmerged windows." (Late elements considerations)
- A watermark fires every window whose max timestamp is below it, then is forwarded. "the watermark triggers computation of all windows where the maximum timestamp (which is end-timestamp - 1) is smaller than the new watermark" (Interaction of watermarks and windows)
- Sliding windows copy each element per window; tiny slides are costly. "Hence, a sliding window of size 1 day and slide 1 second might not be a good idea." (Useful state size considerations)
- Tumbling windows keep one copy of each element. "tumbling windows keep one copy of each element (an element belongs to exactly one window unless it is dropped late)." (Useful state size considerations)
- The global window is one window per key. "A global windows assigner assigns all elements with the same key to the same single global window." (Global Windows)

## Visuals worth redrawing

- The tumbling, sliding and session assigner figures (three users on a
  time axis).

## My notes

- Docs version 2.3 when read.

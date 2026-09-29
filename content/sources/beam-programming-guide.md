---
id: beam-programming-guide
title: Apache Beam Programming Guide
author: Apache Beam project
url: https://beam.apache.org/documentation/programming-guide/
kind: docs
primary: true
---

## Summary

Beam's programming guide. Beam is the open-source SDK that grew out of
the Dataflow model and runs on several engines. Used for sections 8
(windowing, watermarks and late data) and 9 (triggers, accumulation
modes, allowed lateness).

## Key claims

- Grouping on an unbounded collection needs a window or a trigger, or the pipeline fails at construction. "your pipeline will generate an error upon construction and your job will fail." (8.1 Windowing basics)
- Without a window everything is in one global window. "Note that even if you don’t set a windowing function, there is still a window – all elements in your PCollection are assigned to a single global window." (8.1.2)
- Built-in windows: fixed, sliding, per-session, global, calendar-based. (8.2, list)
- Session windows are per key. "Session windowing applies on a per-key basis and is useful for data that is irregularly distributed with respect to time." (8.2.3)
- Watermark and late data, with a 30 seconds of lag example: the first 5-minute window closes at 5:30; a record arriving at 5:34 with timestamp 3:38 is late. "If a data record arrives at 5:34, but with a timestamp that would put it in the 0:00-4:59 window (say, 3:38), then that record is late data." (8.4)
- The watermark is the system's notion of when a window's data has arrived. "Beam tracks a watermark, which is the system’s notion of when all data in a certain window can be expected to have arrived in the pipeline." (8.4)
- Allowed lateness propagates to derived collections. "that allowed lateness propagates forward to any subsequent PCollection derived from the first PCollection you applied allowed lateness to." (8.4.1)
- Trigger kinds: event time, processing time, data-driven, composite. (9, list)
- Setting a trigger means choosing an accumulation mode: accumulating or discarding fired panes. "When you specify a trigger, you must also set the window’s accumulation mode." (9.4.1)
- Triggers trade completeness, latency and cost. "Completeness: How important is it to have all of your data before you compute your result?" (9)
- Default trigger: fire at the watermark, then on each late element; with default windowing allowed lateness is 0, so it fires once. "if you are using both the default windowing configuration and the default trigger, the default trigger emits exactly once, and late data is discarded." (9.1.1)
- The only data-driven trigger is element count; an under-filled count trigger can wait forever. "only 32 elements arrive, those 32 elements sit around forever." (with AfterCount(50)) (9.3)
- Accumulating vs discarding: firing every 3 elements on 5, 8, 3, 15, 19, 23, 9, 13, 10 gives [5, 8, 3] then all six then all nine when accumulating; three separate groups when discarding. (9.4.1.1, 9.4.1.2)

## Visuals worth redrawing

- Fixed, sliding and session window figures (8.2).

## My notes

- The page is unversioned; Beam SDK names (AfterWatermark,
  AfterProcessingTime, AfterCount) as read.

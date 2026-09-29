---
id: akidau-streaming-102-2016
title: "Streaming 102: The world beyond batch"
author: Tyler Akidau (Google)
url: https://www.oreilly.com/radar/the-world-beyond-batch-streaming-102/
kind: blog
primary: true
---

## Summary

The second post (2016). It walks one example (ten integer scores summed
per key) through the four questions of the Dataflow model: what
(transformations), where (event-time windows), when (watermarks and
triggers) and how (accumulation modes), with allowed lateness as the
way to bound state. It shows why watermarks alone are too slow or too
fast, and how early, on-time and late firings fix both.

## Key claims

- The four questions. "What results are calculated?", "Where in event time are results calculated?", "When in processing time are results materialized?", "How do refinements of results relate?" (Recap and roadmap)
- A watermark is a statement about input completeness in event time. "A watermark with a value of time X makes the statement: “all input data with event times less than X have been observed.”" (Recap and roadmap)
- Watermark as a function from processing time to event time. "you can think of the watermark as a function, F(P) -> E, which takes a point in processing time and returns a point in event time." (When: watermarks)
- Perfect watermarks leave no late data. "in such a case, there is no such thing as late data; all data are early or on time." (When: watermarks)
- Heuristic watermarks use what's known about the inputs and are sometimes wrong. "Heuristic watermarks use whatever information is available about the inputs (partitions, ordering within partitions if any, growth rates of files, etc.) to provide an estimate of progress that is as accurate as possible." (When: watermarks)
- Too slow: one late value holds back all later windows; nearly seven minutes to the first result for the [12:02, 12:04) window with a perfect watermark. "it takes nearly seven minutes from the time the first value in the window occurs until we see any results for the window whatsoever." (When: watermarks)
- Too fast: the heuristic watermark passed the first window early and it emitted 5 instead of 14. "resulting in an incorrect output value of 5 instead of 14." (When: watermarks)
- You can't get both low latency and correctness from completeness alone. "You simply cannot get both low latency and correctness out of a system that relies solely on notions of completeness." (When: watermarks)
- A trigger decides when a window's output happens; each output is a pane. "Each specific output for a window is referred to as a pane of the window." (When: triggers)
- Trigger signals: watermark progress, processing time, element counts, punctuations; composites: repeat, and, or, sequence. (When: triggers, lists)
- Early firings with the perfect watermark cut time to first output from almost seven minutes to three and a half. "time-to-first-output is reduced from almost seven minutes down to three and a half" (When: triggers, after Figure 7)
- The late 9 is folded in immediately as a corrected pane of 14. "when the value of 9 shows up late, we immediately incorporate it into a new, corrected pane with value of 14." (same)
- Allowed lateness bounds how late a record may be and so how long state lives. "placing a bound on how late any given record may be (relative to the watermark) for the system to bother processing it; any data that arrive after this horizon are simply dropped." (When: allowed lateness)
- In the example with a 1-minute horizon, the late 6 is accepted and updates the result to 11; the 9 arrives beyond the horizon and is dropped. "The 6 is late, but still within the allowed lateness horizon, so it gets incorporated into an updated result with value 11. The 9, however, arrives beyond the lateness horizon, so it is simply dropped." (When: allowed lateness)
- With a perfect watermark the right allowed lateness is zero. "an allowed lateness horizon of zero seconds will be optimal." (same)
- Global aggregates over a small key space don't need a horizon. "As long as the number of keys remains manageably low, there’s no need to worry about limiting the lifetime of windows via allowed lateness." (same)
- Accumulation mode one, discarding. "Every time a pane is materialized, any stored state is discarded." (How: accumulation)
- Accumulation mode two, accumulating. "each successive pane builds upon the previous panes." (How: accumulation)
- Accumulation mode three, accumulating and retracting: emit the new value plus a retraction of the old one. "“I previously told you the result was X, but I was wrong. Get rid of the X I told you last time, and replace it with Y.”" (How: accumulation)
- Table 1 for the [12:02, 12:04) window: discarding emits 7, 7, 8; accumulating emits 7, 14, 22; accumulating and retracting emits 7, then 14 and -7, then 22 and -14. Summing accumulating panes gives 51, not 22. "giving you an incorrect total sum of 51." (How: accumulation, Table 1)
- The modes get more expensive in that order. "the modes in the order presented (discarding, accumulating, accumulating & retracting) are each successively more expensive in terms of storage and computation costs." (How: accumulation)
- Retractions help when sessions merge, because one new value replaces several old windows. "When dynamic windows (e.g., sessions, which we’ll look at more closely below) are in use, the new value may be replacing more than one previous window, due to window merging." (How: accumulation)
- The retraction API was not finished when written. "retractions are still in development for Google Cloud Dataflow at this point, so the naming in this API is somewhat speculative" (How: accumulation)
- Processing-time windowing is right for usage monitoring and wrong for event-time questions. "processing time windowing is absolutely the wrong approach to take" (When/Where: Processing-time windows)
- Google proposed an Apache incubator project for the Dataflow SDK. "we (Google) have today submitted a proposal to the Apache Software Foundation to create an Apache Dataflow incubator project" (Introduction)
- Two ways to get processing-time windows in an event-time model: triggers on a global window, or ingress time as event time. "Assign ingress times as the event times for data as they arrive, and use normal event time windowing from there on." (same)
- Event-time windows give the same final results whatever the arrival order. "the final results for the four windows remain the same: 14, 22, 3, and 12" (Event-time windowing)
- The what question is the one classic batch answers. "It’s also essentially the question answered by classic batch processing." (Recap and roadmap)
- Table 1 pane contents: pane 1 holds [7], pane 2 [3, 4], pane 3 [8]. "Consider the three panes for the second window in Figure 7 (the one with event time range [12:02, 12:04))." (How: accumulation, Table 1)
- Example of needing no lateness horizon: all-time visits grouped by browser family. "computing the total number of visits to your site over all time, grouped by Web browser family" (When: allowed lateness)

## Visuals worth redrawing

- Figure 5: the skew diagram with the watermark as the wandering line.
- Figure 6: perfect vs heuristic watermark side by side on the same data.
- Figure 8: allowed lateness horizon ticks and the dropped 9.
- Table 1: the accumulation modes side by side.

## My notes

- Table 1 arithmetic: the accumulating panes 7 + 14 + 22 add to 43, but
  the post says 51 (which is the sum of all ten inputs). The point, that
  summing accumulating panes double counts, holds either way; don't
  quote the 51.
- Retraction API names were "somewhat speculative" when written;
  check Beam's current names before quoting any API.

---
id: akidau-dataflow-model-2015
title: "The Dataflow Model: A Practical Approach to Balancing Correctness, Latency, and Cost in Massive-Scale, Unbounded, Out-of-Order Data Processing"
author: Tyler Akidau, Robert Bradshaw, Craig Chambers, Slava Chernyak, Rafael J. Fernández-Moctezuma, Reuven Lax, Sam McVeety, Daniel Mills, Frances Perry, Eric Schmidt, Sam Whittle (Google)
url: https://www.vldb.org/pvldb/vol8/p1792-Akidau.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2015 paper behind Google Cloud Dataflow and, later, Apache
Beam. It argues that unbounded data never becomes complete, so a
processing model should let you trade correctness, latency and cost
instead of waiting for completeness. It splits a pipeline into four
questions (what, where in event time, when in processing time, how
refinements relate), defines windowing as assign-then-merge so session
windows work, adds triggers and three refinement modes, and shows the
same pipeline on batch, micro-batch and streaming engines.

## Key claims

- The four questions. "What results are being computed." / "Where in event time they are being computed." / "When in processing time they are materialized." / "How earlier results relate to later refinements." (section 1, contributions list)
- Stop assuming the data will become complete. "We as a field must stop trying to groom unbounded datasets into finite pools of information that eventually become complete" (abstract)
- The name refers to Cloud Dataflow's model, built on FlumeJava and MillWheel. "We use the term “Dataflow Model” to describe the processing model of Google Cloud Dataflow [20], which is based upon technology from FlumeJava [12] and MillWheel [2]." (footnote 1)
- It separates the logic from the engine. "Separates the logical notion of data processing from the underlying physical implementation" (section 1, contributions list)
- Nothing magical: what was impractical stays impractical. "there is nothing magical about this model." (section 1)
- Bounded/unbounded describe data; batch/streaming describe engines. "we prefer the terms unbounded/bounded over streaming/batch, because the latter terms carry with them an implication of the use of a specific type of execution engine." (1.1)
- Batch engines have long processed unbounded data by repeated runs. "unbounded datasets have been processed using repeated runs of batch systems since their conception" (1.1)
- Windowing is needed for grouping on unbounded data but not for element-wise work. "windowing is required for some operations (to delineate finite boundaries in most forms of grouping: aggregation, outer joins, time-bounded operations, etc.), and unnecessary for others (filtering, mapping, inner joins, etc.)." (1.2)
- Fixed windows are sliding windows whose size equals the period. "Fixed windows are really a special case of sliding windows where size equals period." (1.2)
- Fixed windows are sometimes phase-shifted per key to spread load. "For the sake of spreading window completion load evenly across time, they are sometimes unaligned by phase shifting the windows for each key by some random value." (1.2)
- Sessions are defined by a timeout gap and are unaligned (per key). "Sessions are windows that capture some period of activity over a subset of the data, in this case per key. Typically they are defined by a timeout gap." (1.2)
- Tuple-based windows are time windows over a logical clock. "this is essentially time-based windowing over a logical time domain where elements in order have successively increasing logical timestamps." (1.2)
- A count trigger of two gives sums of pairs adjacent in processing time. "each containing the sum of two adjacent (by processing time) data." (2.4, Figure 9)
- Event time vs processing time; no assumption of synchronized clocks. "Processing Time, which is the time at which an event is observed at any given point during processing within the pipeline" and "Note that we make no assumptions about clock synchronization within a distributed system." (1.3)
- Event time doesn't change; processing time keeps changing. "Event time for a given event essentially never changes, but processing time changes constantly for each event as it flows through the pipeline" (1.3)
- Watermarks are usually heuristic because the system can't know about offline devices. "For most real-world distributed data sets, the system lacks sufficient knowledge to establish a 100% correct watermark." (footnote 6)
- Window assignment copies an element into each window it belongs to. "window assignment creates a new copy of the element in each of the windows to which it has been assigned." (2.2.1)
- Windowing is split into AssignWindows and MergeWindows so sessions can merge at grouping time. "windowing can be broken apart into two related operations" (2.2)
- Watermarks can be too fast (late data) or too slow (one slow datum holds back the whole pipeline). "They are sometimes too fast, meaning there may be late data that arrives behind the watermark." and "the watermark can be held back for the entire pipeline by a single slow datum." (2.3)
- Watermarks alone are insufficient. "we postulate that watermarks alone are insufficient." (2.3)
- Lambda sidesteps completeness with a later batch answer. "it simply provides the best low-latency estimate of a result that the streaming pipeline can provide, with the promise of eventual consistency and correctness once the batch pipeline runs" (2.3)
- The batch answer is only right if the input was complete when it ran. "output from the batch job is only correct if input data is complete by the time the batch job runs" (footnote 10)
- If the data changes later, the batch job has to run again. "if data evolve over time, this must be detected and the batch jobs re-executed." (footnote 10)
- Windowing is about event time; triggering is about processing time. "Windowing determines where in event time data are grouped together for processing." and "Triggering determines when in processing time the results of groupings are emitted as panes." (2.3)
- Three refinement modes: discarding, accumulating, accumulating and retracting. Accumulating is what Lambda effectively does. "is effectively the mode used in Lambda Architecture systems" and "are then overwritten in the future by the results from the batch pipeline." (2.3)
- Retractions are needed when a later grouping re-keys earlier results. "Retractions are necessary in pipelines with multiple serial GroupByKeyAndWindow operations" (2.3)
- The default trigger fires when the watermark passes the window, and Repeat handles late data. "The Repeat call in the trigger is used to handle late data; should any data arrive after the watermark, they will instantiate the repeated watermark trigger, which will fire immediately since the watermark has already passed." (2.4)
- Using arrival time as event time gives a perfect watermark and no late data. "the system has perfect knowledge of the event times in flight, and thus can provide perfect (i.e. non-heuristic) watermarks, with no late data." (2.4)
- Batch semantics are a streaming run with the watermark held at the start, then jumped to infinity. "one can get identical semantics to classic batch by running the data through a streaming system with watermarks progressed in this manner." (2.4)
- On a micro-batch engine each round emits every window whose contents changed. "We would thus end up with a new watermark for every micro-batch round, and corresponding outputs for all windows whose contents had changed since the last round." (2.4)
- Design principle. "Never rely on any notion of completeness." (3.2)
- Lambda fails on simplicity: two systems. "Lambda Architecture [25] systems can achieve many of the desired requirements, but fail on the simplicity axis on account of having to build and maintain two systems." (1, introduction)
- A large log-join pipeline had a separate FlumeJava batch version for backfills. "has a separate FlumeJava batch implementation used for large scale backfills." (3.3.1)
- A team running weak streaming plus nightly MapReduce found users stopped trusting the fast numbers. "They found that customers stopped trusting the weakly consistent results over time" (3.3.1)
- They rebuilt around strong consistency. "reimplemented their system around strong consistency so they could provide reliable, low latency results." (3.3.1)
- The backfill pipeline was the first motivation for one model across engines. "A much nicer setup would be to have a single implementation written in a unified model that could run in both streaming and batch mode without modification." (3.3.1)
- Sliding windows are a size plus a slide period. "Sliding windows are defined by a window size and slide period, e.g. hourly windows starting every minute." (1.2)
- For sessions, AssignWindows gives each element a window reaching one timeout past its timestamp. "The sessions implementation of AssignWindows puts each element into a single window that extends 30 minutes beyond its own timestamp" (2.2.2, Figure 4 example with a 30-minute timeout)
- The weak-consistency pipeline was paired with a nightly MapReduce. "one MillWheel customer ran their streaming pipeline in weak consistency mode, with a nightly MapReduce to generate truth." (3.3.1)

## Visuals worth redrawing

- Figure 1: fixed, sliding and session windows across three keys.
- Figure 2: time-domain skew, event time on X, processing time on Y,
  actual watermark wandering below the ideal diagonal.
- Figures 5 to 14: ten values plotted in both time domains, with
  outputs for each windowing and triggering choice.

## My notes

- Section 3.1 says implementation details are elided; the paper is
  about the model, not the engine.
- The numbers in the examples (sums of 51, 14, 22) are illustrative
  inputs, not measurements.

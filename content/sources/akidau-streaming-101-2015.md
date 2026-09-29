---
id: akidau-streaming-101-2015
title: "Streaming 101: The world beyond batch"
author: Tyler Akidau (Google)
url: https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/
kind: blog
primary: true
---

## Summary

The first of two long posts (2015) by a MillWheel and Cloud Dataflow
engineer. It pins down the words (streaming = an engine built for
infinite data; unbounded vs bounded data), argues that a streaming
system needs only correctness and tools for reasoning about time to
match batch, explains event time vs processing time and the skew
between them, and sorts the ways of processing unbounded data into
time-agnostic, approximation, processing-time windows and event-time
windows.

## Key claims

- Streaming means an engine, nothing more. "a type of data processing engine that is designed with infinite data sets in mind. Nothing more." (Terminology: What is streaming?)
- Unbounded vs bounded data. "I will refer to infinite “streaming” data sets as unbounded data, and finite “batch” data sets as bounded data." (Terminology)
- Micro-batch engines count as streaming engines. "this definition includes both true streaming and micro-batch implementations." (Terminology)
- Batch engines have long processed unbounded data by running again and again. "repeated runs of batch engines have been used to process unbounded data since batch systems were first conceived" (Terminology)
- Lambda in one line: two pipelines, one fast and inaccurate, one slow and correct. "you run a streaming system alongside a batch system, both performing essentially the same calculation." (On the greatly exaggerated limitations of streaming)
- Lambda's cost is two pipelines plus a merge. "you need to build, provision, and maintain two independent versions of your pipeline, and then also somehow merge the results from the two pipelines at the end." (same section)
- On Kappa. "I’m not convinced that notion itself requires a name, but I fully support the idea in principle." (same section)
- Streaming as a superset of batch. "I would argue that well-designed streaming systems actually provide a strict superset of batch functionality." (same section)
- Correctness needs consistent, checkpointed state and exactly-once. "strong consistency is required for exactly-once processing, which is required for correctness" (same section, Correctness)
- Event time and processing time. "Event time, which is the time at which events actually occurred." and "Processing time, which is the time at which events are observed in the system." (Event time vs. processing time)
- The skew varies with the sources, the engine and the hardware. "the skew between event time and processing time is not only non-zero, but often a highly variable function of the characteristics of the underlying input sources, execution engine, and hardware." (same section)
- Skew causes: shared resources and software. "Shared resource limitations, such as network congestion, network partitions, or shared CPU in a non-dedicated environment." and "Software causes, such as distributed system logic, contention, etc." (Event time vs. processing time)
- Skew causes include the data itself, e.g. a plane full of phones coming out of airplane mode. "a plane full of people taking their phones out of airplane mode after having used them offline for the entire flight" (same section)
- The skew is the pipeline's latency. "That skew is essentially the latency introduced by the processing pipeline." (Figure 1 caption text)
- Processing-time windows put event-time data in the wrong windows. "some of your event time data are going to end up in the wrong processing time windows" (same section)
- Event-time windows have a completeness problem. "how can you determine when you’ve observed all the data for a given event time X? For many real-world data sources, you simply can’t." (same section)
- Four approaches to unbounded data. "Time-agnostic", "Approximation", "Windowing by processing time", "Windowing by event time" (Unbounded data — streaming)
- Filtering is time-agnostic; the order and skew don't matter. "Since this sort of thing depends only on a single element at any time, the fact that the data source is unbounded, unordered, and of varying event time skew is irrelevant." (Filtering)
- An outer join forces a timeout, which is a window. "you have to introduce some notion of a timeout, which introduces an element of time." (Inner-joins)
- An inner join just buffers each side until the match arrives. "Upon seeing a value from one source, you can simply buffer it up in persistent state; you only need to emit the joined record once the second value from the other source arrives." (Inner-joins)
- Approximation algorithms such as top-N and streaming k-means. "approximation algorithms, such as approximate Top-N, streaming K-means, etc." (Approximation algorithms)
- Their error bounds often assume in-order data. "If those error bounds are predicated on data arriving in order, they mean essentially nothing when you feed the algorithm unordered data with varying event-time skew." (Approximation algorithms)
- Processing-time windows are right for monitoring. "Calculating a rate of these requests for the purpose of detecting outages is a perfect use of processing time windowing." (Windowing by processing time)
- Processing-time windows need no late-data handling. "there is no need to be able to deal with “late” data in any way when windowing by processing time." (same section)
- A mobile app can upload days late. "data might arrive with an event time skew of minutes, hours, days, weeks, or more." (same section)
- A healthy source can turn skewed when a transcontinental link degrades. "suddenly a portion of your input data may start arriving with much greater skew than before." (same section)
- Event-time windows cost buffering and completeness. "Event time windows have two notable drawbacks due to the fact that windows must often live longer (in processing time) than the actual length of the window itself" (Windowing by event time)
- Incremental aggregates keep buffering small. "many useful aggregations do not require the entire input set to be buffered (e.g., sum, or average)" (same section, Buffering)
- Sessions via repeated batch runs get split across batches. "you often end up with sessions that are split across batches" (Unbounded data — batch, Sessions)
- The batch/stream efficiency gap comes from bundling and shuffle. "The efficiency delta between batch and streaming is largely the result of the increased bundling and more efficient shuffle transports found in batch systems." (footnote 1)
- Tuple-based windows are a form of processing-time windowing. "tuple-based windowing is essentially a form of processing-time windowing where elements are assigned monotonically increasing timestamps as they arrive at the system." (footnote 2)

## Visuals worth redrawing

- Figure 1: event time (X) vs processing time (Y), the ideal diagonal
  and a lagging real line; the horizontal gap is the skew.
- Figures 9 and 10: the same data windowed by processing time and by
  event time, with arrows showing items landing in different windows.
- Figure 8: fixed, sliding and session windows over three keys.

## My notes

- Written in 2015 about Dataflow; the Beam names changed later.

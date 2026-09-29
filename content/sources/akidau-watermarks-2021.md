---
id: akidau-watermarks-2021
title: "Watermarks in Stream Processing Systems: Semantics and Comparative Analysis of Apache Flink and Google Cloud Dataflow"
author: Tyler Akidau, Edmon Begoli, Slava Chernyak, Fabian Hueske, Kathryn Knight, Kenneth Knowles, Daniel Mills, Dan Sotolongo
url: https://www.vldb.org/pvldb/vol14/p3135-begoli.pdf
kind: paper
primary: true
---

## Summary

A VLDB 2021 paper by people who built watermarks in MillWheel, Cloud
Dataflow, Beam and Flink. It defines a watermark formally, lists what
watermarks are for (a single correct answer, noticing missing data,
non-incremental work, garbage collection, health monitoring), compares
them with ordered processing, timestamp frontiers and punctuations,
explains how they are generated, propagated and consumed, and compares
Flink's in-band design with Dataflow's out-of-band aggregator, with
latency measurements from one Beam pipeline.

## Key claims

- Definition. "Watermarks represent the temporal completeness of an out-of-order data stream." (section 8, summary)
- Watermark as a lower bound on unreceived event times. "At every moment in processing time, the watermark yields a timestamp that represents a lower bound of the event times of all unreceived events." (section 2)
- Seeing watermark tw means everything at or before tw has arrived. "if a watermark of tw is observed, the observer knows that all records with event times less than or equal to tw have been received, and all future records will have event times greater than tw ." (section 2)
- Three properties: monotonicity, conformance, liveness. "Monotonicity: w is monotone. It must never “move backwards”." and "Liveness: w(t) has no upper bound." (section 2)
- Watermark lag can be unbounded unless event delay is bounded. "These properties require that watermarks eventually make forward progress, but the watermark lag, t −w(t), can be unbounded." (section 2)
- Conformant/non-conformant = perfect/heuristic. "Conformant and non-conformant watermarks are sometimes referred to as “perfect” and “heuristic” watermarks, respectively" (footnote 1)
- Alerting needs one correct answer, not a stream of updates. "the system must generate a single notification containing a single correct answer, not a stream of notifications containing incrementally refined partial results." (2.1.1)
- Dip detection needs to tell a real dip from lagging input. "how is the computation to distinguish between a real dip in event rate and lagging inputs in the event source?" (2.1.1)
- Kafka Streams' grace period is a non-conformant watermark for final results. "Kafka Streams [17, 22] uses a non-conformant watermark (referred to as a “grace period”) to provide final results." (2.1.1)
- Obsolescence: watermarks tell you when state can be dropped. "it allows for stateful computation over infinite streams without infinite storage." (2.1.2)
- Spark and Kafka Streams use max event time seen minus a fixed delta. "track a high watermark of the max event time ever seen within a stream, then offset that by a static allowed-lateness delta to determine the trailing horizon of timestamps which may be discarded." (2.1.2)
- Watermarks work as a health signal: find the first delayed one. "it’s often possible to precisely locate an issue in the pipeline by finding the first delayed watermark." (2.1.3)
- Ordered processing costs every event the wait for stragglers. "the result is a latency penalty for all events as they wait for stragglers to arrive." (3.1)
- Timely Dataflow's frontiers generalise watermarks to several time dimensions. "The Timely Dataflow model [16] generalizes watermarks to track progress along multiple time domains simultaneously." (3.3)
- Punctuations say no more elements matching a predicate will come; general but hard. "It is a mechanism for a streaming operator to declare that no more elements will be produced that match some predicate." and "Unfortunately, the generality of punctuations is also their weakness." (3.4)
- The authors' verdict. "we believe watermarks sit in the proverbial sweet spot of cost/benefit tradeoffs for approaches to reasoning about completeness in unbounded stream processing." (3.5)
- Watermarks were first "heartbeats", then MillWheel's watermarks. "This approach was originally presented as “heartbeats” by Srivistava and Widom [18], then as “watermarks" in MillWheel [1], Dataflow [2], and Flink [6]." (3.2)
- A straggler can delay downstream work that doesn't depend on it. "when stragglers do occur in a pipeline they can delay downstream computation arbitrarily even if those computations do not specifically depend on the stragglers." (3.2)
- Monotonic per-partition timestamps allow a conformant watermark: min over partitions of the max timestamp seen, minus one. "it’s possible to compute a conformant watermark as the min of the largest timestamp thus far encountered in each partition, minus one, to account for the possibility of the next event having an equal timestamp to the current max." (4.3)
- Late data comes from non-conformant watermarks. "When using a non-conformant watermark, the system may introduce elements older than the watermark. We refer to these elements as late data." (4.3)
- Bounded disorder heuristic: watermark = t − ∆. "the node advances its watermark to t − ∆, where ∆ is a configurable constant." (4.3)
- Both fixed heuristics are problematic in practice. "they introduce unnecessary delays when the system is running well and not enough delay when problems arise, yielding large amounts of late data." (4.3)
- Better: model the lag distribution and pick a quantile. "The node fits a statistical model (e.g. a Gamma distribution) to the histogram and delays the watermark by the duration corresponding to a quantile chosen according to application requirements (e.g. 0.999)." (4.3)
- An aggregating node must hold its output watermark back to the oldest incomplete window it buffers. "the aggregation operator holds the watermark to the min of its input watermarks and the start times for all incomplete hourly windows buffered in state." (4.4)
- Consumption is through watermark timers; windows are the high-level pattern. "We call such callbacks watermark timers by analogy with traditional, real-time timers." (4.5)
- Dropping late data: approximate but simpler; monitor how much you drop. "the next best thing to having accurate results is knowing their inaccuracy." (4.5)
- Recomputing on late data costs resources and complexity; most frameworks leave incrementalization to you. "most, including Beam, Kafka Streams, Flink, and Spark rely on programmers to ensure the program is correctly incrementalized." (4.5)
- Flink carries watermarks in the data stream; Dataflow uses an out-of-band aggregator. "Flink represents watermarks as metadata inside the data streams themselves, while Cloud Dataflow computes and propagates watermarks out-of-band via a separate aggregator node." (5.2)
- A Flink node's watermark is the minimum of its input edges. "The watermark of a node is computed by taking its smallest input-edge watermark." (5.2.2)
- Flink doesn't persist watermarks; after a restart they start low again. "Flink’s processing nodes do not persist watermark metadata." (5.2.2)
- After a restart a Flink node's watermark starts at a low constant until every input sends a new one. "When a node is restarted to recover from a failure, its watermark is set to a low-valued constant." (5.2.2)
- On a Flink failure the whole pipeline rewinds to the last checkpoint and watermarks restart from the beginning of time. "Watermarks are reset to the beginning of time and must be propagated once more from sources before processing can resume." (5.2.4)
- Cloud Dataflow keeps advancing watermarks for sources with no data. "a source node that currently has no data to deliver will publish a watermark which continues to track current system time." (5.2.4)
- Idle Flink sources can declare themselves idle. "Flink source nodes can declare themselves as idle, which means that their output channels are temporarily excluded when subsequent nodes update their watermark." (5.2.4)
- One slow node holds back everything downstream. "a single overloaded or bottle-necked node can obstruct the progress of all downstream nodes in the graph." (5.2.4)
- Unaligned source watermarks grow state; both systems throttle fast sources. "Unaligned source watermarks can lead to a significant increase in state size to buffer in-flight data." (5.2.4)
- Measured (Beam 2.27.0, Flink 1.12.1, 1-second windows, conformant watermark, 1000 messages/s): each shuffle adds about 100 ms median in Flink, 500-1000 ms in Cloud Dataflow. "In Flink, each shuffle stage adds approximately 100 ms median latency." and "In Cloud Dataflow, each shuffle stage adds approximately 500-1000 ms median latency." (6.1)
- The timeout heuristic. "Another common heuristic is the timeout, where the watermark is advanced to t after waiting for some constant duration to elapse after the first element with event time t is introduced." (4.3)

## Visuals worth redrawing

- Figures 1 and 2: a game-score pipeline with Kafka and Pub/Sub
  sources, per-partition watermarks, and a late (Blue, 4, 11:59) event.

## My notes

- The measurements are of watermark propagation only, on GCE
  n1-standard-2 workers, not end-to-end latency.

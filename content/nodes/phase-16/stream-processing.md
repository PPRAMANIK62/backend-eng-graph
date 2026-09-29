---
id: stream-processing
title: Stream processing
depth: deep
phase: 16
note: >-
  Computing over events as they arrive, without end.
needs: [log-based-messaging]
leads_to: [event-time-vs-processing-time, lambda-vs-kappa, stateful-stream-processing]
compare_with: [batch-processing, backpressure]
---

# Stream processing

Stream processing runs a computation continuously over events as they
arrive, and never finishes, because the input never ends. A
[[batch-processing|batch job]] reads a finished pile of data, computes,
writes an answer and exits. A stream job has no last record, so it has
to answer questions a batch job never faces: when is a count ready,
what if an event shows up an hour late, and what happens to the running
totals when the machine dies.

## Same question, two kinds of input

Say you want page views per URL.

The batch way: at the end of the day, read the day's log files, group
the views by URL, count each group, write the counts somewhere, stop.
The input had a start and an end. The job could read all of it before
answering, and it could sort it however it liked.

The stream way: every page view is written as an event to a
[[log-based-messaging|log]] such as a Kafka topic. A job reads each
event as it lands and adds one to that URL's counter. It keeps going,
all day and the next day, and the counts are always nearly up to date.

The difference is in the data, and it's worth naming carefully.
Data with a start and an end is **bounded**. Data that keeps growing
with no defined end is **unbounded**. You can't wait for all of an
unbounded input, because it's never complete. "Batch" and "streaming"
are better kept for the engines: a streaming engine is one designed
with unbounded data in mind, and that includes micro-batch engines
that cut the stream into small batches under the hood. The two cross
over. People have processed unbounded data with a batch engine run
again and again (every hour, every night) for as long as batch engines
have existed, and a streaming engine can read a bounded input too. Flink
treats a bounded stream as the batch case and switches to algorithms
built for fixed-size data when it knows the input ends.

## A stream job is a graph

A stream job is a graph of operators with records flowing along the
edges. Kafka Streams calls it a processor topology: source processors
read from topics, processors in the middle transform records one at a
time, and sink processors write the results to a topic.

![A stream job drawn left to right. A Kafka topic with three partitions feeds a source operator. Records go through a stateless parse and filter step, then are re-partitioned by key so every record for the same URL reaches the same parallel task. Each of those tasks holds per-key state (running counts per URL) and emits results to a sink: an output topic or a table. The stateless part needs nothing but the record in hand; the keyed part keeps state that must survive a crash.](img/stream-processing-job-graph.svg)

*A page-view count as a stream job: stateless steps, a shuffle by key, then keyed state.*

The input is almost always a log, and that matters more than it looks.
A log keeps records after they're read, in order within each
partition, so a job can fall behind and catch up at its own pace, or
rewind to an earlier [[offsets-and-commits|offset]] and read history
again. The log also sits between producers and the job as a buffer, so
one slow job doesn't push [[backpressure]] all the way back to the
services writing the events.

Where the graph runs differs by tool. Kafka Streams is a client library
you embed in your own service, and it scales by running more copies of
that service. Flink is a separate cluster that runs your job on YARN,
Kubernetes or its own machines. The model underneath is the same.

## Stateless steps are easy

Some steps look at one record and forget it. Filtering out bot
traffic, parsing JSON, renaming a field, looking up a country from an
IP address. These don't care that the input is endless, unordered or
late: each record is handled on its own, and the answer for it
doesn't depend on any other record.

An inner join of two streams is nearly as easy. Keep each side's
records in a buffer until the matching record from the other side
shows up, then emit the pair. Nothing in that logic is about time.

## Grouping needs state, and a boundary

Counting views per URL is different. The job has to remember a running
count for every URL: that's **state**, and it lives inside the job.
To spread the work over many machines, the job
[[partitioning|partitions]] records by key, so all views of one URL go
to the same task and that task owns the URL's counter. Google's
MillWheel made this the core of the programming model: your code runs
in the context of one key and can only see that key's state. How that
state is stored, and how it moves when the job scales up or down, is
[[stateful-stream-processing]].

Grouping also runs into the endless input. A batch count finishes
when the input does. A stream count over "all views ever" never
finishes, so it has no moment to emit a final answer. The usual fix is
to cut the stream into pieces by time, "views per URL per five
minutes", and emit a result per piece. Those pieces are
[[windowing|windows]]. An outer join hits the same wall: to emit "no
match" you have to decide how long to wait for one, and that timeout
is a window too.

## Time is the hard part

Once you window by time, you have to say whose time. Every event has
the time it happened, and a later time when your job sees it. These
drift apart: a phone offline on a flight uploads hours of events at
once, a congested link delays one region, a job restarts and replays
from an offset. That gap is [[event-time-vs-processing-time]], and it
changes from minute to minute.

If you window by arrival time, the job is simple and never has to wait,
but a view that happened at 12:03 and arrived at 12:09 lands in the
wrong window. If you window by when things happened, the counts are
right, but now you have to guess when a window has everything it will
get. A stream processor makes that guess with [[watermarks]], and
decides what to do with the stragglers under [[late-data]].

So there are roughly four ways to deal with unbounded data:

- **Ignore time.** Filtering, mapping, inner joins. Works on any engine.
- **Approximate.** Approximate top-N, streaming k-means and similar
  algorithms. Cheap and built for endless input, but the results are
  estimates, and their error bounds often assume the data arrives in
  order.
- **Window by processing time.** Right for monitoring the system itself,
  like requests per second to detect an outage.
- **Window by event time.** Right whenever the question is about when
  things happened: billing, user behaviour, anything you'd want to
  replay and get the same answer.

## Correct answers need state that survives a crash

A stream job holding counts in memory loses them when it crashes.
Starting again from the latest offset skips events; starting from the
beginning double counts. For a stream job to be trusted like a batch
job, its state has to be saved consistently with its position in the
input, so that after a crash it resumes as if nothing happened. That's
what [[exactly-once-processing]] means inside a stream processor, and
the snapshot algorithm Flink uses for it is
[[distributed-snapshots]]. Getting the *output* exactly once as well
is [[transactional-sinks]].

This guarantee has a price you can see in numbers. MillWheel's paper
(2013) measured a single-stage pipeline on 200 CPUs: with exactly-once
and strong productions turned off, median record delay was 3.6 ms and
the 95th percentile 30 ms. With both on, the median rose to 33.7 ms
and the 95th percentile to 93.8 ms. Pipelines whose work is
idempotent anyway can turn the guarantee off and keep the lower
latency.

## Where it gets tricky

**"Streaming" isn't a synonym for "approximate".** For years, stream
processors gave fast but lossy answers and a batch job fixed them
later, which is where [[lambda-vs-kappa|the Lambda Architecture]] came
from. That was a property of the engines of the time. A streaming
engine with consistent state and event-time windows can give the same
answers as a batch job over the same data.

**Semantically a superset, not free.** The argument that a good
streaming engine can do everything batch can do is about what it can
express. Batch engines still process a finished input more cheaply,
because they can bundle work into bigger chunks and use more efficient
[[shuffle|shuffles]]. That's why Flink switches to batch-style
algorithms when it knows the input is bounded.

**Replays must give the same answer.** A job windowed by processing
time gives different results each time it runs over the same history,
because arrival times differ. Windowed by event time, a replay can
move through weeks of event time in seconds and still compute the same
windows. If you'll ever reprocess (and you will, after a bug fix),
that decides the choice for you.

**Falling behind is normal, and visible.** A job that's slower than
its input doesn't lose data when the input is a log; it just drifts
further from the head. Watch [[consumer-lag]] and the job's watermark,
not just CPU.

## What this means when you build

- Read from a replayable log, and keep enough retention to reprocess
  what you'd want to reprocess.
- Separate the stateless part of the job from the keyed, stateful part.
  The stateless part scales freely; the stateful part is where crashes,
  rescaling and hot keys hurt.
- Decide early whether your question is about when events happened or
  when you saw them, and window accordingly.
- Don't run a stream job whose state isn't checkpointed consistently
  with its input position unless wrong counts after a crash are fine.
- Plan for late events, duplicates and replays from the start. In a
  stream they happen every day.

## Further reading

- [Streaming 101: The world beyond batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/), Tyler Akidau, 2015. The vocabulary (bounded, unbounded, streaming engine), the four ways to process unbounded data, and why correctness plus tools for time are what streaming needs.
- [What is Apache Flink? Architecture](https://flink.apache.org/what-is-flink/flink-architecture/), Apache Flink project. Bounded vs unbounded streams in a few paragraphs.
- [Kafka Streams Core Concepts](https://kafka.apache.org/43/streams/core-concepts/), Apache Kafka 4.3 docs. Streams, processor topologies, source and sink processors, and time in a library-style stream processor.
- [Timely Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/), Apache Flink 2.3 docs. Processing time vs event time in Flink's words, and replaying weeks of event time from Kafka in seconds.
- [MillWheel: Fault-Tolerant Stream Processing at Internet Scale](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/41378.pdf), Akidau et al., Google, 2013. Per-key state, exactly-once delivery, the low watermark, and measured latency with and without exactly-once.
- [The Log: What every software engineer should know about real-time data's unifying abstraction](https://web.archive.org/web/2025/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying), Jay Kreps, 2013. Why a retained, ordered log is the right input for stream jobs.

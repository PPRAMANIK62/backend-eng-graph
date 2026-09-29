---
id: watermarks
title: Watermarks
depth: deep
phase: 16
note: >-
  How a stream processor decides a window is complete.
needs: [windowing]
leads_to: [late-data, dataflow-model]
compare_with: []
---

# Watermarks

A watermark is a stream processor's running claim about its input: "I
have now seen every event with an event time up to T." It's how a job
decides that an event-time window is complete and can emit its result,
and when it's safe to throw that window's state away. Most of the time
it's an educated guess, and understanding how the guess is made, and
how it goes wrong, explains most of the odd latency and missing data
in stream jobs.

## The question a window can't answer alone

Say you count logins per five-minute [[windowing|window]] of
[[event-time-vs-processing-time|event time]]. Events arrive out of
order: a login from 12:03 can show up after one from 12:07. So when is
the 12:00 to 12:05 window done?

- Emit when the wall clock reads 12:05, and every straggler from a slow
  phone or a congested region is missed.
- Wait "a while longer", and you have to say how long, for every
  window, for every source.
- Wait until you're sure, and with an endless input you never are.

The same question comes up whenever the answer depends on data that
*isn't* there. The running example in Google's MillWheel paper spots
dips in search traffic: if queries from a country stop arriving, is
that a real dip, or are the queries just delayed on the wire? You can only tell if you
know how far the input has certainly got.

A watermark is that knowledge, carried through the job as a
timestamp.

## What a watermark says

At any moment, an operator's watermark W is a statement: every event
with an event time at or before W has arrived, and anything still to
come is later than W. Equivalently, it's a lower bound on the event
times of everything not yet seen. It's a promise about data still to
come.

Three properties make it useful:

- **It only moves forward.** A watermark never goes backwards, even if
  an older event does show up.
- **It bounds what's unseen.** A watermark that keeps this promise is
  called *perfect* (or conformant). One that sometimes breaks it is
  *heuristic*.
- **It keeps advancing.** Eventually it passes any given time, or no
  window would ever close.

Plot a job's watermark against the wall clock and you get the line in
the [[event-time-vs-processing-time]] chart: event-time progress as
a function of processing time. The gap between the wall clock and the
watermark is the watermark's *lag*, and nothing in the definition keeps
it small.

## Where the number comes from

The watermark starts at the sources, and the quality of the whole thing
depends on what the source knows.

**When the source knows, it can be perfect.** Suppose web servers each
write login events to Kafka with timestamps that only ever increase
within a partition. Then the reader knows that once it has seen 12:06
on a partition, nothing earlier will come on it. The watermark is the
smallest of the per-partition maximums, minus one (the next event might
share the current maximum). Flink can compute this per Kafka partition
inside its source, and with strictly ascending timestamps per partition
the result is a perfect watermark. MillWheel's log-file readers did
something similar: the watermark was the oldest creation time among
files not yet fully read.

**Otherwise it's a guess.** Phones that go offline, services that
retry, events that pass through several systems first: the source
can't know what's still on its way. The common guess is **bounded
out-of-orderness**: assume nothing arrives more than a fixed delay
behind the newest event seen, and set the watermark to that newest
event time minus the delay. Flink's examples use 20 seconds. Another
guess is a **timeout**: advance to T some fixed
time after first seeing an event at T.

The people who built these systems report that both simple guesses
behave badly in practice. The fixed delay is too long when things are
healthy, adding latency for nothing, and too short during an incident,
so lots of data turns up late. What worked better was modelling the
source: keep a rolling histogram of how late events arrive, fit a
distribution to it, and hold the watermark back by the delay that
covers, say, 99.9% of events. It adapts as the source's behaviour
changes.

Whatever the method, a heuristic watermark will sometimes pass a time
before all events for it have arrived. Those events are
[[late-data]].

## How it moves through the job

A job is a graph, and every operator needs its own watermark. The rule
is simple: an operator's watermark is the **minimum** of the
watermarks of its inputs. It can't claim more completeness than its
slowest input.

![Three Kafka partitions feed a window operator counting logins in 5-minute windows. Partition 0 has watermark 12:06, partition 1 has 12:07, partition 2 lags at 12:03. The operator's watermark is the minimum, 12:03, so its window from 12:00 to 12:05 stays open and nothing is emitted yet, even though two of the three partitions are past 12:05. A note says that when partition 2's watermark reaches 12:06, the operator's watermark becomes 12:06, the window fires, its count is sent downstream, and only then is the watermark forwarded.](img/watermarks-propagation.svg)

*One slow partition holds back the whole operator.*

An operator that holds data can hold the watermark back further. A
window operator still buffering the 12:00 to 12:05 window mustn't tell
downstream operators that 12:05 is complete until it has sent that
window's result. MillWheel defined it this way: an operator's watermark
is the minimum of its own oldest unfinished work and the watermarks of
everything feeding it.

Engines carry the watermark differently. Flink sends watermarks as
special messages inside the data stream, in order with the records.
Google Cloud Dataflow has each worker report to a central aggregator,
which computes each stage's watermark and sends it on.

## What it's used for

The watermark drives **watermark timers**: "call me when the
watermark reaches T". A window is the standard case. When the
watermark passes the end of a window, the window fires, its result is
emitted, and only then is the watermark forwarded, so everything
downstream sees the result before it sees the claim that the window's
time is complete.

The same signal answers three needs:

- **Readiness.** Emit one final answer: an alert, a bill, a count
  for a system that can't take updates. Or decide a dip is real.
- **Cleanup.** Once the watermark (plus any allowed lateness) passes a
  window, its state can be deleted. Without this, a job with an endless
  input would need endless storage.
- **Health.** Every stall anywhere in the job shows up as a stuck
  watermark downstream of it. The first delayed watermark in the graph
  points at the problem.

## Too slow and too fast

A watermark fails in two directions, and a job built on the watermark
alone feels both.

**Too slow.** Because it's a minimum, one lagging input holds back
everything after it. A late or slow event on one partition delays every
window on every key. In one worked example with a perfect watermark, a
single late value meant nearly seven minutes passed between the first
event of a window and any output for it. A partition with no traffic
at all is worse: it sends no events, so its watermark never moves, and
the job stalls. Flink lets a source mark a partition idle so it's left
out of the minimum; Dataflow keeps an empty source's watermark tracking
the current time instead.

Lag also builds up per stage. MillWheel's paper (2013) measured a
three-stage pipeline on 200 CPUs: the first stage's watermark ran
1.8 s behind real time, and each later stage added less than 200 ms. A
later comparison (Beam 2.27.0, Flink 1.12.1) found each shuffle stage
added about 100 ms of median watermark latency in Flink and about 500
to 1000 ms in Cloud Dataflow.

**Too fast.** A heuristic watermark can pass the end of a window while
events for it are still on their way. The window fires with what it
has. In the same worked example, the first window emitted 5 when the
right answer was 14, because a value of 9 arrived after the watermark
had passed.

You can't fix both by tuning the delay. A longer delay makes it slower;
a shorter one makes it faster. The fix is to stop treating the
watermark as the only moment a window may speak: emit early,
speculative results before the watermark arrives, and corrected ones
after late data. That's the idea behind triggers in the
[[dataflow-model]].

## Where it gets tricky

**Event time only moves with data.** A watermark isn't a timer on the
wall clock. If input stops, bounded-out-of-orderness watermarks stop
too, and windows that are "obviously" over never fire.

**Fast sources cost memory.** The flip side of "slowest input wins": a
source racing ahead fills downstream windows that can't close yet, and
state grows. Flink can pause sources whose watermark runs too far
ahead of the rest.

**Restarts reset it.** Flink doesn't persist watermarks. After a
failure the job rewinds to its last checkpoint, every watermark starts
again from the beginning of time, and nothing can fire until new
watermarks have flowed from the sources again.

**The boundary is off by one between tools.** Flink defines
watermark T as "no more events at or before T"; some descriptions say
"before T". It matters when events land exactly on a window edge.

**Watermarks are one answer among several.** Some systems require
input in order and sort it with a buffer first, which makes every
event wait for the slowest. Punctuations mark "nothing more matching
this predicate" in the stream, which is more general but hard to
implement across operators. Timely Dataflow's frontiers track several
time dimensions at once. The watermark's builders argue it's the best
cost for most jobs, since it lets work proceed out of order while still
giving a completeness signal.

## What this means when you build

- Generate watermarks at the source, per partition, where the most is
  known about order. Generating them later, after partitions have been
  interleaved, loses that information.
- Handle idle partitions explicitly, or one quiet partition will stall
  the job.
- Choose the out-of-orderness delay from measured lateness of your
  source, not a round number, and revisit it.
- Graph watermark lag per operator. It's the best single health signal
  a stream job has.
- Count events that arrive behind the watermark. Knowing how wrong you
  are is the next best thing to being right.

## Further reading

- [MillWheel: Fault-Tolerant Stream Processing at Internet Scale](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/41378.pdf), Akidau et al., Google, 2013. Where the low watermark comes from, its recursive definition, injectors, and measured watermark lag.
- [Watermarks in Stream Processing Systems](https://www.vldb.org/pvldb/vol14/p3135-begoli.pdf), Akidau, Begoli, Chernyak, Hueske, Knight, Knowles, Mills, Sotolongo, 2021. The formal definition, how watermarks are generated, propagated and consumed, the problems with simple heuristics, and Flink vs Cloud Dataflow.
- [Streaming 102: The world beyond batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-102/), Tyler Akidau, 2016. Perfect vs heuristic watermarks on a worked example, and why watermarks are too slow and too fast.
- [Generating Watermarks](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/event-time/generating_watermarks/), Apache Flink 2.3 docs. Watermark strategies, bounded out-of-orderness, idle sources, alignment and per-partition watermarks in practice.
- [Timely Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/), Apache Flink 2.3 docs. Watermarks flowing through parallel streams and the minimum-of-inputs rule.

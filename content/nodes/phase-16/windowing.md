---
id: windowing
title: Windows
depth: short
phase: 16
note: >-
  Tumbling, sliding and session windows.
needs: [event-time-vs-processing-time]
leads_to: [watermarks]
compare_with: [window-functions]
---

# Windows

A window cuts an endless stream into finite pieces by time, so that a
grouping (a count, a sum, an outer join) has a point where it can
finish and emit an answer. Three shapes cover most jobs: tumbling,
sliding and session windows. Which one you pick decides what your
numbers mean and how much state the job holds.

## Why grouping needs a window

A [[stream-processing|stream job]] that counts page views per URL "over
all time" never has a moment when the count is final. Steps that look
at one record at a time (filter, map, an inner join) don't have this
problem. Grouping does: aggregations, outer joins and anything bounded
by time all need a finite set to work on. A window supplies it, and
grouping by key turns into grouping by key *and* window.

Windows are almost always defined on time, and usually on
[[event-time-vs-processing-time|event time]]: "views per URL for each
five minutes in which they happened".

## Three shapes

![Three panels on a shared 20-minute event-time axis, each showing the same events for two users. Tumbling: four 5-minute boxes side by side, each event inside exactly one box. Sliding: 10-minute windows starting every 5 minutes, drawn in two staggered rows so they overlap; each event falls in two windows. Session: separate boxes per user that start at a user's event and end after 3 quiet minutes, so user A and user B get different, uneven windows.](img/windowing-shapes.svg)

*The same events cut three ways.*

**Tumbling** (also called fixed) windows have one size and don't
overlap: 12:00 to 12:05, 12:05 to 12:10, and so on. Every event lands in
exactly one window. Engines line them up with the epoch, so hourly
windows run 1:00:00.000 to 1:59:59.999, then 2:00:00.000 onward; the
start is included and the end isn't. An offset shifts them, for
instance to make daily windows match a time zone other than UTC.

**Sliding** windows have a size and a slide (also called the period or
advance): 10-minute windows that start every 5 minutes. When the slide
is smaller than the size they overlap, and each event is copied into
every window that covers it, here two. A tumbling window is just a
sliding window whose slide equals its size. Sliding windows suit a
rolling figure like "the last ten minutes, updated every five".

**Session** windows follow activity instead of the clock. A session is
a burst of events from one key, ended by a gap with no events longer
than a timeout. They have no fixed start or length, and each key gets
its own, so user A's sessions don't line up with user B's. Engines
build them by giving every event its own small window, from its
timestamp to timestamp plus the gap, and merging windows that overlap.

There's also the **global** window: one window for everything, per
key. It never ends, so it never emits unless you add your own rule for
when to fire.

## What a window costs

Each open window is state the job keeps per key. How much depends on
the function you run over it. A sum, count or other fold that can be
updated one element at a time keeps a single value per window. A
function that needs to see every element at once (a median, say, or
your own code over the full list) makes the engine buffer every
element until the window fires.

Overlap multiplies this. With sliding windows each element is stored
once per window it belongs to, so a one-day window sliding every
second is a bad idea.

A window can't be thrown away the moment its end passes, either. The
job keeps it until it's confident no more events for it will arrive,
which is what [[watermarks]] decide, plus any extra time you allow for
[[late-data]].

## Where it gets tricky

**"Sliding" means two different things.** In Flink and in the Dataflow
model, a sliding window is size plus slide, as above. Kafka Streams calls that a
**hopping** window, and uses "sliding window" for something else: a
window defined by the difference between two records' timestamps,
lined up with the records rather than the clock, with both ends
included. Check which one a tool means before you port a job.

**Sessions merge, and late events can merge them later.** An event
that shows up late can fall in the gap between two sessions and join
them into one. Anything downstream that already saw two sessions now
has to deal with one.

**Count windows are processing-time windows in disguise.** "Every 100
events" sounds like a window over data, but which 100 depends on the
order they arrived in: a window of two holds two events that were
neighbours in arrival order. It's really a window over a clock that
ticks once per arrival.

**Aligned windows all close at once.** Every key's 12:00 to 12:05
window ends at the same moment, so the work of emitting them arrives
in a burst. One fix is to shift each key's windows by a random offset,
which spreads the load.

**Window without a key and you lose parallelism.** In Flink, windowing
a stream that isn't keyed runs all the windowing on a single task.

**Not the same as SQL's [[window-functions]],** which share the name.

## What this means when you build

- Tumbling for per-period reports, sliding for rolling figures,
  sessions for user activity.
- Prefer aggregations that fold incrementally, so a window is one value
  and not a buffer of events.
- Keep the slide-to-size ratio sensible; every overlap is another copy.
- Key the stream before you window it.

## Further reading

- [Windows](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/operators/windows/), Apache Flink 2.3 docs. Tumbling, sliding, session and global windows, how sessions merge, window functions and what each costs in state.
- [Streams DSL](https://kafka.apache.org/43/streams/developer-guide/dsl-api/), Apache Kafka 4.3 docs. Hopping vs sliding in Kafka Streams' terms, session merges from out-of-order records.
- [The Dataflow Model](https://www.vldb.org/pvldb/vol8/p1792-Akidau.pdf), Akidau et al., Google, 2015. Aligned vs unaligned windows, sessions as assign-then-merge, and count windows as time windows over a logical clock.

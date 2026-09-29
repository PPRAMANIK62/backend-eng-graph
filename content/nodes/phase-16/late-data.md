---
id: late-data
title: Late data
depth: short
phase: 16
note: >-
  Events that arrive after their window closed: drop them, send them
  aside, or update the result.
needs: [watermarks]
leads_to: [dataflow-model]
compare_with: []
---

# Late data

Late data is an event that arrives after the job's
[[watermarks|watermark]] has already passed its event time, so after
its window was declared complete. You have three choices for it: drop
it, send it somewhere else, or reopen the window and update the result.
Whichever you choose, you also have to decide how long a finished
window's state is kept around in case more stragglers turn up.

## How an event ends up late

Take five-minute windows over [[event-time-vs-processing-time|event
time]]. The watermark passes 12:05, so the job fires the 12:00 to 12:05
window and emits its count. Then a phone that was offline uploads an
event stamped 12:03.

This only happens when the watermark is a guess. A perfect watermark
never passes a time while events for it are still coming, so there's
nothing late, only early or on time. Almost every real source has a
heuristic watermark, so almost every real job sees late events. The
question is what to do with them.

## Three things you can do with it

![A timeline along the job's watermark for one window, 12:00 to 12:05, with 1 minute of allowed lateness. Before the watermark reaches 12:05 the window is open and an event stamped 12:02 is simply counted. At 12:05 the on-time result fires. Between 12:05 and 12:06, an event stamped 12:03 arrives late; it is added and the window fires again with an updated result. At 12:06 the window's state is removed, and an event stamped 12:04 that arrives after that is too late: it is dropped or sent to a side output.](img/late-data-horizon.svg)

*One window's life, measured against the watermark.*

**Drop it.** The simplest choice, and the default in Flink, where
allowed lateness starts at zero. The window's state can be
deleted the moment it fires. The result is approximate, and how
approximate depends on timing, but nothing downstream ever sees a
second answer for the same window.

**Update the result.** Keep the window's state for a while after it
fires, and fold late events in. This bound is **allowed lateness**:
how far behind the watermark an event may be and still count. In
Flink, with five-minute windows and one minute of allowed lateness,
the 12:00 to 12:05 window is created by its first event and removed
when the watermark passes 12:06. A late event before that is added and
the window fires again (a *late firing*). After it, the event is
dropped. In one worked example with a one-minute horizon, a late 6 was
folded into an updated result of 11, while a later-arriving 9 was past
the horizon and thrown away.

The cost is that downstream now gets several results for one window.
It has to treat the later ones as corrections: overwrite by window key
in a table, or remove duplicates. How successive results relate
(each one complete, each one a delta, or a correction that retracts
the last) is the "how" question of the [[dataflow-model]].

**Send it aside.** Flink can route events that were too late to a
separate *side output* stream instead of discarding them silently.
You can store them, count them, and fold them in later with a
[[backfills|backfill]].

## The same idea under other names

**Kafka Streams** calls it a **grace period**: a window keeps accepting
out-of-order records until its end plus the grace, then closes. With
one-hour windows and ten minutes of grace, the 09:00 to 10:00 window
accepts records until 10:10. By default Kafka Streams emits an updated
result for every change; if the consumer can only take one answer (an
alert, a system that can't be updated), `suppress` holds output back
until the window closes and then emits once.

**Spark Structured Streaming** folds allowed lateness into its
watermark: you give a threshold, and the watermark is the latest event
time seen minus that threshold. A window ending at T keeps its state
until the watermark passes T. With a ten-minute threshold, a record
stamped 12:09 still updates its windows, and once the watermark reaches
12:11, a record stamped 12:04 is ignored. In update mode Spark writes
revised counts as they change; in append mode it writes each window
once, after the watermark passes it.

## Where it gets tricky

**Lateness is measured against event-time progress, not the wall
clock.** In Spark it's relative to the newest event time seen. If
input stops, that clock stops, and windows wait.

**Spark's bound only works one way.** Data less late than the threshold
is guaranteed to be counted. Data later than that is *not* guaranteed
to be dropped: it may or may not be counted, depending on timing. Don't
build logic that relies on stragglers being excluded.

**Late events can merge sessions.** A late event that lands in the gap
between two [[windowing|session windows]] joins them into one, so
downstream sees two earlier sessions replaced by a new one.

**Sometimes you need no bound at all.** With a perfect watermark the
right allowed lateness is zero. And a global count over a small, fixed
set of keys (visits per browser family, say) has few windows to keep,
so there's no need to expire them.

**Every hour of allowed lateness is an hour of state.** Every window
stays in memory or on disk for its length plus the lateness. Long
horizons on many keys add up.

## What this means when you build

- Decide per output whether it needs one final answer or can take
  updates. Final answers: suppress or append mode, and accept that late
  events are lost. Updates: allowed lateness, and a sink that
  overwrites by window.
- Pick the allowed lateness from how late your events actually arrive,
  and weigh it against the state it costs.
- Don't drop late events silently. Send them to a side output or at
  least count them, so you know how wrong the results are.

## Further reading

- [Windows](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/operators/windows/), Apache Flink 2.3 docs. Allowed lateness, late firings, side outputs for late data, and how late events merge sessions.
- [Streaming 102: The world beyond batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-102/), Tyler Akidau, 2016. Late firings and allowed lateness on a worked example, and when no lateness bound is needed.
- [Structured Streaming Programming Guide](https://spark.apache.org/docs/latest/streaming/apis-on-dataframes-and-datasets.html), Apache Spark 4.2.0 docs. Spark's watermark as a lateness threshold, update vs append mode, and its one-way guarantee.
- [Streams DSL](https://kafka.apache.org/43/streams/developer-guide/dsl-api/), Apache Kafka 4.3 docs. Grace periods and suppression for final results.

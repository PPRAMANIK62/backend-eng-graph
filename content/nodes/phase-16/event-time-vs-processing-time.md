---
id: event-time-vs-processing-time
title: Event time vs processing time
depth: short
phase: 16
note: >-
  When it happened vs when you saw it.
needs: [stream-processing]
leads_to: [windowing]
compare_with: [clock-skew]
---

# Event time vs processing time

Every event in a [[stream-processing|stream job]] has two times: when
it happened, its **event time**, and when the job sees it, its
**processing time**. They're never equal, and the gap between them
keeps changing. Which one your windows use decides whether your results
describe what happened in the world or what happened in your pipeline.

## One purchase, several clocks

Someone taps "buy" at 12:03 on a phone in a train tunnel. The phone
stamps the event 12:03 and queues it. At 12:09 the train leaves the
tunnel and the phone uploads it. At 12:10 your job reads it from Kafka.

- **Event time** is 12:03. It's set once, by the device that produced
  the event, and travels inside the record. It never changes.
- **Processing time** is 12:10: the clock of the machine running the
  operator, at the moment it handles the record. It's different at
  every stage of the pipeline, and different again if you replay.
- Kafka adds a third, **ingestion time**: when the broker appended the
  record to the topic. Whether a Kafka record's timestamp means event
  time or ingestion time is a setting on the broker or topic, not in
  the stream job.

## The gap moves

If you plot, for a running job, how far event time has got against
the clock on the wall, the ideal is a straight diagonal: every event
processed the instant it happens. Real jobs lag behind it, and the
distance wanders.

![A chart with event time on the horizontal axis and processing time on the vertical axis. A dashed diagonal marks the ideal, where each event is processed the moment it happens. A solid line for a real pipeline starts behind the diagonal (less event time done at each moment), comes close to it in the middle, then falls behind again. The horizontal distance between the two lines at any moment is the skew between event time and processing time.](img/event-time-vs-processing-time-skew.svg)

*Event-time progress against processing time. The horizontal gap is the skew, and it changes as the job runs. Adapted from Tyler Akidau, "Streaming 101: The world beyond batch", figure 1 (2015).*

That gap is effectively the latency your pipeline adds, and three kinds
of thing move it:

- **Shared resources.** Network congestion, a network partition, CPU
  shared with other work.
- **Software.** The distributed system's own logic, and contention.
- **The data itself.** A plane full of passengers turning off airplane
  mode at once, uploading a flight's worth of events together.

Mobile data can arrive minutes, hours, days or weeks after it
happened. And a source that's nearly in order when healthy can turn
badly skewed when, say, a long-distance link degrades and one region's
events start arriving late.

## What each one buys you

**Processing time** is the simplest. There's nothing to coordinate and
nothing to wait for, so it gives the lowest latency. The job knows
exactly when a processing-time window is complete (the clock passed
its end), so there's no such thing as a late event. In Flink, an
hourly processing-time window in a job started at 9:15 first covers
9:15 to 10:00, then 10:00 to 11:00. The catch: results depend on how
fast records happened to arrive. Run the same input twice, or through
an outage, and you get different windows.

That makes processing time exactly right when the question is about
the pipeline or the service as it runs. "Requests per second right now"
to spot an outage is a processing-time question.

**Event time** gives answers about the world. An hourly event-time
window holds every record stamped with that hour, whatever order they
arrived in and whenever they're processed. That's what billing, user
behaviour and anything you'll ever want to replay need. Replaying
stored history from Kafka, a job can move through weeks of event time
in a few seconds of processing and still compute the same windows.

The price is waiting. With events out of order, the job has to hold a
window open for stragglers, buffer its data meanwhile, and at some
point decide it has seen enough. It can only wait a finite time, so
completeness is always a judgment call. That judgment is what
[[watermarks]] make, and the stragglers that arrive after it are
[[late-data]]. How you cut events into those windows is
[[windowing]].

Kafka Streams names one more idea here: **stream time**, its clock
driven by the timestamps of the records themselves. It only moves
forward when a new record arrives, not when the wall clock ticks.

## Where it gets tricky

**Event time trusts the producer's clock.** The event time is
whatever timestamp the device or service wrote into the record. A
phone set to the wrong time puts its events in the wrong window, and
the stream processor has no way to know. Machine clocks drift and
jump; see [[clock-skew]].

**Ingestion time is a halfway house.** It's stamped once, at the
broker, so it doesn't change when you replay, but it records when the
event reached Kafka, not when it happened. For the phone in the tunnel,
it says 12:09.

**"Real time" hides the choice.** A dashboard labelled "last five
minutes" can mean the last five minutes of events or the last five
minutes of arrivals. After an outage those differ a lot, so say which.

## What this means when you build

- Put the event time into the event where it's created, and carry it
  through every step.
- Window by event time for questions about users, money or anything
  you'll replay. Window by processing time for watching the system.
- Expect the gap to spike during incidents and backfills, and design
  for it rather than for the healthy average.

## Further reading

- [Streaming 101: The world beyond batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-101/), Tyler Akidau, 2015. The two time domains, what moves the skew between them, and why processing-time windows give wrong answers to event-time questions.
- [Timely Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/time/), Apache Flink 2.3 docs. What each notion of time costs in a real engine, and the replay example.
- [Kafka Streams Core Concepts](https://kafka.apache.org/43/streams/core-concepts/), Apache Kafka 4.3 docs. Event, processing and ingestion time as Kafka defines them, and stream time.

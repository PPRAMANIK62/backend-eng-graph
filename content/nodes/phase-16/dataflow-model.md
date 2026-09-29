---
id: dataflow-model
title: The Dataflow model
depth: short
phase: 16
note: >-
  One model for batch and streaming: what is computed, where in event
  time, when results come out, and how later results refine earlier
  ones.
needs: [watermarks, late-data]
leads_to: []
compare_with: [lambda-vs-kappa]
---

# The Dataflow model

The Dataflow model is a way to describe a data pipeline so that the
same description works on bounded and unbounded data, and on a batch,
micro-batch or streaming engine. It splits every pipeline into four
questions: **what** is computed, **where** in event time, **when** in
processing time results come out, and **how** later results relate to
earlier ones. Google published it (VLDB, 2015) from its experience with
FlumeJava for batch and MillWheel for streaming, as the model behind
Cloud Dataflow.

## Start from "the data is never complete"

The model's first design principle is to never rely on any notion of
completeness. Unbounded data never ends, some of it arrives late, and
[[watermarks]] only estimate how far it has got. A watermark is
sometimes too fast (a window fires, then more of its data turns up)
and sometimes too slow (one straggler holds everything back). So
instead of waiting for "complete", the model lets you choose, per
pipeline, where to sit between correctness, latency and cost.

## Four questions, one example

Take scores from a mobile game, summed per team.

**What** is computed? The transformation: sum the scores per team.
This is essentially the one question classic batch processing
answers, because it waits for all the input first.

**Where** in event time? The [[windowing|windows]]: say, fixed
two-minute windows of event time, so each team gets a sum per two
minutes of play. Sessions and sliding windows answer this question too.

**When** in processing time are results emitted? The watermark gives
the main answer: fire each window when the watermark passes its end.
**Triggers** refine it. A trigger can fire on the watermark, on
processing time ("every minute"), on a count of elements, or on a
combination. A common pattern is early firings every minute while the
window is still filling, one on-time firing at the watermark, and a late
firing for each [[late-data|late event]]. Each output for a window is a
**pane**.

**How** do successive panes relate? That's the accumulation mode, and
it matters as soon as a window fires more than once. Suppose one window
fires three times: first with a score of 7, then after 3 and 4 arrive,
then after an 8 arrives.

| Pane | Discarding | Accumulating | Accumulating and retracting |
|---|---|---|---|
| 1 | 7 | 7 | 7 |
| 2 | 7 | 14 | 14, retract 7 |
| 3 | 8 | 22 | 22, retract 14 |

- **Discarding:** each pane holds only what arrived since the last
  one. Add the panes up to get 22. Good when the consumer sums deltas
  itself.
- **Accumulating:** each pane is the running total. The last one is
  right; adding them up counts the early values twice or three times. Good when the
  consumer overwrites the old value by key.
- **Accumulating and retracting:** each pane carries the new total plus
  a retraction of the previous one: "I told you 7, forget it, it's 14."
  Both the last value and the sum of everything are right. Needed when a
  later stage re-groups results by a different key, or when sessions
  merge and one new result replaces several old ones.

The modes cost more storage and computation in that order.

## Batch and streaming become settings

Keep the four answers fixed and the engine becomes a choice about
latency and cost. On a batch engine, the watermark sits at the start of
time until all input is read, then jumps to the end, and every window
fires once: classic batch. On a micro-batch engine, each small batch
fires any window whose contents changed. On a streaming engine, windows
fire as the watermark passes them, with early and late panes if you ask
for them.

Processing-time windows fit in too, either as a global window with a
processing-time trigger, or by stamping each event with its arrival
time and windowing on that. The second gives a perfect watermark and no
late data, at the cost of answers about arrival rather than about when
things happened.

Google proposed the SDK to the Apache Software Foundation in 2016.
Apache Beam's programming guide today describes the same windows,
watermarks, triggers and accumulation choices.

## Where it gets tricky

**Retractions stayed mostly on paper.** The paper describes three
accumulation modes, and the follow-up posts called the retraction API
speculative. Beam's programming guide documents only accumulating and
discarding. If a downstream stage re-keys or sessions merge, you handle
the corrections yourself.

**Nothing magical.** The model doesn't make an impractical computation
practical. Each knob it adds costs state or output volume.

**Defaults can surprise you.** In Beam, grouping an unbounded collection
without a window or a trigger fails when the pipeline is built, because
the default global window would never fire. And a count trigger that
waits for 50 elements will wait forever for a window that only gets 32.

**It's often compared with Lambda.** Accumulating mode is effectively
what [[lambda-vs-kappa|the Lambda Architecture]] does with two
systems: a fast early answer later overwritten by a correct one. The
Dataflow model gets the same shape from one pipeline.

## What this means when you build

- Write down the four answers for every pipeline before writing code.
  Most confusion in stream jobs is an unstated "when" or "how".
- Pick the accumulation mode to match the sink: overwrite by key →
  accumulating; a consumer that adds up deltas → discarding.
- Use early firings for dashboards, late firings for correctness.

## Further reading

- [The Dataflow Model](https://www.vldb.org/pvldb/vol8/p1792-Akidau.pdf), Akidau et al., Google, 2015. The paper: the four questions, windowing as assign and merge, triggers, the three refinement modes, and the same pipeline on three kinds of engine.
- [Streaming 102: The world beyond batch](https://www.oreilly.com/radar/the-world-beyond-batch-streaming-102/), Tyler Akidau, 2016. The four questions worked through on one example, with the accumulation-mode table.
- [Apache Beam Programming Guide](https://beam.apache.org/documentation/programming-guide/), Apache Beam project. The model as an SDK today: windows, watermarks, triggers, accumulation modes and allowed lateness.

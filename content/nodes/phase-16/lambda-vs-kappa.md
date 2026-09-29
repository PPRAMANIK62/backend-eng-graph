---
id: lambda-vs-kappa
title: Lambda vs kappa
depth: short
phase: 16
note: >-
  Two pipelines (batch and stream) or one stream for everything.
needs: [batch-processing, stream-processing]
leads_to: []
compare_with: [dataflow-model, backfills]
---

# Lambda vs kappa

Two ways to get results from an event stream that are both fast and
correct. The **Lambda Architecture** runs the same logic twice: a
[[batch-processing|batch]] layer that recomputes everything from all
the data, and a realtime layer that covers only the last few hours,
with queries merging the two. The **Kappa Architecture** runs one
[[stream-processing|stream job]] and, when the logic changes,
recomputes by replaying the log through a new copy of that job.

## Lambda: two pipelines, merged when you query

Nathan Marz, who created Storm, laid out the idea in 2011 (the post
itself doesn't use the name "Lambda"). Its base is a simple view of data: every event is
an immutable fact, and any query is a function over all the facts you
have. If you could run that function over everything on every query,
you'd be done. You can't, so:

- A **batch layer** (Hadoop, in the original) stores every fact and
  recomputes views from scratch. The views are always a few hours out
  of date.
- A **realtime layer** (Storm writing to Cassandra) keeps views for
  only the last few hours, updated incrementally as events arrive.
- A **query** reads both views and merges them.

![Two diagrams. Lambda: an immutable event log feeds a batch layer that recomputes from all data into a batch view hours behind, and a realtime layer that covers the last few hours into a realtime view; a query merges both views. Two code bases, two systems to run. Kappa: a log with long retention feeds job v1, which reads the head and writes table v1, and job v2 with new code, which replays from the start of the log into table v2. The app reads table v1 until v2 catches up, then switches; v1 and its table are then removed.](img/lambda-vs-kappa-architectures.svg)

*Lambda keeps two pipelines running all the time; Kappa starts a second copy of one pipeline only when it needs to reprocess. Adapted from Nathan Marz, "How to beat the CAP theorem" (2011) and Jay Kreps, "Questioning the Lambda Architecture" (2014).*

The appeal is recovery. Anything the realtime layer gets wrong is
overwritten by the next batch run, so its messiness is temporary. A bug
in a query is fixed by deploying the fix and recomputing from the
master data. When Marz's Cassandra ran out of disk, he started a fresh
cluster and within a few hours the batch layer had the answers right
again. The realtime layer can even use an approximate
algorithm, since batch corrects it.

## What Lambda costs

The same logic lives in two code bases, written for two very different
frameworks, and both have to give the same answer. Jay Kreps, who
helped build Kafka and Samza at LinkedIn, found that keeping them in
sync was really hard, and that a layer that hides both frameworks
behind one API can only offer the features both support, while you
still run and debug two systems. At Google, one team ran a weakly
consistent streaming pipeline with a nightly MapReduce to produce the
true numbers; its users gradually stopped trusting the fast results,
and the team rebuilt around a streaming system that was correct in the
first place.

There's a subtler catch too. The batch answer is only right if all the
input had arrived when the batch ran. Late data still needs another
rerun.

## Kappa: one job, replay the log

Kreps's alternative (2014), which he suggested might be called Kappa:

1. Keep the raw events in a [[log-based-messaging|log]] that retains
   them long enough to reprocess, with room for several readers. If you
   want to be able to reprocess 30 days, keep 30 days.
2. When the logic changes, start a second instance of the stream job
   that reads from the beginning of the retained log and writes to a
   **new** output table.
3. When it has caught up, switch the application to the new table.
4. Stop the old job and delete the old table.

Reprocessing is starting a reader at an earlier
[[offsets-and-commits|offset]], only when the code changes. Keeping both tables for a while gives you a
one-switch rollback, or lets you compare old and new output before
committing.

The costs: for a while you need twice the output storage, and the
output database has to take a fast bulk reload. The real gain is
developing, testing and running everything on one framework. Nothing ties it to Kafka; any store that
keeps ordered history for long enough works.

## Where it gets tricky

**Lambda didn't "beat CAP".** Marz framed the batch/realtime split as
a way around the CAP theorem. Kreps's reply is that it's asynchronous
processing whose results lag the input, and CAP is untouched. What
lasted from Lambda is two good habits: keep input immutable, and treat
reprocessing as a normal, planned operation.

**Kappa assumes a streaming engine you trust.** Lambda caught on when
the tools at hand were a batch system that could process history and a
stream processor that couldn't reprocess results. Kappa only works if the stream job gives answers as correct as
a batch job would, which means consistent state and
[[exactly-once-processing]].

**Replays need event time.** A replay runs history through far faster
than it first arrived. Windows over [[event-time-vs-processing-time|processing time]]
would put all of it in the last few windows; windows over event time
give the same answer as the original run.

**Retention bounds what you can replay.** Data older than the log keeps
can't be reprocessed by Kappa alone. Long history belongs in a store
that keeps it, and large [[backfills]] often still run as batch. At
Google, one large log-joining pipeline ran in streaming by default but
kept a separate batch implementation for big backfills, which is what
pushed toward a model where the same code runs either way.

**A third answer exists.** The [[dataflow-model]] gets Lambda's shape
(a fast estimate, later corrected) out of one pipeline.

## What this means when you build

- Start with one pipeline.
- Keep raw events immutable and retained, whatever architecture you
  pick.
- Design reprocessing up front: a new output table, a switch, a way to
  roll back.

## Further reading

- [How to beat the CAP theorem](http://nathanmarz.com/blog/how-to-beat-the-cap-theorem.html), Nathan Marz, 2011. The original batch-plus-realtime design, and the case for immutable data and recomputation.
- [Questioning the Lambda Architecture](https://www.oreilly.com/radar/questioning-the-lambda-architecture/), Jay Kreps, 2014. What Lambda gets right, what it costs, and the replay-the-log alternative he named Kappa.
- [The Dataflow Model](https://www.vldb.org/pvldb/vol8/p1792-Akidau.pdf), Akidau et al., Google, 2015. Why Lambda fails on simplicity, and Google's experiences with dual pipelines that led to one model for batch and streaming.

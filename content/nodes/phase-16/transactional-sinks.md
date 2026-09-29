---
id: transactional-sinks
title: Transactional sinks
depth: short
phase: 16
note: >-
  Making a stream job's output exactly once: stage the files, and commit
  them only when the checkpoint completes.
needs: [distributed-snapshots, exactly-once-processing, two-phase-commit, object-storage]
leads_to: []
compare_with: [idempotency, open-table-formats]
---

# Transactional sinks

A checkpoint lets a stream job rewind its state and its input after a
crash, but it can't take back output the job already wrote somewhere
else. A transactional sink stages its output and makes it visible only
when the checkpoint that covers it completes. After a crash, staged
output that never got committed is thrown away and produced again.
That's how exactly-once reaches files, tables and topics outside the
job.

## The duplicate a checkpoint can't prevent

Say a job writes counts as [[parquet|Parquet]] files to an
[[object-storage|object store]]. Checkpoint 7 completes. The job writes
a file with the next few seconds of results, then crashes before
checkpoint 8. Recovery restores state from checkpoint 7 and replays the
input from there ([[distributed-snapshots]]), so the job produces the
same results again and writes them again. The state is exactly once;
the output has duplicates.

## Two-phase commit, driven by the checkpoint

The fix ties each piece of output to a checkpoint with
[[two-phase-commit]]. The job's checkpoint coordinator is the
coordinator, and each sink instance is a participant. For a file sink:

1. **Write into a transaction.** The sink opens a temporary file and
   writes everything between two checkpoints into it. Nobody reads
   temporary files.
2. **Pre-commit when the barrier arrives.** When barrier *n* reaches
   the sink, it flushes and closes the file, and never writes to it
   again. It puts the file's name in its checkpointed state and starts
   a new temporary file for the next interval.
3. **Commit when the checkpoint completes.** Once every operator has
   acknowledged checkpoint *n*, the coordinator notifies them. The sink
   then moves the file into the real output directory in one atomic
   step (an [[atomic-rename]] on a normal filesystem).
4. **Abort on failure.** If the checkpoint fails, the temporary file is
   deleted, and its contents will be produced again after the restore.

![Timeline of a file sink across two checkpoints. Between checkpoints the sink writes to an in-progress temporary file. When barrier n arrives the file is closed and becomes pending, its name saved in the checkpoint, and a new in-progress file starts. When the coordinator reports checkpoint n complete, the pending file is committed by an atomic move and becomes visible. A crash before the commit notification restores from checkpoint n, finds the pending file in state, and commits it again.](img/transactional-sinks-commit-timeline.svg)

*Output is staged per checkpoint and becomes visible only after the checkpoint completes. Adapted from Piotr Nowojski and Mike Winters, "An Overview of End-to-End Exactly-Once Processing in Apache Flink" (2018), and the Flink FileSystem connector docs.*

The tricky moment is a crash after checkpoint *n* completes but before
the sink hears about it. The restored state lists a pre-committed file
that may not have been moved yet, so on restore the sink commits it
again. That only works if
commit is idempotent: if the file is already in place, do nothing. And
once a pre-commit succeeds, the commit has to succeed eventually. If it
fails, the job restarts and tries again; if it could never succeed,
that output would be lost.

## How Flink's sinks do it

Flink's FileSink tracks each part file as **in-progress** (being
written), **pending** (closed, waiting for a checkpoint) or
**finished** (committed). Pending files become finished on the next
successful checkpoint, and only finished files are safe to read. The two
kinds differ only by name, so readers have to skip in-progress files. A
few consequences:

- Without checkpointing, files never finish.
- Bulk formats like Parquet roll to a new file on every checkpoint, so
  the checkpoint interval sets both output latency and file count.
  Short intervals mean many small files; since Flink 1.15 the sink can
  compact pending files before committing them.
- On S3, part files are staged as multipart uploads. A bucket rule
  that aborts incomplete uploads after some days can remove pending
  files a savepoint still needs, and the restore then fails.

Flink's KafkaSink uses a Kafka transaction per checkpoint interval
instead. Readers avoid duplicates only with
`isolation.level=read_committed` (see [[exactly-once-processing]]). The
sink's default guarantee is none, so you have to ask for exactly-once.

## Where it gets tricky

**Latency.** Output appears once per checkpoint, never sooner.

**Timeouts that lose data.** Kafka aborts transactions left open longer
than `transaction.timeout.ms`. If a checkpoint plus a restart takes
longer than that, the staged output is gone before the job can commit
it. Set it above the longest checkpoint plus the longest restart.

**Idempotent sinks are the alternative.** If replaying produces the
same writes, say an upsert of a count by key, the sink can write
eagerly and replays overwrite with identical values (see
[[idempotency]]). That avoids the latency, but readers can see results
from input that is later rolled back and replayed.

**The API moved.** Flink 1.4.0 introduced `TwoPhaseCommitSinkFunction`
for this. Flink 2.0 (2025) removed it along with the old sink API. The
current Sink V2 splits the job between a sink writer that stages data
and a `Committer`, whose contract still says commits must be
idempotent.

## What this means when you build

- Stage output per checkpoint, save the staged handle in the
  checkpoint, commit when the checkpoint completes, and make commit
  idempotent.
- Make sure readers can only see committed output, by naming,
  directory or isolation level.
- Size transaction and upload timeouts to your worst recovery time.
  The phase 16 lab, which writes Parquet to a local S3-compatible
  store, needs all of this.

## Further reading

- [An Overview of End-to-End Exactly-Once Processing in Apache Flink (with Apache Kafka, too!)](https://flink.apache.org/2018/02/28/an-overview-of-end-to-end-exactly-once-processing-in-apache-flink-with-apache-kafka-too/), Piotr Nowojski and Mike Winters, 2018. The checkpoint as two-phase commit, with the file sink worked through.
- [FileSystem connector](https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/filesystem/), Apache Flink docs, Flink 2.3. Part-file states, rolling on checkpoints, compaction and the S3 caveats.
- [Apache Kafka Connector](https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/kafka/), Apache Flink docs, Flink 2.3. Exactly-once to Kafka, and the transaction timeout that can lose data.
- [Committer](https://nightlies.apache.org/flink/flink-docs-stable/api/java/org/apache/flink/api/connector/sink2/Committer.html), Apache Flink Javadoc. The current commit contract in Sink V2.
- [Apache Flink 2.0.0: A new Era of Real-Time Data Processing](https://flink.apache.org/2025/03/24/apache-flink-2.0.0-a-new-era-of-real-time-data-processing/), Xintong Song, 2025. The release that removed the old sink API.
- [State Management in Apache Flink](https://www.vldb.org/pvldb/vol10/p1718-carbone.pdf), Paris Carbone et al., VLDB 2017. Section 4.4: idempotent vs transactional sinks.

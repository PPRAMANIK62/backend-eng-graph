---
id: flink-filesystem-connector
title: FileSystem connector (Flink)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/connectors/datastream/filesystem/
kind: docs
primary: true
---

## Summary

Flink 2.3 docs for the FileSource and FileSink. The FileSink writes part
files into buckets and moves them through in-progress, pending and
finished; files become finished only when a checkpoint succeeds. Notes on
bulk formats, compaction and S3.

## Key claims

- Designed for exactly-once in streaming. "is designed to provide exactly-once semantics for STREAMING execution." (FileSystem)
- Part files are finalized only on successful checkpoints. "Part files can only be finalized on successful checkpoints." (File Sink)
- Without checkpointing they never finish. "If checkpointing is disabled, part files will forever stay in the in-progress or the pending state, and cannot be safely read by downstream systems." (File Sink)
- Bulk formats roll on every checkpoint. "For Bulk-encoded Formats we roll on every checkpoint" (File Sink)
- Pending files finish on the next checkpoint. "pending files become finished on the next checkpoint" (Rolling Policy)
- The three states. "Pending : Closed (due to the specified rolling policy) in-progress files that are waiting to be committed" (Part file lifecycle)
- Only finished files are safe to read. "Only finished files are safe to read by downstream systems as those are guaranteed to not be modified later." (Part file lifecycle)
- Finished and in-progress differ only by name. "Finished files can be distinguished from the in-progress ones by their naming scheme only." (Part file configuration)
- Compaction since 1.15, so short checkpoint intervals don't make lots of small files. "Since version 1.15 FileSink supports compaction of the pending files" (Compaction)
- Committed data is never overwritten. "Flink and the FileSink never overwrites committed data." (Important Considerations, General)
- The last in-progress files aren't finished on normal termination. "upon normal termination of a job, the last in-progress files will not be transitioned to the “finished” state." (Important Considerations, General)
- On S3 it uses multipart uploads. "To guarantee exactly-once semantics while being efficient, the FileSink uses the Multi-part Upload feature of S3 (MPU from now on)." (S3-specific)
- An aggressive abort-MPU lifecycle rule can break a restore. "This will result in your job not being able to restore from that savepoint as the pending part-files are no longer there" (S3-specific)
- In BATCH mode a JobManager failure during commit can duplicate. "if a JobManager failure happens while the Committers are committing, then we may have duplicates." (BATCH-specific)
- Compaction lets you use shorter checkpoint intervals without many small files. "allows the application to have smaller checkpoint interval without generating a lot of small files" (Compaction)
- Compaction runs between pending and committed. "the compaction happens between the files become pending and get committed." (Compaction)
- MPU parts are combined into the file once all are uploaded. "which can be combined into the original file when all the parts of the MPU are successfully uploaded." (S3-specific)

## Visuals worth redrawing

- The part-file lifecycle (in-progress, pending, finished) against checkpoints.

## My notes

- FileSink supports HDFS, S3, OSS, ABFS and local only.

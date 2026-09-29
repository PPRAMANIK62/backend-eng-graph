---
id: flink-sink2-committer
title: Committer (Flink sink2 API Javadoc)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/api/java/org/apache/flink/api/connector/sink2/Committer.html
kind: code
primary: true
---

## Summary

The Javadoc for Flink's current sink API (Sink V2) interface that performs
the commit step of a sink's two-phase commit.

## Key claims

- The Committer is the second step of two-phase commit. "The Committer is responsible for committing the data staged by the CommittingSinkWriter in the second step of a two-phase commit protocol." (Interface Committer)
- Commits must be idempotent because they are retried after restart. "A commit must be idempotent: If some failure occurs in Flink during commit phase, Flink will restart from previous checkpoint and re-attempt to commit all committables." (Interface Committer)
- Some may already be committed. "Thus, some or all committables may have already been committed." (Interface Committer)

## Visuals worth redrawing

None.

## My notes

- Known implementing class: FileCommitter (the FileSink's committer).

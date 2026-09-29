---
id: flink-2-0-release-2025
title: "Apache Flink 2.0.0: A new Era of Real-Time Data Processing"
author: Xintong Song (Apache Flink PMC)
url: https://flink.apache.org/2025/03/24/apache-flink-2.0.0-a-new-era-of-real-time-data-processing/
kind: blog
primary: true
---

## Summary

The Flink 2.0.0 release announcement (2025): disaggregated state with the
ForSt backend, and the removal of old APIs, including SinkFunction and
TwoPhaseCommitSinkFunction.

## Key claims

- 2.0 adds disaggregated state on distributed file systems. "Flink 2.0 introduces Disaggregated State Storage and Management, leveraging Distributed File Systems (DFS) as the primary storage medium." (Disaggregated State Management)
- The old source and sink APIs are gone. "SourceFuction, SinkFunction and Sink V1. Please migrate to Source and Sink V2." (Breaking Changes, API) The removed-class list includes org.apache.flink.streaming.api.functions.sink.TwoPhaseCommitSinkFunction.
- The removed-class list names the old two-phase commit sink. "org.apache.flink.streaming.api.functions.sink.TwoPhaseCommitSinkFunction" (Breaking Changes, API, removed classes)

## Visuals worth redrawing

None.

## My notes

- "SourceFuction" is the release note's own typo.

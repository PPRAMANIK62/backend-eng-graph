---
id: kafka-topic-configs
title: Topic Configs (Apache Kafka 4.3 docs)
author: Apache Kafka project
url: https://kafka.apache.org/43/configuration/topic-configs/
kind: docs
primary: true
---

## Summary

The reference for per-topic settings in Kafka 4.3, with defaults.
Covers segment size and roll time, the offset index, retention by
time and size, the cleanup policy (delete, compact or both), and the
compaction knobs (dirty ratio, compaction lag, tombstone retention).

## Key claims

- segment.bytes sets the segment file size, default 1 GiB; retention and cleaning work a file at a time. "Retention and cleaning is always done a file at a time so a larger segment size means fewer files but less granular control over retention." Default "1073741824 (1 gibibyte)" (segment.bytes)
- segment.ms forces a roll even if the segment isn't full, default 7 days. "This configuration controls the period of time after which Kafka will force the log to roll even if the segment file isn't full to ensure that retention can delete or compact old data." Default "604800000 (7 days)" (segment.ms)
- retention.ms is how long data is kept under the delete policy, default 7 days; it's a promise to consumers. "This represents an SLA on how soon consumers must read their data." Default "604800000 (7 days)" (retention.ms)
- retention.bytes is per partition and unlimited by default. "By default there is no size limit only a time limit. Since this limit is enforced at the partition level, multiply it by the number of partitions to compute the topic retention in bytes." (retention.bytes)
- index.interval.bytes: an index entry roughly every 4096 bytes. "The default setting ensures that we index a message roughly every 4096 bytes." (index.interval.bytes)
- A denser index means shorter scans but bigger index files. "More frequent indexing allows reads to jump closer to the exact position in the log but results in larger index files." (index.interval.bytes)
- segment.index.bytes: the offset index is preallocated, default 10 MiB. "This configuration controls the size of the index that maps offsets to file positions. We preallocate this index file and shrink it only after log rolls." Default "10485760 (10 mebibytes)" (segment.index.bytes)
- file.delete.delay.ms: a deleted segment's file waits before it's removed, default 1 minute. "The time to wait before deleting a file from the filesystem" Default "60000 (1 minute)" (file.delete.delay.ms)
- cleanup.policy: delete (default), compact, or both. "The "compact" policy will enable log compaction, which retains the latest value for each key." (cleanup.policy)
- Both policies together. "In this case, old segments will be discarded per the retention time and size configuration, while retained segments will be compacted." (cleanup.policy)
- min.cleanable.dirty.ratio, default 0.5, bounds the space wasted on duplicates. "This ratio bounds the maximum space wasted in the log by duplicates (at 50% at most 50% of the log could be duplicates)." (min.cleanable.dirty.ratio)
- A higher ratio trades space for cheaper cleaning. "A higher ratio will mean fewer, more efficient cleanings but will mean more wasted space in the log." (min.cleanable.dirty.ratio)
- delete.retention.ms: how long tombstones are kept, default 1 day; also the time a full read from offset 0 must finish in. "This setting also gives a bound on the time in which a consumer must complete a read if they begin from offset 0 to ensure that they get a valid snapshot of the final stage" Default "86400000 (1 day)" (delete.retention.ms)
- flush.messages: Kafka doesn't fsync each message by default; replication is the durability. "In general we recommend you not set this and use replication for durability and allow the operating system's background flush capabilities as it is more efficient." (flush.messages)

## Visuals worth redrawing

None.

## My notes

- Defaults are for Kafka 4.3. Say so in articles.

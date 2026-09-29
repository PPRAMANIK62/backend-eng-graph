---
id: postgres-runtime-config-wal
title: "Write Ahead Log settings, PostgreSQL documentation section 19.5"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-wal.html
kind: docs
primary: true
---

## Summary

The reference for every WAL setting in PostgreSQL 18 (read as 18.6).
Used here for full_page_writes, wal_log_hints, wal_compression,
synchronous_commit, commit_delay, commit_siblings, wal_writer_delay and
the checkpoint settings, with their defaults.

## Key claims

- full_page_writes logs the whole page on its first change after a checkpoint. "the PostgreSQL server writes the entire content of each disk page to WAL during the first modification of that page after a checkpoint." (19.5.1, full_page_writes)
- Why: a page write cut short by a crash leaves a mix of old and new data. "a page write that is in process during an operating system crash might be only partially completed, leading to an on-disk page that contains a mix of old and new data." (19.5.1, full_page_writes)
- Row-level WAL records can't fix such a page. "The row-level change data normally stored in WAL will not be enough to completely restore such a page during post-crash recovery." (19.5.1, full_page_writes)
- Once per page per checkpoint is enough because replay always starts at a checkpoint. "Because WAL replay always starts from a checkpoint, it is sufficient to do this during the first change of each page after a checkpoint." (19.5.1, full_page_writes)
- Longer checkpoint intervals reduce the cost. "one way to reduce the cost of full-page writes is to increase the checkpoint interval parameters." (19.5.1, full_page_writes)
- Turning it off risks unrecoverable or silent corruption. "might lead to either unrecoverable data corruption, or silent data corruption, after a system failure." (19.5.1, full_page_writes)
- Default is on. "The default is on." (19.5.1, full_page_writes)
- wal_log_hints logs full pages even for hint-bit-only changes; with data checksums on, hint bit updates are always logged. "If data checksums are enabled, hint bit updates are always WAL-logged and this setting is ignored." (19.5.1, wal_log_hints)
- wal_compression compresses full page images (pglz, lz4, zstd); default off. "When enabled, the PostgreSQL server compresses full page images written to WAL" (19.5.1, wal_compression)
- synchronous_commit: every mode except off waits for the local WAL flush. "The local behavior of all non-off modes is to wait for local flush of WAL to disk." (19.5.1, synchronous_commit)
- off can lose recent commits but leaves a consistent database. "the database state will be just the same as if those transactions had been aborted cleanly." (19.5.1, synchronous_commit)
- fsync off can cause unrecoverable corruption on power failure. "this can result in unrecoverable data corruption in the event of a power failure or system crash." (19.5.1, fsync)
- wal_writer_delay default 200 ms. "The default value is 200 milliseconds (200ms)." (19.5.1, wal_writer_delay)
- commit_delay adds a delay before a WAL flush so more transactions share it; default zero. "The default commit_delay is zero (no delay)." (19.5.1, commit_delay)
- commit_delay adds up to its own length to every flush. "it also increases latency by up to the commit_delay for each WAL flush." (19.5.1, commit_delay)
- Since 9.3 the first process to flush waits and the rest wait only for the leader. "Beginning in PostgreSQL 9.3, the first process that becomes ready to flush waits for the configured interval, while subsequent processes wait only until the leader completes the flush operation." (19.5.1, commit_delay)
- commit_siblings default five. "The default is five transactions." (19.5.1, commit_siblings)
- checkpoint_timeout default 5 min, range 30 s to one day; raising it lengthens recovery. "Increasing this parameter can increase the amount of time needed for crash recovery." (19.5.2, checkpoint_timeout)
- checkpoint_completion_target default 0.9; lowering it is not recommended. "Reducing this parameter is not recommended because it causes the checkpoint to complete faster." (19.5.2, checkpoint_completion_target)
- max_wal_size default 1 GB, a soft limit. "This is a soft limit" (19.5.2, max_wal_size)
- checkpoint_flush_after default 256kB on Linux. "The default is 256kB on Linux, 0 elsewhere." (19.5.2, checkpoint_flush_after)
- wal_level defaults to replica; logical adds what logical decoding needs, and it only changes at server start. "Finally, logical adds information necessary to support logical decoding." (19.5.1, wal_level)
- wal_level default. "The default value is replica" (19.5.1, wal_level)
- wal_level can only change with a restart. "This parameter can only be set at server start." (19.5.1, wal_level)
- wal_log_hints (default off) logs full pages even for hint-bit-only changes, and can be used to measure the WAL cost of checksums. "You can use this setting to test how much extra WAL-logging would occur if your database had data checksums enabled." (19.5.1, wal_log_hints)

## Visuals worth redrawing

None.

## My notes

- Table 19.1 (synchronous_commit modes with standbys) belongs to replication.

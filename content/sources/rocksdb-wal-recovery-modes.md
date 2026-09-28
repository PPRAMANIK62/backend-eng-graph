---
id: rocksdb-wal-recovery-modes
title: WAL Recovery Modes
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/WAL-Recovery-Modes
kind: docs
primary: true
---

## Summary

RocksDB wiki page listing the four policies for replaying the WAL after
an unclean shutdown, from "any error is corruption" to "skip anything
bad". Read via the wiki's raw markdown
(https://raw.githubusercontent.com/wiki/facebook/rocksdb/WAL-Recovery-Modes.md).

## Key claims

- After a kill or restart, RocksDB replays the WAL to get back to a consistent state. "on restart RocksDB needs to restore itself to a consistent state." (Introduction)
- kTolerateCorruptedTailRecords ignores errors at the end of the log, because a crash can leave incomplete writes there. "on unclean shutdown there can be incomplete writes at the tail of the log." (kTolerateCorruptedTailRecords)
- A torn tail and real corruption look the same. "the system cannot differentiate between corruption at the tail of the log and incomplete write." (kTolerateCorruptedTailRecords)
- kAbsoluteConsistency treats any error as corruption; for apps that can't lose a single record. (kAbsoluteConsistency)
- kPointInTimeRecovery stops replay at the first error, giving a consistent point in time; good with replicas; default since 6.6. "This is the default as of version 6.6." (kPointInTimeRecovery)
- kSkipAnyCorruptedRecords ignores errors and recovers as much as it can; for disaster recovery. (kSkipAnyCorruptedRecords)

## Visuals worth redrawing

- A log with a bad record in the middle and a torn tail, and what each of the four modes keeps.

## My notes

- The choice matters most for a bad record in the middle, which can't be a normal torn write.

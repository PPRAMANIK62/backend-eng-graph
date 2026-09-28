---
id: kernel-xfs-delayed-logging
title: XFS Logging Design (XFS Delayed Logging Design)
author: Linux kernel documentation (XFS developers)
url: https://docs.kernel.org/filesystems/xfs/xfs-delayed-logging-design.html
published: unknown
accessed: 2026-09-28
kind: docs
primary: true
---

## Summary

The XFS developers' description of how XFS journals metadata: write-ahead
logging that mixes logical and physical records, relogging of hot objects,
and delayed logging, where committed changes collect in memory (the
Committed Item List) and go to the log as one checkpoint.

## Key claims

- XFS uses write-ahead logging for metadata. "XFS uses Write Ahead Logging for ensuring changes to the filesystem metadata are atomic and recoverable." (1.2 Introduction)
- It mixes logical and physical logging. "combining intents, logical and physical logging mechanisms" (1.2 Introduction)
- Inodes and dquots are logged logically; buffers physically. "Some objects, such as inodes and dquots, are logged in logical format" (1.2 Introduction)
- Long operations are chained by intents so recovery can finish them. "Long running atomic modifications have individual changes chained together by intents" (1.2 Introduction)
- One CPU core can keep the log busy, so the journal is I/O bound. "the XFS journalling subsystem can be considered to be IO bound." (logging section)
- Without delayed logging, relogging writes the same changes to the log again and again. "repeated operations to the same objects write the same changes to the log over and over again." (Delayed Logging: Concepts)
- Cutting those stale copies is the point of delayed logging. "reducing the number of stale objects written to the log would greatly reduce the amount of metadata we write to the log, and this is the fundamental goal of delayed logging." (Delayed Logging: Concepts)
- Delayed logging collects committed changes in the Committed Item List (CIL). "tracking of committed items is done through a new list called the Committed Item List (CIL)." (Delayed Logging)
- (added in review) On a log force, everything in the CIL is written to the log as one checkpoint transaction. "all the items in the CIL must be written into the log via the log buffers." (1.9.3 Delayed Logging: Checkpoints)

## Visuals worth redrawing

None needed at the filesystem level.

## My notes

- Very detailed; only the introduction matters for a general filesystem
  article. Doesn't say whether data is journaled; the ext4 doc says XFS's
  default is metadata journaling.

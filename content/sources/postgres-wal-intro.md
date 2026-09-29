---
id: postgres-wal-intro
title: "Write-Ahead Logging (WAL), PostgreSQL documentation section 28.3"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/wal-intro.html
kind: docs
primary: true
---

## Summary

The short introduction to the WAL in the PostgreSQL 18 manual (read as
18.6). The rule (log first, data pages later), why that means fewer and
cheaper flushes at commit, and what else the log gives you: online
backup and point-in-time recovery.

## Key claims

- The rule: data files change only after the WAL records describing the change are flushed. "changes to data files (where tables and indexes reside) must be written only after those changes have been logged, that is, after WAL records describing the changes have been flushed to permanent storage." (28.3, first paragraph)
- So data pages don't have to be flushed at every commit; recovery redoes missing changes from the log. "we do not need to flush data pages to disk on every transaction commit" (28.3, first paragraph)
- Postgres calls this roll-forward recovery. "(This is roll-forward recovery, also known as REDO.)" (28.3, first paragraph)
- Only the WAL file has to be flushed at commit, and it's written sequentially. "only the WAL file needs to be flushed to disk to guarantee that a transaction is committed, rather than every data file changed by the transaction." (28.3, third paragraph)
- Syncing a sequential log is cheaper than flushing scattered data pages. "The WAL file is written sequentially, and so the cost of syncing the WAL is much less than the cost of flushing the data pages." (28.3, third paragraph)
- One fsync can commit many small concurrent transactions (group commit). "one fsync of the WAL file may suffice to commit many transactions." (28.3, third paragraph)
- Archived WAL plus a base backup gives point-in-time recovery. "we simply install a prior physical backup of the database, and replay the WAL just as far as the desired time." (28.3, fourth paragraph)
- A journaling filesystem isn't needed for the data files, since the WAL restores them. "journaled file systems are not necessary for reliable storage of the data files or WAL files." (28.3, Tip)

## Visuals worth redrawing

None.

## My notes

- Doesn't define the record format; that's in wal-internals and the
  source (access/xlogrecord.h), not opened.

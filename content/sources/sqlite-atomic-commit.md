---
id: sqlite-atomic-commit
title: Atomic Commit In SQLite
author: SQLite developers
url: https://www.sqlite.org/atomiccommit.html
kind: docs
primary: true
---

## Summary

How SQLite commits a transaction with its default rollback journal: copy
the original pages to a journal, flush it, change the database file,
flush, then delete the journal. After a crash, a hot journal is played
back to undo the half-done change. The undo-log counterpart to a WAL.
Parts of the page describe SQLite 3.5.0-era behaviour.

## Key claims

- Before changing the database, SQLite writes the original page contents to a rollback journal. "SQLite first creates a separate rollback journal file and writes into the rollback journal the original content of the database pages that are to be altered." (3.5)
- The journal is flushed before the database file is touched. "The next step is to flush the content of the rollback journal file to nonvolatile storage." (3.7)
- Usually two flushes for the journal: content, then header with the page count. "On most platforms two separate flush (or fsync()) operations are required." (3.7)
- The journal flush and the database flush take most of the commit time. "this step together with the rollback journal file flush in section 3.7 above takes up most of the time required to complete a transaction commit in SQLite." (3.10)
- Deleting the journal is the commit point. "This is the instant where the transaction commits." (3.11)
- A hot journal after a crash means an incomplete commit to roll back. "A hot journal is a rollback journal that needs to be played back in order to restore the database to a sane state." (4.2)
- Rollback copies the original pages back and truncates to the original size. "It then proceeds to read the original content of pages out of the rollback journal and write that content back to where it came from in the database file." (4.4)
- SQLite doesn't assume sector writes are atomic by default. "SQLite has traditionally assumed that a sector write is not atomic." (2)
- It assumes flush and fsync work as advertised and can't check. "SQLite assumes that the operating system that it is running on works as advertised." (2)

## Visuals worth redrawing

- The step diagrams (3.1 to 3.11): user space, OS cache, disk, and the
  journal. A simpler version could contrast undo journal with WAL.

## My notes

- The WAL mode is in sqlite-wal and sqlite-file-format.

---
id: sqlite-wal
title: Write-Ahead Logging
author: SQLite developers
url: https://www.sqlite.org/wal.html
kind: docs
primary: true
---

## Summary

SQLite's WAL journal mode: what it improves over the default rollback
journal and its limits.

## Key claims

- The default is a rollback journal; WAL is an option since 3.7.0 (2010). "The default method by which SQLite implements atomic commit and rollback is a rollback journal." (1)
- In WAL mode readers and the writer don't block each other. "WAL provides more concurrency as readers do not block writers and a writer does not block readers." (1)
- Fewer fsync calls. "WAL uses many fewer fsync() operations" (1)
- All processes must be on one host; no network filesystems. "WAL does not work over a network filesystem." (1)
- Extra -wal and -shm files sit next to the database. (1)
- Checkpointing is automatic by default but still something to watch. "There is the extra operation of checkpointing which, though automatic by default, is still something that application developers need to be mindful of." (1)
- WAL needs shared memory, so all readers must be on one machine. "the use of shared memory means that all readers must exist on the same machine." (2.2, Concurrency)

## Visuals worth redrawing

None.

## My notes

- The WAL file layout is in sqlite-file-format.

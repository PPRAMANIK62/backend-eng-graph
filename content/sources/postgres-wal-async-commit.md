---
id: postgres-wal-async-commit
title: "Asynchronous Commit, PostgreSQL documentation section 28.4"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/wal-async-commit.html
kind: docs
primary: true
---

## Summary

PostgreSQL 18 (read as 18.6) on synchronous_commit = off: reply to the
client before the commit record is flushed. What you can lose (the last
few transactions) and what you can't (consistency), and how this
differs from fsync = off and from commit_delay.

## Key claims

- Normal commit waits for the WAL flush before reporting success. "the server waits for the transaction's WAL records to be flushed to permanent storage before returning a success indication to the client." (28.4, second paragraph)
- For short transactions that wait is a big part of the time. "for short transactions this delay is a major component of the total transaction time." (28.4, second paragraph)
- Asynchronous commit risks losing data, not corrupting it. "The risk that is taken by using asynchronous commit is of data loss, not data corruption." (28.4, fourth paragraph)
- Recovery replays WAL to the last flushed record, so the last few transactions are lost. "The net effect is therefore loss of the last few transactions." (28.4, fourth paragraph)
- Commit order is kept, so B can't survive without A. "it is not possible for A's effects to be lost while B's effects are preserved." (28.4, fourth paragraph)
- The mode can be chosen per transaction. "The user can select the commit mode of each transaction" (28.4, fifth paragraph)
- The risk window is at most three times wal_writer_delay. "The actual maximum duration of the risk window is three times wal_writer_delay" (28.4, seventh paragraph)
- fsync = off is different: it can corrupt the database after an OS or hardware crash. "a system crash (that is, a hardware or operating system crash, not a failure of PostgreSQL itself) could result in arbitrarily bad corruption of the database state." (28.4, ninth paragraph)
- commit_delay is still synchronous, a way to grow the group sharing one flush. "commit_delay also sounds very similar to asynchronous commit, but it is actually a synchronous commit method" (28.4, last paragraph)

## Visuals worth redrawing

None.

## My notes

- wal_writer_delay default (200 ms) is in postgres-runtime-config-wal.

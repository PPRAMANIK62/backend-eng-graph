---
id: github-gh-ost
title: "gh-ost: GitHub's online schema migration for MySQL (README and design docs)"
author: GitHub (gh-ost authors)
url: https://github.com/github/gh-ost
kind: code
primary: true
---

## Summary

The gh-ost repository (v1.1.11 when read): the README and three docs,
doc/why-triggerless.md, doc/triggerless-design.md and doc/cut-over.md.
gh-ost does the same shadow-table copy as older MySQL tools but reads
changes from the binary log instead of using triggers, so it can pause,
run on a replica, and control the cut-over.

## Key claims

- Every online schema change tool works the same way. "they create a _ghost_ table in the likeness of your original table, migrate that table while empty, slowly and incrementally copy data from your original table to the _ghost_ table, meanwhile propagating ongoing changes (any `INSERT`, `DELETE`, `UPDATE` applied to your table) to the _ghost_ table." (README, How?)
- gh-ost differs by not using triggers. "However it differs from all existing tools by not using triggers." (README, How?)
- Triggers run in the same transaction as the write that fired them. "A trigger may contain a set of queries, and these queries run in the same transaction space as the query that manipulates the table." (why-triggerless.md, Overview)
- In MySQL, triggers are interpreted, so each write pays for the extra write and the interpretation. "MySQL stored routines are interpreted, never compiled." (why-triggerless.md, Triggers, overhead)
- Triggers compete for locks with the writes that fire them, uncoordinated. "These competitions are non-coordinated." (why-triggerless.md, Triggers, locks)
- GitHub saw lock-downs from it. "We have evidenced near or complete lock downs in production, to the effect of rendering the table or the entire database inaccessible due to lock contention." (why-triggerless.md, Triggers, locks)
- You can pause the copy but not the triggers. "Cancelling the triggers means loss of information, leading to incorrect data." (why-triggerless.md, no pause)
- pt-online-schema-change is synchronous: three AFTER triggers write to the ghost table. "it adds three triggers (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`) on the original table. Each such trigger relays the operation onto the ghost table." (triggerless-design.md, background)
- Facebook OSC is asynchronous: triggers write to a changelog table, a process applies it later. "A background process tails the changelog table and applies the changes onto the ghost table." (triggerless-design.md, background)
- With synchronous triggers the tables stay in step, so one atomic rename is enough. "Thus, a simple, atomic `rename table original to _original_old, ghost to original` suffices and is valid." (triggerless-design.md, Cut-over phase)
- Facebook OSC's cut-over: lock, drain the backlog, then two renames. "Lock the original table, work on backlog" (triggerless-design.md, Cut-over phase)
- gh-ost reads the binary log as if it were a replica. "`gh-ost` pretends to be a MySQL replica: it connects to the MySQL server and begins requesting for binlog events as though it were a real replication server." (triggerless-design.md)
- One writer alternates copying rows and applying binlog events. "This is why we choose to alternate between the massive row-copy and the ongoing binlog events backlog such that the server only sees writes from a single connection." (triggerless-design.md, Writer load)
- When throttled it writes nothing. "When `gh-ost` pauses (throttles), it issues no writes on the ghost table." (triggerless-design.md, Pausability)
- Async capture makes cut-over harder: events may still be in flight when you lock. "as we lock the original table, we often still have events in the pipeline, changes in the binary log we still need to apply onto the ghost table." (triggerless-design.md, Cut-over phase)
- A two-rename cut-over leaves a moment with no table. "In between the two renames there's a brief period of time where your table just does not exist, and queries will fail." (cut-over.md)
- gh-ost's cut-over either swaps atomically or falls back and retries. "in which case we are naturally returning to pre-cut-over phase, where the original table is still in place and accessible." (cut-over.md)
- The cut-over: one connection holds the lock while another waits to run the atomic rename, held back by a sentry table. "while one connection holds the lock, another attempts the atomic `RENAME`." (cut-over.md)
- It can run a test migration on a replica. "Build your trust in `gh-ost` by testing it on replicas." (README)

## Visuals worth redrawing

- README's general flow image: original table, ghost table, binlog
  stream, row copy.

## My notes

- Everything here is MySQL. The Postgres analogue of reading the binlog
  is logical decoding of the WAL; no source opened for this note says so.

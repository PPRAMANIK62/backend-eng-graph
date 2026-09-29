---
id: cmu-15445-logging
title: "Lecture #20: Database Logging (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/20-logging.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition.
Undo and redo, the steal/force buffer policies, shadow paging and
rollback journals as alternatives, write-ahead logging, what a log
record holds, group commit, physical vs logical vs physiological
logging, and blocking checkpoints.

## Key claims

- Recovery has two halves: work during normal processing, and work after a failure. "Every recovery algorithm has two parts" (1)
- UNDO removes effects of incomplete or aborted transactions; REDO re-applies committed ones. "REDO: The process of re-applying the effects of a committed transaction for durability." (1)
- NO-STEAL + FORCE needs neither undo nor redo, but the write set must fit in memory. "A limitation of NO STEAL + FORCE is that all of the data (ie. the write set) that a transaction needs to modify must fit into memory." (2)
- Shadow paging: copy on write, and commit by switching the root; undo is dropping the shadow pages, no redo. "Redo: Not needed at all." (3)
- Shadow paging commits need many random writes. "This approach causes lots of writes to random non-contiguous pages." (3)
- SQLite used a rollback journal of original pages before switching to a WAL in 2010. "This technique was implemented in SQLite prior to 2010." (4)
- WAL: log records go to stable storage before the page is written. "The DBMS must write to disk the log file records that correspond to changes made to a database object before it can flush that object to disk." (5)
- WAL is a steal + no-force scheme, and a sequential write. "WAL is an example of a STEAL + NO-FORCE system." (5)
- Almost every DBMS uses it because it's fastest at runtime; recovery is slower because the log is replayed. "almost every DBMS uses write-ahead logging (WAL) because it has the fastest runtime performance." (5)
- A transaction is committed only when all its log records are on stable storage. "A transaction is not considered committed until all its log records have been written" (5)
- A log record holds transaction id, object id, before value (undo) and after value (redo), plus things like a checksum. "Before Value (used for UNDO)." (5)
- Group commit batches log flushes; flushes happen when the buffer fills or enough time passes. "The system can use the “group commit” optimization to batch multiple log flushes together to amortize overhead." (5)
- Dirty pages can be written any time after their log records are flushed. "The DBMS can write dirty pages to disk whenever it wants to, as long as it is after flushing the corresponding log records." (5)
- Physical, logical and physiological logging; physiological (one page, slot number, not byte offset) is the most common. "Most common approach used in DBMSs." (6)
- Logical logging is hard to recover with concurrent non-deterministic transactions, and slow because everything is re-executed. "recovery takes longer because you must re-execute every transaction." (6)
- Without checkpoints the log grows forever and recovery replays all of it. "The main problem with a WAL-based DBMS is that the log file will grow forever." (7)
- Checkpoint too often and runtime suffers; too rarely and recovery takes long. "Taking a checkpoint too often causes the DBMS's runtime performance to degrade." (7)

## Visuals worth redrawing

- Figure 3: transaction changes going to a WAL buffer, then the buffer
  pool, and the WAL buffer flushed at commit.

## My notes

- Secondary (teaching notes), good for the steal/force framing.

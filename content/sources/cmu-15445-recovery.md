---
id: cmu-15445-recovery
title: "Lecture #21: Database Crash Recovery (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/21-recovery.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition, on
ARIES: LSNs (flushedLSN, pageLSN, recLSN, lastLSN, MasterRecord),
commit and abort with CLRs, blocking and fuzzy checkpoints with the
active transaction table and dirty page table, and the analysis, redo
and undo phases.

## Key claims

- ARIES came from IBM Research in the early 1990s for DB2. "a recovery algorithm developed at IBM research in early 1990s for the DB2 system." (1)
- Three ideas: WAL, repeating history during redo, logging changes during undo. "Repeating History During Redo: On restart, retrace actions and restore database to exact state before crash." (1)
- Every page has a pageLSN; the system tracks flushedLSN. "Each data page contains a pageLSN, which is the LSN of the most recent update to that page." (2)
- A page can be written only once the log is flushed past its pageLSN. "Before the DBMS can write page i to disk, it must flush log at least to the point where pageLSNi ≤ flushedLSN." (2, figure 1)
- Commit: write COMMIT to the log buffer, flush up to and including it, then acknowledge. "Once the COMMIT record is safely stored on disk, the DBMS returns an acknowledgment back to the application that the transaction has committed." (3)
- TXN-END is written later and doesn't need an immediate flush. "These TXN-END records are used for internal bookkeeping and do not need to be flushed immediately." (3)
- prevLSN links a transaction's records; a CLR describes an undo and is never undone. "The DBMS adds CLRs to the log like any other record but they never need to be undone." (3)
- A CLR carries an undoNextLSN, the next record to undo. "It has all the fields of an update log record plus the undoNextLSN pointer (i.e., the next-to-be-undone LSN)." (3)
- Undo picks the largest lastLSN across losers at each step; when the last is aborted the log is flushed and new work starts. "Once the last transaction has been successfully aborted, the DBMS flushes out the log and then is ready to start processing new transactions." (5, Undo Phase)
- Blocking checkpoints halt transactions; they simplify recovery but hurt runtime. "While this process impacts runtime performance, it significantly simplifies recovery." (4)
- Active transaction table and dirty page table; each dirty page has a recLSN, the record that first dirtied it. "There is one entry per dirty page containing the recLSN (i.e., the LSN of the log record that first caused the page to be dirty)." (4)
- Fuzzy checkpoints let transactions keep running; CHECKPOINT-BEGIN and CHECKPOINT-END (with ATT and DPT). "A fuzzy checkpoint is where the DBMS allows other transactions to continue to run." (4)
- The MasterRecord gets the LSN of CHECKPOINT-BEGIN when the checkpoint completes. "Upon the completion of the checkpoint, the LSN of the <CHECKPOINT-BEGIN> record is recorded in the MasterRecord." (4)
- Three phases: analysis, redo, undo. "Redo: Repeat all actions starting from an appropriate point in the log (even txns that will abort)." (5)
- Redo starts at the smallest recLSN in the DPT, and skips a record if the page isn't dirty, the LSN is below the page's recLSN, or the on-disk pageLSN is already at or past it. "The DBMS scans forward from log record containing smallest recLSN in the DPT." (5, Redo Phase)
- Redo writes no log and forces nothing. "Also, there is no additional logging or forced flushes." (5, Redo Phase)
- Undo reverses every transaction still active at the crash, in reverse LSN order, writing a CLR for each change. "In the last phase, the DBMS reverses all transactions that were active at the time of crash." (5, Undo Phase)
- A crash during recovery: just run recovery again. "If the database crashes during recovery in the Redo phase, then Redo everything again." (5, Crash Issues)
- A non-fuzzy checkpoint stops new transactions, waits for active ones and flushes dirty pages. "Halt the start of any new transactions." and "Wait until all active transactions finish executing." (4, Non-Fuzzy Checkpoints)

## Visuals worth redrawing

- Figure 4: the log with the checkpoint, the smallest recLSN, the oldest
  record of an active transaction, and the crash; A, R and U arrows.

## My notes

- Secondary, but the clearest walk-through of ARIES. Primary claims
  checked against mohan-aries-1992.

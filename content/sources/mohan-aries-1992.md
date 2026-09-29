---
id: mohan-aries-1992
title: "ARIES: A Transaction Recovery Method Supporting Fine-Granularity Locking and Partial Rollbacks Using Write-Ahead Logging"
author: C. Mohan, Don Haderle, Bruce Lindsay, Hamid Pirahesh, Peter Schwarz (IBM)
url: https://web.stanford.edu/class/cs345d-01/rl/aries.pdf
kind: paper
primary: true
---

## Summary

The IBM paper, ACM Transactions on Database Systems 17(1), 1992, pages
94-162, that defined the recovery method most WAL databases follow: an
LSN on every log record and every page, steal and no-force buffer
management, fuzzy checkpoints, and restart in three passes (analysis,
redo that repeats history for every transaction, then undo of the
losers) with compensation log records so undo is never undone. Read
from a scanned copy hosted for a Stanford course; sections 1, 4.2, 5.4,
6 and 10 opened.

## Key claims

- The WAL protocol: log records for a change must be on stable storage before the changed data replaces the old version on disk. "The WAL protocol asserts that the log records representing changes to some data must already be on stable storage before the changed data is allowed to replace the previous version of that data on nonvolatile storage." (1.1)
- WAL systems update pages in place, unlike shadow paging. "In WAL-based systems, an updated page is written back to the same nonvolatile storage location from where it was read." (1.1)
- Every page stores the LSN of its latest update, to enforce the protocol. "systems using the WAL method of recovery store in every page the LSN of the log record that describes the most recent update performed on that page." (1.1)
- A transaction isn't complete until the log is forced up to its commit record. "no transaction can be considered complete until its committed status and all its log data are safely recorded on stable storage by forcing the log up to the transaction's commit log record's LSN." (1.1)
- LSNs are assigned in ascending order, usually the log record's address. "Typically, they are the logical addresses of the corresponding log records." (1.1)
- Conceptually the log is an ever-growing sequential file. "Conceptually, the log can be thought of as an ever growing sequential file." (1.1)
- Steal: a page with uncommitted changes may be written to disk. "If a page modified by a transaction is allowed to be written to the permanent database on nonvolatile storage before that transaction commits, then the steal policy is said to be followed by the buffer manager" (1.4)
- Force: every page the transaction changed must be written before commit; otherwise no-force. "If a transaction is not allowed to commit until all pages modified by it are written to the permanent version of the database, then a force policy is said to be in effect." (1.4)
- Steal means undo work on disk; force means no redo for committed transactions. "Steal implies that during normal or restart rollback, some undo work might have to be performed on the non-volatile storage version of the database." and "With a force policy, during restart recovery, no redo work will be necessary for committed transactions." (1.4)
- Steal is still wanted even with big memory: under no-steal a hot page with overlapping uncommitted updates might never be written. "with a no-steal policy, a page may never get written to nonvolatile storage if the page always contains uncommitted updates" (2)
- CLRs log the updates made during rollback and are redo-only. "in ARIES, a CLR's update is never undone and hence CLRs are viewed as redo-only log records." (1.1)
- Chaining CLRs bounds logging during rollback even with repeated failures during restart. "a bounded amount of logging is ensured during rollbacks, even in the face of repeated failures during restart or of nested rollbacks." (3)
- Restart: analysis pass from the last checkpoint finds dirty pages and the losers, and the redo start point. "The analysis pass uses the dirty pages information to determine the starting point" (3)
- Redo repeats history for all transactions, even losers. "even the missing updates of the so-called loser transactions are redone" (3)
- Redo is conditional on the page LSN. "A log record's update is redone if the affected page's page-LSN is less than the log record's LSN." (3)
- No logging while redoing. "No logging is performed when updates are redone." (3)
- Undo rolls back all losers in reverse order in a single sweep of the log. "all loser transactions' updates are rolled back, in reverse chronological order, in a single sweep of the log." (3)
- Undo, unlike redo, is not conditional on the page LSN. "performing undos is not a conditional operation during the undo pass" (3)
- Fuzzy checkpoints run while updates go on: begin_chkpt, then end_chkpt holding the transaction table and dirty-pages table. "Checkpoints can be taken asynchronously (i.e., while transaction processing, including updates, is going on)." (5.4)
- The master record points to the begin_chkpt of the last complete checkpoint. "is stored in the master record which is in a well-known place on stable storage." (5.4)
- A checkpoint doesn't force any dirty pages; the buffer manager writes them in the background. "ARIES does not require that any dirty pages be forced to nonvolatile storage during a checkpoint." (5.4)
- System R did undo before redo and redid only committed work ("selective redo"); the paper argues that is wrong with WAL and record locking. "the System R paradigm of undo preceding redo is incorrect with WAL and fine-granularity locking." (10.1)

- Why selective redo breaks: if a loser changes a page (LSN 20) and a winner changes it later (LSN 30), redoing only the winner pushes the page LSN past 20, and undo can no longer tell whether 20 is on the page. "By not repeating history, the page-LSN is no longer a true indicator of the current state of the page." (10.1, figures 15 and 16)

- System R could redo selectively because it used shadow pages, so it never needed page LSNs to know what was on a page. "The use of the shadow page technique by System R makes it unnecessary to have the concept of" (10.1)

## Visuals worth redrawing

- Figure 6 (page 112): the log passes of DB2, System R, IMS and ARIES
  from the checkpoint to the failure. Redraw the ARIES row as our own
  timeline: analysis and redo forward, undo backward.

## My notes

- The PDF is a scan; quotes above were checked against its text layer,
  with OCR slips (PreuLSN, CLRS) corrected to the printed words.
- Claims marked (3) come from section 3, Overview of ARIES; the
  detailed passes are sections 6.1 to 6.3.

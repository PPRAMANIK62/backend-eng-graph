---
id: cmu-15445-storage2
title: "Lecture #04: Database Storage (Part II) (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/04-storage2.pdf
kind: docs
primary: false
---

## Summary

The second storage lecture (Fall 2024): the problems with slotted pages
updated in place, log-structured storage as the alternative, and
index-organized storage, where the table lives inside an index.

## Key claims

- Slotted pages updated in place suffer fragmentation, useless I/O and random I/O. "Fragmentation: Deletion of tuples can leave gaps in the pages, making them not fully utilized." (1 Log-Structured Storage)
- To change one tuple you read and write its whole block. "Useless Disk I/O: Due to the block-oriented nature of non-volatile storage, the whole block needs to be fetched to update a tuple." (1)
- Log-structured storage keeps log records of changes instead of updating tuples in pages. "Instead of storing tuples in pages and updating them in-place, the DBMS only stores the log records of changes to the tuples." (1, Overview)
- Changes go to an in-memory memtable, then out to disk as sorted, immutable files. "in-place updates are applied to the in-memory data structure since it is fast, while disk writes are sequential and existing pages are immutable which leads to reduced random disk I/O." (1)
- Reads check the memtable, then the files from newest to oldest. "To read a record, the DBMS first checks MemTable to see whether it exists." (1)
- Compaction merges files and keeps only the latest change per key. "the DBMS can periodically use a sort-merge algorithm to compact the log by taking only the most recent change for each tuple across several pages." (1, Compaction)
- The trade-offs: fast sequential writes, possibly slow reads, costly compaction, write amplification. "Subject to write amplification (for each logical write, there could be multiple physical writes)." (1, Tradeoffs)
- Page-oriented and log-structured storage both need a separate index because the table itself is unsorted. "both page-oriented storage and log-structured storage rely on additional index to find individual tuples because the tables are inherently unsorted." (2 Index-Organized Storage)
- Index-organized storage keeps the tuples inside the index. "In the index-organized storage scheme, the DBMS directly stores a table’s tuples as the value of an index data structure." (2)
- Values too big for a page go to overflow pages. "The ones that do store the data on a special “overflow” page and have the tuple contain a reference to that page." (3, Variable-Length Data)
- Updating in place means random I/O. "Random Disk I/O: The disk reader could have to jump to 20 different places to update 20 different tuples, which can be very slow." (1)

## Visuals worth redrawing

None.

## My notes

- Short on log-structured details; the LSM nodes need primary sources.

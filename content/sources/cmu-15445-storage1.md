---
id: cmu-15445-storage1
title: "Lecture #03: Database Storage (Part I) (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/03-storage1.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition, on
how a disk-oriented database lays data out: files made of fixed-size
pages, page ids, heap files, the slotted page layout and tuple layout.

## Key claims

- A disk-oriented database keeps its data in pages on disk and moves them through a buffer pool. "The database is all on disk, and the data in database files is organized into pages, with the first page being the directory page." (2 Disk-Oriented DBMS Overview)
- The execution engine asks the buffer pool for a page and gets a pointer. "The execution engine will ask the buffer pool for a specific page, and the buffer pool will take care of bringing that page into memory and giving the execution engine a pointer to that page in memory." (2)
- The OS knows nothing about what is inside database files. "The OS does not know anything about the contents of these files." (4 File Storage)
- Some databases use many files, some one file. "Some may use a file hierarchy, others may use a single file (e.g., SQLite)." (4)
- Pages are fixed-size blocks and each has an id. "The DBMS organizes the database across one or more files in fixed-size blocks of data called pages." (5 Database Pages)
- A layer maps page ids to a file and offset. "Most DBMSs have an indirection layer that maps a page id to a file path and offset." (5)
- Fixed-size pages avoid the holes that variable-size pages leave. "Most DBMSs uses fixed-size pages to avoid the engineering overhead needed to support variable-sized pages." (5)
- Three meanings of page: hardware (usually 4 KB), OS (4 KB), database (1-16 KB). "3. Database page (1-16 KB)." (5)
- A database page bigger than the device's atomic write unit can be torn. "if our database page is larger than our hardware page, the DBMS will have to take extra measures to ensure that the data gets written out safely" (5)
- A heap file is an unordered collection of pages. "A heap file is an unordered collection of pages where tuples are stored in random order." (6 Database Heap)
- A page directory tracks data pages and their free space. "DBMS maintains special pages, called page directory, to track locations of data pages, the amount of free space on each page, a list of free/empty pages and the page type." (6)
- The page header holds metadata such as page size, checksum and version. (7 Page Layout, bullet list)
- Slotted pages are the most common layout. "Most common approach used in DBMSs today." (7, Slotted Pages)
- The slot array grows from the front, tuple data from the back; the page is full when they meet. "The page is considered full when the slot array and the tuple data meet." (7)
- A tuple has a header with visibility info and a null bitmap; the schema isn't stored in it. "Note that the DBMS does not need to store meta-data about the schema of the database here." (8 Tuple Layout)
- Most databases don't let a tuple be bigger than a page. "Most DBMSs do not allow a tuple to exceed the size of a page." (8)
- A record id is usually page id plus slot. "Most common: page id + (offset or slot)." (8)
- Applications shouldn't rely on record ids. "An application cannot rely on these ids to mean anything." (8)
- In a single-file database the page id can be the file offset. "If the database is a single file, then the page id can just be the file offset." (5)
- Read-only databases use bigger pages. "DBMSs that specialize in read-only workloads have larger page sizes." (5)
- The device writes one hardware page atomically. "The storage device guarantees an atomic write of the size of the hardware page." (5)

## Visuals worth redrawing

- The slotted page (slot array from the front, tuples from the back). Redrawn in `database-pages`.

## My notes

- Course notes, not a primary source for any one database. Cross-check
  specifics against the Postgres and SQLite docs.

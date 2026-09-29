---
id: cmu-15445-buffer-pool
title: "Lecture #06: Buffer Pools (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/06-bufferpool.pdf
kind: docs
primary: false
---

## Summary

CMU's Fall 2024 lecture on the buffer pool: frames, the page table,
pins and dirty flags, why the database doesn't hand this job to the OS,
replacement policies (LRU, CLOCK, LRU-K), and optimizations such as
multiple pools, prefetching, scan sharing and bypass.

## Key claims

- The buffer pool moves pages between memory and disk and acts as a cache. "It also behaves as a cache, keeping frequently used pages in memory for faster access, and evicting unused or cold pages back out to storage." (1 Introduction)
- To the rest of the database it looks as if everything is in memory. "From the DBMS’s perspective, it should “appear” as if the entire database resides in memory" (1)
- It is an array of fixed-size frames. "It is organized as an array of fixed-size frames." (2 Buffer Pool)
- It is a write-back cache: dirty pages are not written right away. "We consider the buffer pool manager as a write-back cache, where dirty pages are buffered and not written to disk immediately on mutation." (2)
- The page table is an in-memory hash table from page id to frame. "The page table is an in-memory hash table that keeps track of pages that are currently in memory." (2, Buffer Pool Metadata)
- Each page has a dirty flag and a pin count. "table also maintains additional meta-data per page, a dirty flag, and a pin / reference counter." (2)
- A pinned page can't be evicted. "If a page’s pin count is greater than zero, then the storage manager is not allowed to evict that page from memory." (2)
- Page table (in memory, page id to frame) is not the page directory (on disk, page id to file location). "The page table is the mapping from page ids to a copy of the page in buffer pool frames." (2, Page Table vs. Page Directory)
- Locks protect database contents for transactions; latches protect internal data structures for the length of an operation. "Latches are held for only the duration of the operation being made." (3, Locks vs. Latches)
- Four problems with relying on mmap and the OS: transaction safety, I/O stalls, error handling, performance. "Transaction Safety: The OS can flush dirty pages at any time." (3, Why not use the OS?)
- What the database can do better: flush in the right order, prefetch, replace, schedule. "Flushing dirty pages to disk in the correct order." (3)
- LRU with exact timestamps costs too much. "keeping the data structure sorted and storing a large timestamp has a prohibitive overhead." (4, LRU)
- CLOCK approximates LRU with one reference bit per page and a sweeping hand. "The CLOCK policy is an approximation of LRU without needing a separate timestamp per page." (4, CLOCK)
- Both are vulnerable to sequential flooding. "LRU and CLOCK are both susceptible to sequential flooding, where the buffer pool’s contents are polluted due to a sequential scan." (4, Issues)
- LRU-K keeps the last K reference times. "One solution is LRU-K which tracks the history of the last K references as timestamps" (4, Alternatives)
- Evicting a clean page is fast; a dirty page must be written first. "The fast path is when the page is not dirty, and the buffer pool manager can simply drop it." (4, Dirty Pages)
- Background writing cleans dirty pages ahead of eviction. "Through background writing, the DBMS can periodically walk through the page table and write dirty pages to disk." (4)
- Most databases use O_DIRECT; Postgres uses the OS page cache. "PostgreSQL is an example of a database system that uses the OS’s page cache." (5 Disk I/O and OS Cache)
- Why O_DIRECT: no double copies, no second eviction policy. "Most DBMS use Direct I/O (via the O DIRECT flag) to bypass the OS’s cache to avoid redundant copies of pages and having to manage different eviction policies." (5)
- A sequential scan can bypass the buffer pool. "The sequential scan operator will not store fetched pages in the buffer pool to avoid overhead." (6, Buffer Pool Bypass)
- With every frame pinned and the pool full, a request fails. "If the buffer pool runs out of non-pinned pages to evict and the buffer pool is full, an out-of-memory error will be thrown." (2)

## Visuals worth redrawing

- Figure 3, CLOCK: pages in a circle with reference bits and a hand. Redrawn in `buffer-pool`.

## My notes

- "The OS is not your friend" is the course's stance; see
  chu-mmap-response for the opposite view on mmap.

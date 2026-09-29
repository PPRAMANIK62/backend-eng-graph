---
id: mysql-innodb-buffer-pool
title: "MySQL 8.4 Reference Manual, 17.5.1 Buffer Pool"
author: Oracle
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-buffer-pool.html
kind: docs
primary: true
---

## Summary

InnoDB's buffer pool (MySQL 8.4): what it caches, how big it usually is
on a dedicated server, and its LRU variant with midpoint insertion,
which splits the list into a young and an old sublist.

## Key claims

- The buffer pool caches table and index data in memory. "The buffer pool is an area in main memory where InnoDB caches table and index data as it is accessed." (17.5.1)
- On dedicated servers up to 80% of memory often goes to it. "On dedicated servers, up to 80% of physical memory is often assigned to the buffer pool." (17.5.1)
- It is a linked list of pages aged out by an LRU variant. "the buffer pool is implemented as a linked list of pages; data that is rarely used is aged out of the cache using a variation of the least recently used (LRU) algorithm." (17.5.1)
- New pages go in at the middle of the list. "When room is needed to add a new page to the buffer pool, the least recently used page is evicted and a new page is added to the middle of the list." (Buffer Pool LRU Algorithm)
- By default 3/8 of the pool is the old sublist. "3/8 of the buffer pool is devoted to the old sublist." (same)
- A page read in goes to the head of the old sublist. "When InnoDB reads a page into the buffer pool, it initially inserts it at the midpoint (the head of the old sublist)." (same)
- Accessing an old page makes it young. "Accessing a page in the old sublist makes it “young”, moving it to the head of the new sublist." (same)
- Unused pages drift to the tail of the old sublist and are evicted. "Eventually, a page that remains unused reaches the tail of the old sublist and is evicted." (same)
- Without tuning, a table scan can still push hot pages out. "A table scan, performed for a mysqldump operation or a SELECT statement with no WHERE clause, for example, can bring a large amount of data into the buffer pool and evict an equivalent amount of older data, even if the new data is never used again." (same)

## Visuals worth redrawing

- Figure 17.2, the buffer pool list with the midpoint. Redrawn as part of the eviction figure in `buffer-pool`.

## My notes

- Compare with Postgres, which keeps shared_buffers smaller and leans on
  the OS page cache (postgres-runtime-config-resource).

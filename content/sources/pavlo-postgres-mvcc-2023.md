---
id: pavlo-postgres-mvcc-2023
title: The Part of PostgreSQL We Hate the Most
author: Andy Pavlo, Bohan Zhang
url: https://www.cs.cmu.edu/~pavlo/blog/2023/04/the-part-of-postgresql-we-hate-the-most.html
kind: blog
primary: false
---

## Summary

A 2023 post (first on the OtterTune blog) arguing that Postgres's MVCC
design, whole-row copies in the heap plus autovacuum, is the worst among
the big relational databases. Explains the version chain order, why every
index points at every version, HOT, and what bloat and vacuum cost.
Opinionated, from a database researcher who sells Postgres tuning.

## Key claims

- MVCC never overwrites a row; it keeps several physical versions of each logical row. "The basic idea of MVCC is that the DBMS never overwrites existing rows. Instead, for each (logical) row, the DBMS maintains multiple (physical) versions." (What is MVCC)
- First described in David Reed's 1978 dissertation; first commercial implementation InterBase. "The first commercial DBMS implementation of MVCC was InterBase in the 1980s." (What is MVCC)
- The three design questions. "How to store updates to existing rows." / "How to find the correct version of a row for a query at runtime." / "How to remove expired versions that are no longer visible." (What is MVCC)
- Postgres copies the row on update into a new slot in the same table. "when a query updates an existing row in a table, the DBMS makes a copy of that row and applies the changes to this new version instead of overwriting the original row." (PostgreSQL's MVCC)
- Most systems chain newest-to-oldest; Postgres chains oldest-to-newest. "Most DBMSs, including Oracle and MySQL, implement N2O. But PostgreSQL stands alone in using O2N (except for Microsoft’s In-Memory OLTP engine for SQL Server)." (PostgreSQL's MVCC)
- To avoid walking chains, Postgres puts an index entry for each physical version. "To avoid traversing the entire version chain, PostgreSQL adds an entry to a table’s indexes for each physical version of a row." (PostgreSQL's MVCC)
- MySQL and Oracle store a compact delta instead of a whole copy. "Instead of copying an entire tuple for a new version, MySQL and Oracle store a compact delta between the new and current versions (think of it like a git diff)." (Problem 1)
- zheap, an attempt at delta versions in Postgres, stalled. "EnterpriseDB started the zheap project in 2013 to replace the append-only storage engine to use delta versions." (Problem 1)
- Dead tuples share pages with live ones, so scans read them. "The DBMS has to load dead tuples into memory during query execution since the system intermingles dead tuples with live tuples in pages." (Problem 2)
- Vacuum frees space inside pages but doesn't give pages back. "The autovacuum only removes dead tuples and relocates live tuples within each page, but it does not reclaim empty pages from the disk." (Problem 2)
- Oracle and MySQL secondary indexes hold a logical id, not a physical address. "Instead, they store a logical identifier (e.g., tuple id, primary key) that the DBMS then uses to look up the current version’s physical address." (Problem 3)
- Uber's post got the chain direction wrong. "Specifically, each tuple in PostgreSQL stores a pointer to the new version, not the previous one, as stated in the blog." (Problem 3, side comment)
- At the 20% default scale factor, a 100-million-row table waits for 20 million updates. "This threshold means that if a table has 100 million tuples, the DBMS does not trigger the autovacuum until queries update at least 20 million tuples." (Problem 4)
- Long-running transactions block vacuum and it spirals. "Another problem with the autovacuum in PostgreSQL is that it may get blocked by long-running transactions, which can result in the accumulation of more dead tuples and stale statistics." (Problem 4)
- Multi-versioning was in the design from the start. "As discussed in Stonebraker’s system design document from 1987, PostgreSQL was designed from the beginning to support multi-versioning." (PostgreSQL's MVCC)
- The 1980s version kept every old version, for time-travel queries. "The original version of PostgreSQL from the 1980s did not remove dead tuples." (PostgreSQL's MVCC)
- With HOT the index keeps pointing at the old version and readers follow the chain. "Now in our example, after the update the index still points to the old version and queries retrieve the latest version by traversing the version chain." (PostgreSQL's MVCC)
- Reed's dissertation. "David Reed’s 1978 MIT Ph.D. dissertation, “Concurrency Control in Distributed Database Systems,” was, we believe, the first publication to describe MVCC." (What is MVCC)
- HOT's two conditions. "The DBMS uses the HOT approach if an update does not modify any columns referenced by a table’s indexes and the new version is stored on the same data page as the old version (if there is space in that page)." (PostgreSQL's MVCC)
- Readers of old versions aren't blocked by writers. "The benefit of this approach is that multiple queries can read older versions of rows without getting blocked by another query updating it." (What is MVCC)
- Index write amplification is why Uber left. "For Uber’s specific write-intensive workload, PostgreSQL’s index write amplification due to MVCC is why they switched to MySQL." (Conclusion)
- zheap's status. "Unfortunately the last official update was in 2021, and to the best of our knowledge the effort has fizzled out." (Problem 1)

## Visuals worth redrawing

- The movies-table figures: an update making a new version on another
  page, and the index pointing at both versions.

## My notes

- The post calls the Wu et al. paper "our 2018 VLDB paper"; the PDF says
  PVLDB volume 10 (2017). Cite the paper's own year.
- The 20 million example predates PostgreSQL 18's
  autovacuum_vacuum_max_threshold (default 100,000,000), which caps the
  trigger. With the cap, the 20% rule still decides for a 100-million-row
  table (20 million is below 100 million); the cap only matters above
  about 500 million rows. Arithmetic from the documented defaults.
- The 46% HOT figure is from OtterTune's customers, not reproducible
  here. Not used.

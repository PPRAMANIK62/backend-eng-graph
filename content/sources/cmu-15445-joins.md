---
id: cmu-15445-joins
title: "Lecture #12: Join Algorithms (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/12-joins.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition, on
how a database executes a two-table equi-join: nested loop (naive,
block, index), sort-merge and hash (basic, Grace/partitioned, hybrid),
with a disk I/O cost model and a worked comparison.

## Key claims

- Normalized designs need joins to put data back together. "The goal of a good database design is to minimize unnecessary information repetition. This is why tables are often composed based on normalization theory. Joins are therefore needed to reconstruct the original tables." (1 Introduction)
- Computing the full cross product and filtering is the inefficient baseline. "However, the cross-product is huge and results in a very inefficient approach." (2, Cost Analysis)
- No single algorithm wins everywhere. "In general, there will be many algorithms/optimizations which can reduce join costs in some cases, but no single algorithm works well in every scenario." (2)
- Nested loop: two loops comparing every pair; the smaller table goes outside. "The DBMS will always want to use the “smaller” table as the outer table." (3)
- Naive nested loop scans the whole inner table for every outer tuple. "This is the worst-case scenario where the DBMS must scan the entirety of the inner table for each tuple in the outer table without any caching or access locality." (3)
- Index nested loop probes an index on the inner table instead of scanning it. "However, if the database already has an index for one of the tables on the join key, it can use that to speed up the comparison." (3, Index Nested Loop Join)
- Sort-merge sorts both sides on the key and walks them with cursors. "At a high level, a sort-merge join sorts the two tables on their join key(s)." (4)
- Sort-merge is useful when input is already sorted or output must be sorted. "This algorithm is useful if one or both tables are already sorted on join attribute(s) (like with a clustered index) or if the output needs to be sorted on the join key anyway." (4)
- Its worst case is every row having the same key. "The worst-case scenario for this algorithm is if the join attribute for all the tuples in both tables contains the same value, which is very unlikely to happen in real databases." (4)
- Hash join works only for equality on the whole join key. "Hash joins can only be used for equi-joins on the complete join key." (5)
- Hash join has a build phase and a probe phase. "Phase #1 – Build: First, scan the outer relation and populate a hash table using the hash function h1 on the join attributes." (5, Basic Hash Join)
- Collisions mean the probe must still compare the real key values. "Since there may be collisions in the hash table, the DBMS must examine the original values of the join attribute(s) to determine whether tuples satisfy the join condition." (5)
- When tables don't fit in memory, Grace hash join partitions both sides to disk first. "The Grace Hash Join is an extension of the basic hash join that also hashes the inner table into partitions that are written out to disk." (5)
- Worked example with M = 1000, N = 500 pages, 0.1 ms per I/O: simple nested loop "1.4 hours", block nested loop "50 seconds", sort-merge "0.75 seconds", hash join "0.45 seconds". (6, Figure 1; assumed numbers, not a measurement)
- Hash usually wins, with exceptions. "Hash joins are almost always better than sort-based join algorithms, but there are cases in which sorting-based joins would be preferred." (6)
- The natural join is the most common operation to optimize. "is the most common operation and must be carefully optimized." (2, Cost Analysis)
- The outer (build-side, for hash join) table should be the smaller one. "For binary joins, we often prefer the left table (the ”outer table” ) to be the smaller one of the two." (1 Introduction)
- Grace hash join costs 3(M+N) I/Os: partitioning reads and writes both inputs, then probing reads them again. "Partitioning Phase Cost: 2 × (M + N )" / "Probe Phase Cost: (M + N )" (5, Grace Hash Join)

## Visuals worth redrawing

- Figure 1: cost table of the five algorithms.

## My notes

- These notes call the build side the "outer" table; Postgres's planner
  docs load the right (inner) relation into the hash table. Naming
  differs; both put the smaller input in the hash table.

---
id: abadi-column-vs-row-2008
title: "Column-Stores vs. Row-Stores: How Different Are They Really?"
author: Daniel J. Abadi, Samuel R. Madden, Nabil Hachem
url: https://www.cs.umd.edu/~abadi/papers/abadi-sigmod08.pdf
kind: paper
primary: true
---

## Summary

SIGMOD 2008. The authors try hard to make a commercial row store
("System X") behave like a column store (one table per column, index-only
plans, materialized views) on the Star Schema Benchmark, and compare it
with C-Store. The row store stays much slower. Then they switch off
C-Store's column-specific tricks one at a time to see which ones matter:
compression, late materialization, block iteration and invisible joins.

## Key claims

- Column stores beat row stores by more than an order of magnitude on analytical workloads, and the simple explanation is I/O. "column-stores are more I/O efficient for read-only queries since they only have to read from disk (or from memory) those attributes accessed by a query." (Abstract)
- You can't get the same result by making a row store look columnar. "In this paper, we demonstrate that this assumption is false." (Abstract, on emulating a column store in a row store)
- The gap is in the executor too, not just storage. "changes must be made to both the storage layer and the query executor to fully obtain the benefits of a column-oriented approach." (Abstract)
- Compression can give an order of magnitude when it applies; late materialization about 3x; block iteration and invisible joins about 1.5x on average. "whereas late materialization offers about a factor of 3 performance gain across the board." (1 Introduction)
- Plain columnar storage without compression and late materialization doesn't beat a well-tuned row store by much. "simple column-oriented operation – without compression and late materialization – does not dramatically outperform well-optimized row-store designs." (1 Introduction, contribution 3; "well-optimized" split across a line)
- Block iteration passes a block of column values to an operator instead of one tuple at a time. "multiple values from a column are passed as a block from one operator to the next, rather than using Volcano-style per-tuple iterators" (1 Introduction)
- Late materialization plus block iteration is also called vectorized query processing. "this technique is also known as vectorized query processing" (1 Introduction)
- Columns compress better because values in one column look alike. "Intuitively, data stored in columns is more compressible than data stored in rows." (5.1 Compression)
- A sorted column compresses extremely well, for example with run-length encoding. "if the data is sorted by one of the columns, that column will be super-compressible (for example, runs of the same value can be run-length encoded)." (5.1)
- Compression saves I/O time, not just disk space, so light schemes that decompress fast can beat heavy ones. "compression improves performance (in addition to reducing disk space) since if data is compressed, then less time must be spent in I/O" (5.1)
- Operating on compressed data (RLE) lets the executor handle many values at once. "operating directly on compressed data results in the ability of a query executor to perform the same operation on multiple column values at once, further reducing CPU costs." (5.1)
- In a row store, any variable-width attribute makes the whole tuple variable-width. "In a row-store, if any attribute in a tuple is variable-width, then the entire tuple is variable width." (5.2 Late Materialization)
- Tuple-at-a-time processing costs one or two function calls per value in systems like MySQL. "this leads to tuple-at-a-time processing, where there are 1-2 function calls to extract needed data from a tuple for each operation" (5.3 Block Iteration)
- Vertically partitioned row stores pay a per-row header and a stored record id on every column table. "this represents about 8 bytes of overhead per row, plus about 4 bytes each for the record-id and the column attribute" (6.2)
- In C-Store one integer column of the 60-million-row fact table takes 240 MB; the whole compressed table 2.3 GB. "in C-Store, a single column of integers takes just 240 MB" (6.2)
- Column stores don't store the row id: the i-th value of each column belongs to the i-th row. "they use implicit column positions to reconstruct columns (the ith value from each column belongs to the ith tuple in the table)." (6.3 Tuple Overhead and Join Costs)
- C-Store was about six times faster than the row store in the base case, three times faster than the row store with ideal materialized views. "C-Store outperforms System X by a factor of six in the base case, and a factor of three when System X is using materialized views." (6.1)
- Compression gives order-of-magnitude gains when it applies, less in other cases. "We find that compression can offer order-of-magnitude gains when it is possible, but that the benefits are less substantial in other cases" (1 Introduction, "order-of-magnitude" split across a line)
- Block iteration and invisible joins gave about 1.5x on average. "Other optimizations – including block iteration and our new invisible join technique, offer about a factor 1.5 performance gain on average." (1 Introduction)
- One column of the vertically partitioned fact table (60 million rows) took 0.7 to 1.1 GB after compression. "a single column-table from our SSBM scale 10 lineorder table (with 60 million tuples) requires between 0.7 and 1.1 GBytes of data after compression to store" (6.2)
- So scanning four such columns cost as much as scanning the whole row table. "scanning just four of the columns in the vertical partitioning approach will take as long as scanning the entire fact table in the traditional approach." (6.2)

## Visuals worth redrawing

- Figure 5: average query time for the row store, row store with
  materialized views, and C-Store. Numbers are from their 2008 hardware;
  not redrawn.

## My notes

- Setup: SSBM at scale 10 (60 million fact rows), a commercial row store
  they can't name, and C-Store. Numbers are specific to that setup.

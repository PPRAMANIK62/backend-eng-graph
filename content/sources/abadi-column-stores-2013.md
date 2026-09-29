---
id: abadi-column-stores-2013
title: The Design and Implementation of Modern Column-Oriented Database Systems
author: Daniel Abadi, Peter Boncz, Stavros Harizopoulos, Stratos Idreos, Samuel Madden
url: https://www.cs.umd.edu/~abadi/papers/abadi-column-stores.pdf
kind: paper
primary: true
---

## Summary

A survey monograph (Foundations and Trends in Databases, vol. 5 no. 3,
2013) by the people behind C-Store, MonetDB and VectorWise. It covers
the trade-offs of row vs column layout, vectorized execution,
column-specific compression, late materialization, joins, and how column
stores cope with inserts, updates and deletes.

## Key claims

- Column stores split a table into columns stored separately. "Column-store systems completely vertically partition a database into a collection of individual columns that are stored separately." (1 Introduction)
- By late 2013 every major vendor shipped a column store. "by late 2013 all major vendors have followed this trend and shipped column-store implementations in their database system offerings" (1 Introduction)
- A row store has to read the surrounding attributes along with the ones it needs. "there is no way to read just the particular attributes needed for a particular query without also transferring the surrounding attributes." (1 Introduction)
- On disk, reading one record from a column store costs a seek per column; for many records the reads amortize and columns win. "a column-store will have to seek several times (to all columns/files of the table referenced in the query) to read just this single record." (1 Introduction, Tradeoffs)
- That's why column stores are used for analytics. "For this reason, column-stores are typically used in analytic applications, with queries that scan a large fraction of individual tables and compute aggregates or other statistics over them." (1 Introduction)
- Virtual ids: the position of a value in the column is its row id, so no id is stored. "modern column-stores avoid storing this ID column by using the position (offset) of the tuple in the column as a virtual identifier" (1 Introduction)
- With fixed-width columns, finding the i-th value is simple arithmetic. "accessing the i-th value in column A simply requires to access the value at the location startOf (A) + i ú width(A)." (1 Introduction; the PDF renders the multiplication sign as "ú")
- Late materialization delays joining columns back into rows. "Late materialization or late tuple reconstruction refers to delaying the joining of columns into wider tuples." (1 Introduction)
- Loading can be slow because each column is written separately and kept compressed; C-Store buffers writes first. "one concern with column-stores is that they may be slower to load and update than row-stores, because each column must be written separately, and because data is kept compressed." (1 Introduction)
- PAX: a row-store page organized internally by column; helps memory-to-CPU transfer, not disk I/O. "each page is internally organized in columns; this does not help with disk I/O but allows for less data to be transferred from main-memory to the CPU." (1 Introduction)
- Two classic execution models: tuple-at-a-time (Volcano) and full materialization. "The next() method of each relational operator in a query tree produces one new tuple at-a-time" (4.1 Vectorized Processing)
- Vectorized execution, pioneered in VectorWise, sits between the two: next() returns a vector of N tuples. "the next() method of each operator returns a vector of N tuples as opposed to only a single tuple." (4.1)
- Vectors are sized to fit in L1 cache, about 1000 values in VectorWise. "each vector comfortably fits in L1 cache (N = 1000 is typical in VectorWise)" (4.1)
- Interpretation overhead drops by the vector size. "The amount of function calls performed by the query interpreter goes down by a factor equal to the vector size compared to the tuple-at-a-time model." (4.1)
- On TPC-H Q1 that can be two orders of magnitude. "On computationally intensive queries, e.g., TPC-H Q1, this can improve performance by two orders of magnitude." (4.1)
- Tight loops over arrays let compilers produce SIMD instructions. "are amenable to some of the most productive compiler optimizations, and typically also trigger compilers to generate SIMD instructions." (4.1)
- Tight loops let the CPU have several cache misses outstanding at once. "Algorithms that perform memory accesses in a tight vectorized loop on modern CPUs are able to generate multiple outstanding cache misses" (4.1)
- Vectorized execution isn't tied to column storage. "the principle can also be applied to row stores as it is not tied to the storage manager." (4.1)
- Compression packs more values per SIMD register. "If data is compressed by a factor of 2 though, then we will be able to fit 8 compressed integers in the SIMD register" (4.2 Compression)
- Run-length encoding replaces runs with (value, start, length) triples; it suits sorted columns. "Thus, it is well-suited for columns that are sorted or that have reasonable-sized runs of the same value." (4.2.1)
- Dictionary encoding suits columns with a few frequent values and turns string predicates into integer ones. "Dictionary compression normally lends itself to optimizing queries by rewriting predicates on strings into predicates on integers (which are faster)" (4.2.3)
- Frame of reference: a base plus small offsets, e.g. 1003, 1001, 1007, 1006, 1004 becomes 1000, 3, 1, 7, 6, 4. "the sequence of values: 1003, 1001, 1007, 1006, 1004 can be represented as: 1000, 3, 1, 7, 6, 4." (4.2.4)
- Column stores are more sensitive to updates: one row update touches one file per column. "Inherently, column-stores are more sensitive to updates compared to row-stores." (4.7 Inserts/updates/deletes)
- Compression makes updates costlier: decompress, change, recompress. "compression makes updates computationally more expensive and complex since data needs to be de-compressed, updated and re-compressed before being written back to disk." (4.7)
- C-Store and MonetDB split into a read-store and a write-store and merge them at query time. "handle updates by splitting their architecture into a “readstore” that manages the bulk of all data and a “write-store” that manages updates that have been made recently." (4.7, "read-store" split across a line in the PDF)
- VectorWise handles updates with Positional Delta Trees, which cut the merge overhead at query time. "The Positional Delta Tree (PDT) data structure of VectorWise significantly reduces this overhead" (4.7; the PDF prints "VectorWise0" and splits "overhead" across a line)

## Visuals worth redrawing

- Figure 1.1: the same Sales table as a column store with virtual ids,
  a column store with explicit ids, and a row store.

## My notes

- The Figure 1.2 bar chart (removing optimizations one by one) is from
  the 2008 SIGMOD paper; the numbers there belong to that setup.

---
id: boncz-monetdb-x100-2005
title: "MonetDB/X100: Hyper-Pipelining Query Execution"
author: Peter Boncz, Marcin Zukowski, Niels Nes
url: https://www.cidrdb.org/cidr2005/papers/P19.pdf
kind: paper
primary: true
---

## Summary

The CIDR 2005 paper that introduced vectorized query execution. It
profiles TPC-H Query 1 on MySQL and finds most time goes to
interpreting one tuple at a time; it shows MonetDB's column-at-a-time
model hits memory bandwidth instead. X100 keeps the Volcano pipeline but
passes small vectors of column values (about 1000) that fit in the CPU
cache. X100 later became VectorWise.

## Key claims

- Database systems get low instructions-per-cycle on analytical work. "Database systems tend to achieve only low IPC (instructions-per-cycle) efficiency on modern CPUs in compute-intensive application areas like decision support, OLAP and multimedia retrieval." (Abstract)
- The usual Volcano iterator leads to tuple-at-a-time execution, with high interpretation overhead and hidden parallelism. "leads to tuple-at-a-time execution, which causes both high interpretation overhead, and hides opportunities for CPU parallelism from the compiler." (1 Introduction)
- MonetDB's column-at-a-time model avoids that but materializes whole columns and becomes memory-bound. "we found MonetDB/MIL to become heavily constrained by memory bandwidth, causing its CPU efficiency to drop sharply." (1 Introduction)
- X100 combines column-wise execution with Volcano-style pipelining. "we argue for combining the column-wise execution of MonetDB with the incremental materialization offered by Volcano-style pipelining." (1 Introduction)
- In MySQL 4.1 on TPC-H Q1, the operations doing the real work were only 10% of execution time. "The first observation to make is that the five operations that do all the “work” (displayed in boldface), correspond to only 10% of total execution time." (3.1)
- 28% went to the aggregation hash table, and the rest mostly to navigating MySQL's record format. "The remaining 62% of execution time is spread over functions like rec get nth field, that navigate through MySQL’s record representation and copy data in and out of it." (3.1)
- One addition cost 38 instructions in MySQL. "Item func plus::val has a cost of 38 instructions per addition." (3.1)
- Vectors: small vertical chunks of cache-resident data, about 1000 values. "Small (e.g. 1000 values) vertical chunks of cache-resident data items, called “vectors” are the unit of operation for X100 execution primitives." (4 X100)
- Vectorized primitives tell the compiler each tuple is independent of the next. "CPU vectorized primitives expose to the compiler that processing a tuple is independent of the previous and next tuples." (4 X100)
- A select produces a selection vector of positions instead of copying the qualifying data. "after a selection, leaving the vectors delivered by the child operator intact is often quicker than copying all selected data into new (contiguous) vectors." (4.2)
- X100 has hundreds of primitives, generated from patterns rather than written by hand. "X100 contains hundreds of vectorized primitives." (4.2)
- Default vector size 1024; with a vector size of 1 X100 suffers MySQL's interpretation overhead. "X100 uses a default vector size of 1024, but users can override it." (5.1.1 Vector Size Impact)
- The best size was about 1000, with 128 to 8K all working well; too big and vectors fall out of cache. "For this query and these platforms, the optimal vector size seems to be 1000, but all values between 128 and 8K actually work well." (5.1.1)
- Performance drops once intermediate results no longer fit in cache. "Performance starts to deteriorate when intermediate results do not fit in the cache anymore." (5.1.1)
- Overall X100's raw execution was one to two orders of magnitude above earlier technology on TPC-H at 100 GB. "showing its raw execution power to be between one and two orders of magnitude higher than previous technology." (Abstract)
- The aggregation hash table took 28% of MySQL's time on Q1. "28% of execution time is taken up by creation and lookup in the hash-table used for aggregation." (3.1, text interleaved with a table in the PDF)
- TPC-H is a decision-support benchmark. "in particular the TPC-H decision support benchmark." (1 Introduction)
- Query 1 scans lineitem and selects almost all rows. "Query 1 is a scan on the lineitem table of SF*6M tuples, that selects almost all tuples (SF*5.9M)" (3.1, text interleaved across columns)

## Visuals worth redrawing

- Figure 10: query time against vector size, a U-shaped curve (slow at
  1, flat from about 128 to 8K, rising again when vectors spill out of
  cache). Shape only; the numbers are from 2005 CPUs.

## My notes

- The CPUs in the paper (Itanium2, AthlonMP) are long gone; use the
  ideas, not the timings.

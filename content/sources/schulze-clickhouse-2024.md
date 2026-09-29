---
id: schulze-clickhouse-2024
title: "ClickHouse - Lightning Fast Analytics for Everyone"
author: Robert Schulze, Tom Schreiber, Ilya Yatsishin, Ryadh Dahimene, Alexey Milovidov
url: https://www.vldb.org/pvldb/vol17/p3731-schulze.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2024 paper on ClickHouse by its developers. Covers the
MergeTree storage (immutable sorted parts, merged in the background,
column files split into granules and compressed blocks), how updates and
deletes work on that append-friendly design, and query processing
(vectorized like X100, SIMD kernels, and LLVM compilation for hot
expressions). Features pinned to ClickHouse v24.6.

## Key claims

- A table is a set of immutable parts; each insert creates a part and background merges combine them. "Each table in the MergeTree* table engine is organized as a collection of immutable table parts." (3.1 On-Disk Format)
- Clients should insert in bulk to keep merge overhead down. "database clients are encouraged to insert tuples in bulk, e.g. 20,000 rows at once." (3.1)
- There's an asynchronous insert mode that buffers small inserts into one part. "ClickHouse buffers rows from multiple incoming INSERTs into the same table and creates a new part only after the buffer size exceeds a configurable threshold or a timeout expires." (3.1)
- A part is a directory with one file per column. "A part corresponds to a directory on disk, containing one file for each column." (3.1)
- Rows are grouped into granules of 8192. "The rows of a part are further logically divided into groups of 8192 records, called granules." (3.1)
- Blocks of about 1 MB are compressed, with LZ4 by default. "By default, ClickHouse employs LZ4 [75] as a general-purpose compression algorithm" (3.1)
- Codecs can be chained, e.g. delta coding, then heavy compression, then encryption. "it is possible to first reduce logical redundancy in numeric values using delta coding [23], then perform heavy-weight compression, and finally encrypt the data using an AES codec." (3.1)
- The design favours append-only workloads; updates and deletes are occasional. "The design of the MergeTree* table engines favors append-only workloads, yet some use cases require to modify existing data occasionally" (3.4 Updates and Deletes)
- A delete mutation rewrites every column of every part. "Delete mutations are still expensive as they rewrite all columns in all parts." (3.4)
- Lightweight deletes only mark rows in a bitmap column, at the cost of slower reads. "lightweight deletes only update an internal bitmap column, indicating if a row is deleted or not." (3.4)
- Operators pass chunks of rows, like X100, to cut virtual calls. "ClickHouse uses the same vectorization model as MonetDB/X100 [11], i.e. operators produce, pass, and consume multiple rows (data chunks) instead of single rows to minimize the overhead of virtual function calls." (4 Query Processing Layer)
- Hot loops are compiled into several kernels (plain, AVX2, AVX-512) and the fastest is picked at runtime. "The fastest kernel is chosen at runtime based on the cpuid instruction." (4.2 SIMD Parallelization)
- ClickHouse also compiles some expressions with LLVM, fusing operators. "the expression a * b + c + 1 can be combined into a single operator instead of three operators." (4.4, Query compilation)
- Compilation reduces virtual calls and keeps data in registers. "Query compilation decreases the number of virtual calls, keeps data in registers or CPU caches, and helps the branch predictor as less code needs to execute." (4.4)
- Code-generating engines are harder to build and debug than interpreted vectorized ones (citing the Photon paper). "The Photon paper notes that code-generating designs [38, 41, 53] are harder to develop and debug than interpreted vectorized designs [11]." (7 Related Work)
- The primary key sets the sort order of rows inside each part. "The primary key columns determine the sort order of the rows within each part, i.e. the index is locally clustered." (3.2 Data Pruning)
- The primary key index is sparse: it maps the key of each granule's first row to the granule. "ClickHouse additionally stores, for every part, a mapping from the primary key column values of each granule’s first row to the granule’s id, i.e. the index is sparse [31]." (3.2)
- It is small: 1000 entries index 8.1 million rows. "only 1000 entries are required to index 8.1 million rows." (3.2)
- Queries filter out lightweight-deleted rows, and the rows are only removed by a later merge. "ClickHouse amends SELECT queries with an additional filter on the bitmap column to exclude deleted rows from the result. Deleted rows are physically removed only by regular merges at an unspecified time in future." (3.4)

## Visuals worth redrawing

- Figure 3: inserts creating parts and merges combining them.

## My notes

- Benchmark sections compare with Snowflake on TPC-H; not used.
- Section numbers for 4.2 and 4.4 read from the PDF text; subsection
  titles are "SIMD Parallelization" and "Holistic Performance Optimization".

---
id: duckdb-execution-format
title: Execution Format (DuckDB internals documentation)
author: DuckDB contributors
url: https://duckdb.org/docs/current/internals/vector.html
kind: docs
primary: true
---

## Summary

DuckDB's internals page on its in-memory execution format, read on the
"current" docs when this was written. Operators pass fixed-size Vectors
of one type, grouped into DataChunks. Vectors come in several physical
forms (flat, constant, dictionary, sequence) so compressed data can stay
compressed during execution.

## Key claims

- DuckDB runs queries vectorized, on vectors of a fixed size. "DuckDB uses a vectorized query execution model. All operators in DuckDB are optimized to work on Vectors of a fixed size." (Data Flow)
- The default vector size is 2048 tuples. "The default STANDARD_VECTOR_SIZE is 2048 tuples." (Data Flow)
- A DataChunk is a set of vectors, one per column. "DataChunk is a collection of Vectors, used for instance to represent a column list in a PhysicalProjection operator." (Execution Format)
- A vector holds values of one type, and can have different physical layouts for the same logical data. "Vectors logically represent arrays that contain data of a single type." (Vector Format)
- A flat vector is a plain contiguous array. "Flat vectors are physically stored as a contiguous array, this is the standard uncompressed vector format." (Flat Vectors)
- A constant vector stores one value for the whole vector. "Constant vectors are physically stored as a single constant value." (Constant Vectors)
- A dictionary vector is a child vector plus a selection vector of indexes into it, and comes straight from dictionary-compressed storage. "Dictionary vectors are physically stored as a child vector, and a selection vector that contains indexes into the child vector." (Dictionary Vectors)
- This keeps data compressed during execution. "we store this in a dictionary vector so we can keep the data compressed during query execution." (Dictionary Vectors)
- Writing special code for every combination of vector types is infeasible, so there's a unified view. "writing specialized code for every combination of vector types for every function is unfeasible due to the combinatorial explosion of possibilities." (Unified Vector Format)
- Short strings (up to 12 bytes) are stored inline; longer ones keep a 4-byte prefix for fast comparison. "Short strings (<= 12 bytes) are inlined into the structure, while larger strings are stored with a pointer to the data in the auxiliary string buffer." (String Vectors)

## Visuals worth redrawing

- The flat / constant / dictionary / sequence vector examples.

## My notes

- The 2019 paper says 1024; the docs say 2048.

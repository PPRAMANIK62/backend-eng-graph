---
id: raasveldt-duckdb-2019
title: "DuckDB: an Embeddable Analytical Database"
author: Mark Raasveldt, Hannes Mühleisen
url: https://mytherin.github.io/papers/2019-duckdbdemo.pdf
kind: paper
primary: true
---

## Summary

The SIGMOD 2019 demo paper introducing DuckDB, from CWI. SQLite fills
the "embedded OLTP" corner; nothing filled "embedded OLAP". DuckDB is a
library that runs analytical SQL inside the host process, with a
vectorized interpreted engine and MVCC.

## Key claims

- SQLite is built for OLTP, with a row-major engine on B-trees, and does badly on analytics. "SQLite strongly focuses on transactional (OLTP) workloads, and contains a row-major execution engine operating on a B-Tree storage format [3]. As a consequence, SQLite’s performance on analytical (OLAP) workloads is very poor." (1 Introduction)
- An embedded analytical database should still handle some OLTP, e.g. dashboards where some threads update and others query. "High efficiency for OLAP workloads, but without completely sacrificing OLTP performance." (1 Introduction, requirements list)
- DuckDB uses a vectorized interpreted engine, chosen over JIT compilation for portability. "This approach was chosen over Just-in-Time compilation (JIT) of SQL queries [8] for portability reasons." (2 Design and Implementation)
- JIT engines drag in large compiler libraries. "JIT engines depend on massive compiler libraries (e.g. LLVM) with additional transitive dependencies." (2)
- In 2019 the vector size was 1024 values, with fixed-width types as native arrays. "DuckDB uses vectors of a fixed maximum amount of values (1024 per default)." (2)
- The dashboard case: some threads update with OLTP queries while others run OLAP queries. "concurrent data modification is a common use case in dashboard-scenarios where multiple threads update the data using OLTP queries and other threads run the OLAP queries" (1 Introduction, words split across columns in the PDF)

## Visuals worth redrawing

- Figure 1: a 2x2 grid, embedded vs stand-alone against OLTP vs OLAP,
  with the embedded OLAP cell empty.

## My notes

- The current docs (duckdb-execution-format) give 2048 as the default
  vector size, so it changed since this paper.

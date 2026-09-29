---
id: clickhouse-what-is-olap
title: What is OLAP?
author: Al Brown, ClickHouse
url: https://clickhouse.com/docs/concepts/olap
kind: docs
primary: true
---

## Summary

ClickHouse's concept page on OLAP: what the term means, where it came
from, how it differs from OLTP, how OLAP moved from pre-built cubes to
columnar engines, and the common Postgres-plus-OLAP-database pattern.
Written by a vendor of an OLAP engine, so read the comparisons of
products with that in mind.

## Key claims

- OLAP workloads scan and aggregate millions to billions of rows; OLTP reads or writes a few rows in milliseconds. "OLAP (online analytical processing) workloads scan and aggregate millions to billions of rows; OLTP workloads read or write small numbers of rows at millisecond latency." (TL;DR)
- OLTP handles small, frequent reads and writes on current state. "It contrasts with OLTP (online transactional processing), which handles small, high-frequency reads and writes against current operational state." (What is OLAP?)
- The term came from E.F. Codd in 1993. "The term was coined by E.F. Codd in his 1993 white paper Providing OLAP to User-Analysts: An IT Mandate" (opening)
- "Online" meant interactive rather than batch. "The "online" in OLAP is historical and means interactive rather than batch" (What does OLAP stand for)
- Example OLAP question. "A query like "monthly revenue by product and region for the last three years" is an OLAP query" (What is OLAP?)
- The two workloads have opposite shapes, and a design that wins one loses the other. "The two workloads have opposite shapes, and the database designs that win one lose the other." (How does OLAP differ from OLTP?)
- Their comparison table: OLTP is row storage, few rows, single-row mutations at high QPS, thousands of users with simple queries, normalized schema; OLAP is columnar, many rows, bulk append-mostly inserts, tens to hundreds of users with complex queries, star or wide denormalized schema. (How does OLAP differ from OLTP?, table)
- Pre-built cubes gave way to columnar engines that aggregate at query time. "The pre-aggregated cubes that defined the first two decades have largely given way to columnar engines that compute aggregations on demand." (opening)
- Columnar engines read only needed columns, process SIMD-friendly batches, and skip rows with sparse indexes. "A columnar engine reads only the columns referenced by a query, processes data in SIMD-friendly batches, and skips ranges of rows using sparse indexes" (How OLAP shifted from cubes to columnar)
- Sybase IQ shipped a columnar engine in 1994; Vertica, from C-Store's authors, in 2007. "Sybase IQ shipped a columnar engine in 1994. Vertica, built by C-Store's authors, launched commercially in 2007." (How OLAP shifted)
- Wide-column stores are not columnar OLAP engines. "Cassandra, HBase, and Bigtable are wide-column row-stores, not columnar OLAP engines." (TL;DR)
- Postgres is an OLTP database; the usual pattern is Postgres for writes and CDC into an OLAP database. "Its row-oriented storage and B-tree indexes are optimised for point lookups and small writes, not the wide aggregations OLAP workloads run." (FAQ, Is Postgres an OLAP database?)
- OLAP and a data warehouse aren't the same thing. "OLAP is a category of analytical processing. A data warehouse is an infrastructure pattern." (FAQ, Is OLAP the same as a data warehouse?)
- Postgres extensions add limited analytics; the standard pattern is Postgres plus an OLAP database fed by CDC. "Extensions like Citus, Timescale and pg_duckdb add limited analytical capability, but at production scale the standard pattern is Postgres for writes plus a dedicated OLAP database for reads, connected via change data capture." (FAQ, Is Postgres an OLAP database?)
- Running both workloads in one system is called HTAP. "Running OLTP and OLAP in a single system (HTAP)" (Further reading table)
- Column engines process batches instead of rows. "Vectorised execution processes column batches in CPU-cache-friendly chunks instead of row-by-row." (How OLAP shifted)
- Materialized views take the role cubes had. "Materialised views handle cube-like pre-aggregation when it's wanted, computed asynchronously and queried like any other table." (How OLAP shifted)
- Examples of cloud warehouses and engines. "Traditional cloud data warehouses (Snowflake, Google BigQuery, Amazon Redshift, Databricks SQL) target batch BI reporting" (What are some examples of OLAP databases?)
- Codd coined the term to tell analytical workloads apart from the transactional ones databases were then built for. "The term was coined by E.F. Codd in 1993 to distinguish analytical database workloads (multidimensional aggregations, drill-down reporting, ad-hoc exploration) from the transactional workloads (OLTP) the era's databases were designed" (FAQ, What does OLAP stand for?)

## Visuals worth redrawing

- The OLTP vs OLAP table (as a two-column comparison).

## My notes

- Latency figures in the table ("Sub-50ms", "Sub-second to seconds") are
  a vendor's rules of thumb, not measurements; not used as numbers.
- Page carries its own "last updated" line; the content is current as
  of when this was written.

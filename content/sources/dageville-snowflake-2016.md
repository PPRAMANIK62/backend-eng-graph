---
id: dageville-snowflake-2016
title: The Snowflake Elastic Data Warehouse
author: Benoit Dageville, Thierry Cruanes, Marcin Zukowski, and others (Snowflake Computing)
url: https://www.cs.cmu.edu/~15721-f24/papers/Snowflake.pdf
kind: paper
primary: true
---

## Summary

SIGMOD 2016 paper by Snowflake's builders (copy hosted on the CMU 15-721
course page). Why classic warehouses fit the cloud badly, and
Snowflake's answer: storage on S3 in immutable columnar files, separate
elastic compute clusters, min-max pruning instead of indexes, and a
VARIANT type that lets you load raw JSON first (ELT) and transform later.

## Key claims

- Traditional warehouse data came from inside the company: transactional systems, ERP, CRM. "It used to be the case that most of the data in a data warehouse came from sources within the organization: transactional systems, enterprise resource planning (ERP) applications, customer relationship management (CRM) applications, and the like." (1 Introduction)
- Newer data is external, semi-structured, and arrives without a schema. "a significant and rapidly growing share of data comes from less controllable or external sources: application logs, web applications, mobile devices, social media, sensor data (Internet of Things)." (1 Introduction)
- Classic warehouses lean on deep ETL pipelines and physical tuning. "These solutions depend on deep ETL pipelines and physical tuning that fundamentally assume predictable, slow-moving, and easily categorized data from largely internal sources." (1 Introduction)
- Shared-nothing was the dominant warehouse architecture: each node owns its disks and its slice of rows. "Tables are horizontally partitioned across nodes and each node is only responsible for the rows on its local disks." (2 Storage versus Compute)
- Shared-nothing ties compute to storage. "it tightly couples compute resources and storage resources, which leads to problems in certain scenarios." (2)
- Loading and querying want different hardware. "A system configuration that is ideal for bulk loading (high I/O bandwidth, light compute) is a poor fit for complex queries (low I/O bandwidth, heavy compute) and vice versa." (2, Heterogeneous Workload)
- Tables are stored as large immutable files, columnar inside (PAX). "Tables are horizontally partitioned into large, immutable files which are equivalent to blocks or pages in a traditional database system." (3.1 Data Storage)
- Each file has a header with column offsets, so a query downloads only the header and needed columns via ranged GETs. "queries only need to download the file headers and those columns they are interested in." (3.1)
- B-tree indexes suit transaction processing but not Snowflake. "While this approach proved highly effective for transaction processing, it raises multiple problems for systems like Snowflake." (3.3.3 Pruning)
- Min-max pruning: keep each chunk's min and max and skip chunks the predicate rules out. "Depending on the query predicates, these values can be used to determine that a given chunk of data might not be needed for a given query." (3.3.3)
- Worked example: files with x in 3..5 and 4..6; WHERE x >= 6 reads only the second. "if a query has a predicate WHERE x >= 6, we know that only f2 needs to be accessed." (3.3.3)
- Pruning metadata is orders of magnitude smaller than the data. "this metadata is usually orders of magnitude smaller than the actual data, resulting in a small storage overhead and fast access." (3.3.3)
- The VARIANT type enables ELT instead of ETL. "The VARIANT type allows Snowflake to be used in an ELT (Extract-Load-Transform) manner rather than a traditional ETL (Extract-Transform-Load) manner." (4.3 Semi-Structured and Schema-Less Data)
- With ELT there is no schema or transformation at load time. "There is no need to specify document schemas or to perform transformations on the load." (4.3)
- This "schema later" approach decouples producers from consumers. "This approach, aptly called “schema later” in the literature, allows for schema evolution by decoupling information producers from information consumers and any intermediaries." (4.3)
- A schema change in a classic ETL pipeline needs coordination across departments. "any change in data schemas in a conventional ETL pipeline requires coordination between multiple departments in an organization, which can take months to execute." (4.3)
- Transformations after loading get the full power of a parallel SQL database. "if transformation is desired, it can be performed using the full power of a parallel SQL database, including operations such as joins, sorting, aggregation, complex predicates and so forth" (4.3)
- Snowflake uses no indexes. "Since Snowflake does not use indices (cf. Section 3.3.3)" (3.3.1 Query Management and Optimization)
- Pruning metadata is kept per table file. "Snowflake keeps pruning-related metadata for every individual table file." (3.3.3; "individual" split across a line)
- Pruning needs no user input and is easy to maintain. "it does not rely on user input; it scales well; and it is easy to maintain." (3.3.3)
- Those in-warehouse operations are what classic ETL tools lack or do slowly. "which are typically missing or inefficient in conventional ETL toolchains." (4.3; text interleaved across columns in the PDF)

## Visuals worth redrawing

- Figure 1: the three layers (cloud services, virtual warehouses, data
  storage on S3).

## My notes

- Section numbers read from the PDF; check against the ACM version if
  it matters.

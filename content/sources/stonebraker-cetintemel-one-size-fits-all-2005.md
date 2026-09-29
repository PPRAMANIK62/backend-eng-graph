---
id: stonebraker-cetintemel-one-size-fits-all-2005
title: "\"One Size Fits All\": An Idea Whose Time Has Come and Gone"
author: Michael Stonebraker, Uğur Çetintemel
url: https://cs.brown.edu/~ugur/fits_all.pdf
kind: paper
primary: true
---

## Summary

A position paper from ICDE 2005 by database builders (Stonebraker led
C-Store and StreamBase). It argues that the classic row-store DBMS,
built for business transaction processing, can't serve every workload,
and uses data warehouses and stream processing as the two examples.
Section 2 is a short history of why companies built warehouses and why
warehouse engines differ from OLTP engines.

## Key claims

- The early relational systems were built for OLTP. "Hence, both systems were architected for on-line transaction processing (OLTP) applications" (1 Introduction)
- The classic design: rows, B-trees, cost-based optimizer, ACID. "stores relational tables row-by-row, uses B-trees for indexing, uses a cost-based optimizer, and provides ACID transaction properties." (1 Introduction)
- Warehouses appeared in the early 1990s to gather data from many operational databases. "Enterprises wanted to gather together data from multiple operational databases into a data warehouse for business intelligence purposes." (2 Data warehousing)
- A typical large enterprise has about 50 operational systems. "A typical large enterprise has 50 or so operational systems, each with an on-line user community who expect fast response time." (2)
- Admins kept analysts off the operational systems to protect response time. "System administrators were (and still are) reluctant to allow business-intelligence users onto the same systems, fearing that the complex ad-hoc queries from these users will degrade response time for the on-line community." (2, "business-intelligence" is split across a line)
- Analysts also want history and data from several systems. "business-intelligence users often want to see historical trends, as well as correlate data from multiple operational databases." (2)
- So data was copied into a warehouse on a schedule. "essentially every enterprise created a large data warehouse, and periodically “scraped” the data from operational systems into it." (2)
- OLTP is tuned for updates, warehouses for ad-hoc queries. "OLTP systems have been optimized for updates, as the main business activity is typically to sell a good or service. In contrast, the main activity in data warehouses is ad-hoc queries, which are often quite complex." (2)
- A warehouse's rhythm: periodic loads between queries. "periodic load of new data interspersed with ad-hoc query activity is what a typical warehouse experiences." (2)
- Warehouse schemas are star schemas: a fact table per scanned item, with foreign keys to dimensions. "Note the central fact table, which holds an entry for each item that is scanned by a cashier in each store in its chain." (2, Figure 1)
- Star schemas are everywhere in warehouses and almost absent in OLTP. "Such star schemas are omnipresent in warehouse environments, but are virtually nonexistent in OLTP environments." (2)
- Warehouses prefer bitmap indexes, OLTP prefers B-trees. "It is a well known homily that warehouse applications run much better using bit-map indexes while OLTP users prefer B-tree indexes." (2)
- Materialized views help warehouses, never OLTP. "materialized views are a useful optimization tactic in warehouse worlds, but never in OLTP worlds." (2)
- Vendors really sell two engines behind one parser. "most vendors have a warehouse DBMS (bit-map indexes, materialized views, star schemas and optimizer tactics for star schema queries) and an OLTP DBMS (B-tree indexes and a standard cost-based optimizer), which are united by a common parser" (2, Figure 2)
- Coding a US state in six bits pays off in a warehouse, not in OLTP. "This is usually true in warehouses and never true in OLTP." (2, on coding the state field into six bits)
- Row stores are write-optimized: one disk write stores a whole record. "a single disk write is all that is required to push all of the attributes of a single record out to disk." (5.1 Data warehouses)
- Warehouses need to be read-optimized, and a column store is far more efficient there. "warehouse systems need to be “read-optimized” as most workload consists of ad-hoc queries that touch large amounts of historical data." (5.1)
- A column store reads only the attributes a query needs. "With a column-store architecture, a DBMS need only read the attributes required for processing a given query, and can avoid bringing into memory any other irrelevant attributes." (5.1)
- The warehouse trend started in the early 1990s. "In the early 1990’s, a new trend appeared: Enterprises wanted to gather together data from multiple operational databases into a data warehouse" (2 Data warehousing)

## Visuals worth redrawing

- Figure 1, a typical star schema (SALES fact table with STORE, TIME,
  PRODUCT and CUSTOMER dimensions).
- Figure 2, one parser on top of an OLTP bottom and a warehouse bottom.

## My notes

- A 2005 argument. Its predictions about column stores came true
  (Vertica, and every major vendor shipping a column store by 2013 per
  abadi-column-stores-2013).

---
id: clickhouse-intro
title: What is ClickHouse?
author: ClickHouse
url: https://clickhouse.com/docs/intro
kind: docs
primary: true
---

## Summary

ClickHouse's introduction page. It defines analytics (OLAP) against
transactional queries and explains row-oriented vs column-oriented
storage with an example query over 100 million rows of web analytics
data.

## Key claims

- Analytical queries do complex calculations over huge data, unlike OLTP queries that touch a few rows. "Unlike transactional queries (or OLTP, Online Transaction Processing) that read and write just a few rows per query and, therefore, complete in milliseconds, analytics queries routinely process billions and trillions of rows." (What are analytics?)
- A row store keeps each row's values together; a column store keeps each column's values together. "In such systems, tables are stored as a collection of columns, i.e. the values of each column are stored sequentially one after the other." (Row-oriented vs. column-oriented storage)
- Columns make rebuilding one row harder and filters and aggregates faster. "This layout makes it harder to restore single rows (as there are now gaps between the row values) but column operations such as filters or aggregation become much faster than in a row-oriented database." (Row-oriented vs. column-oriented storage)
- A row store reads whole blocks, so it pulls in columns the query doesn't need. "Even if only part of a block is needed, the entire block is read into memory (this is due to disk and file system design)" (Row-oriented DBMS)
- Their example query selects a few of over 100 columns and processed 100 million rows in 92 ms on their playground. "the query processed 100 million rows in 92 milliseconds" (Row-oriented vs. column-oriented storage)
- Their example table is wide: the query picks a few of over 100 columns. "selects and filters just a few out of over 100 existing columns" (Row-oriented vs. column-oriented storage)

## Visuals worth redrawing

- The row-oriented vs column-oriented animation (which blocks get read).

## My notes

- The 92 ms figure is from their hosted playground, hardware unstated.
  Not used as a number.

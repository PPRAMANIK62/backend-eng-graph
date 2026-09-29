---
id: mysql-innodb-index-types
title: "MySQL 8.4 Reference Manual, 17.6.2.1 Clustered and Secondary Indexes"
author: Oracle
url: https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html
kind: docs
primary: true
---

## Summary

How InnoDB (MySQL 8.4) stores a table: the rows live in the clustered
index, normally the primary key, and every secondary index entry holds
the primary key of its row.

## Key claims

- Every InnoDB table has a clustered index that stores the rows. "Each InnoDB table has a special index called the clustered index that stores row data." (intro)
- Normally it is the primary key. "Typically, the clustered index is synonymous with the primary key." (intro)
- Without a primary key, the first all-NOT NULL unique index is used. "If you do not define a PRIMARY KEY for a table, InnoDB uses the first UNIQUE index with all key columns defined as NOT NULL as the clustered index." (Clustered Index Definition)
- Otherwise a hidden 6-byte row id is generated. "The row ID is a 6-byte field that increases monotonically as new rows are inserted." (Clustered Index Definition)
- Lookup through the clustered index lands directly on the row's page. "Accessing a row through the clustered index is fast because the index search leads directly to the page that contains the row data." (How the Clustered Index Speeds Up Queries)
- Secondary index records hold the primary key columns, used to look up the row. "In InnoDB, each record in a secondary index contains the primary key columns for the row, as well as the columns specified for the secondary index." (How Secondary Indexes Relate to the Clustered Index)
- Long primary keys make every secondary index bigger. "If the primary key is long, the secondary indexes use more space, so it is advantageous to have a short primary key." (same)
- With the hidden row id, rows end up in insertion order. "Thus, the rows ordered by the row ID are physically in order of insertion." (Clustered Index Definition)

## Visuals worth redrawing

None.

## My notes

- dev.mysql.com returned an error page to a browser user agent; curl's
  default user agent got the real page.

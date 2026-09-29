---
id: sqlite-without-rowid
title: "Clustered Indexes and the WITHOUT ROWID Optimization"
author: SQLite developers
url: https://www.sqlite.org/withoutrowid.html
kind: docs
primary: true
---

## Summary

SQLite's page on WITHOUT ROWID tables. An ordinary SQLite table is a
B-tree keyed by a hidden integer rowid, and any other primary key is a
separate unique index. A WITHOUT ROWID table stores rows inside the
primary key's B-tree instead: a clustered index.

## Key claims

- A WITHOUT ROWID table is a clustered index on the primary key. "A WITHOUT ROWID table is a table that uses a Clustered Index as the primary key." (1)
- In an ordinary table the primary key is just a unique index; the rowid is the real key. "In an ordinary SQLite table, the PRIMARY KEY is really just a UNIQUE index." (3)
- An INTEGER PRIMARY KEY is an alias for the rowid. "The special "INTEGER PRIMARY KEY" column type in ordinary SQLite tables causes the column to be an alias for the rowid" (3)
- The wordcount example is two B-trees and stores each word twice. "Note that the complete text of every "word" is stored twice: once in the main table and again in the index." (3)
- A lookup by word needs two searches. "Hence, two separate binary searches are required to fulfill the request." (3)
- As WITHOUT ROWID, one B-tree and one search. "In this latter table, there is only a single B-Tree which uses the "word" column as its key and the "cnt" column as its data." (3)
- Sometimes about half the space and nearly twice as fast. "Thus, in some cases, a WITHOUT ROWID table can use about half the amount of disk space and can operate nearly twice as fast." (3)
- Best for non-integer or composite primary keys and small rows. "The WITHOUT ROWID optimization is likely to be helpful for tables that have non-integer or composite (multi-column) PRIMARY KEYs and that do not store large strings or BLOBs." (4)
- Rule of thumb: rows under about 1/20 of a page. "A good rule-of-thumb is that the average size of a single row in a WITHOUT ROWID table should be less than about 1/20th the size of a database page." (4)
- Rowid tables are B*-trees with content only in leaves; WITHOUT ROWID tables are plain B-trees with content in inner nodes too, which cuts fan-out. "Storing content in intermediate nodes causes each intermediate node entry to take up more space on the page and thus reduces the fan-out, increasing the search cost." (4)
- SQLite calls its leaves-only rowid tables B*-trees. "rowid tables are implemented as B*-Trees where all content is stored in the leaves of the tree" (4)

## Visuals worth redrawing

None.

## My notes

- SQLite calls its leaf-only variant a "B*-Tree"; Comer (1979) notes that
  name is often misused for what he calls the B+-tree.

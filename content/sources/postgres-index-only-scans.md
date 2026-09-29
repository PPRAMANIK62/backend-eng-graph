---
id: postgres-index-only-scans
title: "PostgreSQL documentation, 11.9 Index-Only Scans and Covering Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/indexes-index-only-scans.html
kind: docs
primary: true
---

## Summary

When Postgres (read at version 18.6) can answer a query from the index
alone, the visibility map check that makes it work or not, and how the
INCLUDE clause builds a covering index.

## Key claims

- Every Postgres index is secondary, separate from the heap. "All indexes in PostgreSQL are secondary indexes, meaning that each index is stored separately from the table's main data area (which is called the table's heap in PostgreSQL terminology)." (11.9)
- An ordinary index scan visits both, and heap visits are random. "The heap-access portion of an index scan thus involves a lot of random access into the heap, which can be slow, particularly on traditional rotating media." (11.9)
- Index-only scans skip the heap. "PostgreSQL supports index-only scans, which can answer queries from an index alone without any heap access." (11.9)
- Requirement 1: the index type must store the value. "B-tree indexes always do." (11.9) and "GIN indexes cannot support index-only scans because each index entry typically holds only part of the original data value." (11.9)
- Requirement 2: only indexed columns in the query. "The query must reference only columns stored in the index." (11.9)
- Visibility isn't in the index, so Postgres checks the visibility map. "Visibility information is not stored in index entries, only in heap entries" (11.9)
- If the page isn't all-visible, the heap is visited anyway. "If it's not set, the heap entry must be visited to find out whether it's visible, so no performance advantage is gained over a standard index scan." (11.9)
- The visibility map is tiny. "since the visibility map is four orders of magnitude smaller than the heap it describes, far less physical I/O is needed to access it." (11.9)
- A win only on mostly-unchanging tables. "it will be a win only if a significant fraction of the table's heap pages have their all-visible map bits set." (11.9)
- Covering index definition. "a covering index, which is an index specifically designed to include the columns needed by a particular type of query that you run frequently." (11.9)
- INCLUDE adds payload columns that aren't part of the key. "This is done by adding an INCLUDE clause listing the extra columns." (11.9)
- In a unique index, uniqueness covers only the key columns. "the uniqueness condition applies to just column x, not to the combination of x and y." (11.9)
- INCLUDE also works in UNIQUE and PRIMARY KEY constraints. "An INCLUDE clause can also be written in UNIQUE and PRIMARY KEY constraints, providing alternative syntax for setting up an index like this." (11.9)
- An oversized entry fails the write. "If an index tuple exceeds the maximum size allowed for the index type, data insertion will fail." (11.9)
- Be conservative with payload columns. "non-key columns duplicate data from the index's table and bloat the size of the index, thus potentially slowing searches." (11.9)
- Pointless on tables that change fast. "there is little point in including payload columns in an index unless the table changes slowly enough that an index-only scan is likely to not need to access the heap." (11.9)
- Which types support INCLUDE. "only B-tree, GiST and SP-GiST indexes currently support included columns." (11.9)
- The older way: trailing key columns. "This works fine as long as the extra columns are trailing columns; making them be leading columns is unwise" (11.9)
- Payload columns are kept out of the upper B-tree levels. "Suffix truncation always removes non-key columns from upper B-Tree levels." (11.9)
- A WHERE condition on a column outside the index rules it out. The example: an index on (x, y) can't serve "SELECT x FROM tab WHERE x = 'key' AND z < 42;" as an index-only scan. (11.9)
- The planner misses index-only scans on expression indexes. "In this example, x is not needed except in the context f(x), but the planner does not notice that and concludes that an index-only scan is not possible." (11.9)
- The workaround is to include x. "If an index-only scan seems sufficiently worthwhile, this can be worked around by adding x as an included column" (11.9)

## Visuals worth redrawing

None.

## My notes

- Index-only scans on partial indexes whose predicate columns aren't stored work since 9.6.

---
id: postgres-multicolumn-indexes
title: "PostgreSQL documentation, 11.3 Multicolumn Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/indexes-multicolumn.html
kind: docs
primary: true
---

## Summary

How an index over several columns works in Postgres (read at version
18.6), the exact rule for which conditions narrow a B-tree scan, and the
skip scan optimization.

## Key claims

- Which index types allow several key columns. "Currently, only the B-tree, GiST, GIN, and BRIN index types support multiple-key-column indexes." (11.3)
- The column limit. "Indexes can have up to 32 columns, including INCLUDE columns." (11.3)
- A B-tree is most efficient with conditions on the leading columns. "A multicolumn B-tree index can be used with query conditions that involve any subset of the index's columns, but the index is most efficient when there are constraints on the leading (leftmost) columns." (11.3)
- The exact rule. "The exact rule is that equality constraints on leading columns, plus any inequality constraints on the first column that does not have an equality constraint, will always be used to limit the portion of the index that is scanned." (11.3)
- Later columns are still checked inside the index. "Constraints on columns to the right of these columns are checked in the index, so they'll always save visits to the table proper, but they do not necessarily reduce the portion of the index that has to be scanned." (11.3)
- Skip scan works by trying every value of a leading column. "Skip scan works by generating a dynamic equality constraint internally, that matches every possible value in an index column" (11.3)
- Skip scan only pays off when the skipped column has few distinct values. "This approach is generally only taken when there are so few distinct x values that the planner expects the scan to skip over most of the index" (11.3)
- With many distinct values the planner usually prefers a sequential scan. "If there are many distinct x values, then the entire index will have to be scanned, so in most cases the planner will prefer a sequential table scan over using the index." (11.3)
- Column order doesn't matter for GIN. "Unlike B-tree or GiST, index search effectiveness is the same regardless of which index column(s) the query conditions use." (11.3)
- A single column is usually enough. "In most situations, an index on a single column is sufficient and saves space and time." (11.3)
- GiST: the first column matters most. "the condition on the first column is the most important one for determining how much of the index needs to be scanned." (11.3)
- Use them sparingly. "Indexes with more than three columns are unlikely to be helpful unless the usage of the table is extremely stylized." (11.3)
- BRIN, like GIN, is indifferent to column order. "Like GIN and unlike B-tree or GiST, index search effectiveness is the same regardless of which index column(s) the query conditions use." (11.3, BRIN paragraph)
- Skip scan can also skip inside a scan past a middle column's range. "The skip scan optimization can also be applied selectively, during B-tree scans that have at least some useful constraints from the query predicate." (11.3; example WHERE a = 5 AND b >= 42 AND c < 77)

## Visuals worth redrawing

None.

## My notes

- Skip scan is new in PostgreSQL 18 (see postgres-18-release-notes).

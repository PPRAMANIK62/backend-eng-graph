---
id: winand-include-2019
title: "A Close Look at the Index Include Clause"
author: Markus Winand
url: https://use-the-index-luke.com/blog/2019-04/include-columns-in-btree-indexes
kind: blog
primary: false
---

## Summary

Winand's explanation (2019, prompted by PostgreSQL 11 adding INCLUDE) of
index-only scans and the INCLUDE clause: key columns go in every level of
the tree, include columns only in the leaves.

## Key claims

- Postgres got INCLUDE in version 11. "Some database—namely Microsoft SQL Server, IBM Db2, and also PostgreSQL since release 11—offer an include clause in the create index statement." (intro)
- An index access touches up to three structures. "using an index affects up to three layers of data structures:" the B-tree, the leaf list, the table (Recap: B-tree Indexes)
- An index-only scan skips the table. "it omits the table access if the required data is available in the doubly linked list of the index." (Recap: Index-Only Scan)
- Gains can be large when many rows are read. "It is not uncommon that an index-only scan improves performance by one or two orders of magnitude." (Note)
- Include columns live only in the leaves. "The include clause allows us to make a distinction between columns we would like to have in the entire index (key columns) and columns we only need in the leaf nodes (include columns)." (The Include Clause)
- So they can't help sorting or uniqueness. "This has two consequences: include columns cannot be used to prevent sorting nor are they considered for uniqueness" (The Include Clause)
- He avoids the term "covering index". "As this term is often used with a different meaning, I generally avoid it." (“Covering Index”)
- INCLUDE documents why the column is there. "the reason why the column is in the index is document in the index definition itself." (The Include Clause)

## Visuals worth redrawing

- The three-layer picture (tree, doubly linked leaf list, table) with steps 1, 2, 3; and the version with INCLUDE columns only in the leaves.

## My notes

- His rough read counts per layer (log100 of rows for the tree, rows/100 for the leaves) are illustrative, not measurements.

---
id: winand-slow-indexes
title: "Slow Indexes, Part I"
author: Markus Winand
url: https://use-the-index-luke.com/sql/anatomy/slow-indexes
kind: book
primary: false
---

## Summary

Why a query that uses an index can still be slow: the tree walk is
cheap and bounded, but following the leaf chain and fetching each row
from the table are not.

## Key claims

- The three steps. "An index lookup requires three steps: (1) the tree traversal; (2) following the leaf node chain; (3) fetching the table data." (Slow Indexes, Part I)
- Only the first is bounded. "The tree traversal is the only step that has an upper bound for the number of accessed blocks—the index depth." (Slow Indexes, Part I)
- Matching rows are scattered across the table. "The corresponding table data is usually scattered across many table blocks" (Slow Indexes, Part I)
- Rebuilding is not the fix. "For now, you can take it for granted that rebuilding an index does not improve performance on the long run." (Slow Indexes, Part I)
- The real cause. "If there is one more table access for each row, the query can become slow even when using an index." (Slow Indexes, Part I)

## Visuals worth redrawing

None beyond the figures in winand-search-tree.

## My notes

- Uses Oracle's operation names (INDEX RANGE SCAN, TABLE ACCESS BY INDEX ROWID).

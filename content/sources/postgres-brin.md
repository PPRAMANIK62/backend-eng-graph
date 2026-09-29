---
id: postgres-brin
title: "PostgreSQL documentation, 65.5 BRIN Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/brin.html
kind: docs
primary: true
---

## Summary

Block Range Indexes (read at version 18.6): a tiny index of per-range
summaries, for huge tables whose values follow the physical row order.

## Key claims

- Made for very large tables with physical correlation. "BRIN is designed for handling very large tables in which certain columns have some natural correlation with their physical location within the table." (65.5.1)
- The order-date example. "a table storing a store's sale orders might have a date column on which each order was placed, and most of the time the entries for earlier orders will appear earlier in the table as well" (65.5.1)
- BRIN is lossy; rows are rechecked. "in other words, these indexes are lossy." (65.5.1)
- Small, and lets a scan skip ranges. "Because a BRIN index is very small, scanning the index adds little overhead compared to a sequential scan, but may avoid scanning large parts of the table that are known not to contain matching tuples." (65.5.1)
- For sortable types it stores min and max per range. "Data types having a linear sort order can have operator classes that store the minimum and maximum value within each block range" (65.5.1)
- Range size trades index size for precision. "Therefore, the smaller the number, the larger the index becomes (because of the need to store more index entries), but at the same time the summary data stored can be more precise and more data blocks can be skipped during an index scan." (65.5.1)
- The range size is a storage parameter. "The size of the block range is determined at index creation time by the pages_per_range storage parameter." (65.5.1)

## Visuals worth redrawing

None.

## My notes

- The range size is the `pages_per_range` storage parameter.

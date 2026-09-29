---
id: winand-ranges
title: "Greater, Less and BETWEEN"
author: Markus Winand
url: https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/greater-less-between-tuning-sql-access-filter-predicates
kind: book
primary: false
---

## Summary

How the order of columns in a two-column index changes how much of the
index a range query reads, drawn with employees' birth dates and
subsidiary ids. Source of the "equality first, then ranges" rule.

## Key claims

- The goal is the smallest scanned range. "It is therefore the golden rule of indexing to keep the scanned index range as small as possible." (Greater, Less and BETWEEN)
- With the range column first, the second column can't narrow the scan. "The filter on DATE_OF_BIRTH is therefore the only condition that limits the scanned index range." (Figure 2.2 text)
- With the equality column first, both conditions narrow it. "In this case, all where clause conditions limit the scanned index range so that the scan terminates at the very same leaf node." (Figure 2.3 text)
- The rule of thumb. "Rule of thumb: index for equality first—then for ranges." (Tip)
- The gap grows with the range. "The bigger the date range becomes, the bigger the performance difference will be." (Greater, Less and BETWEEN)
- Putting the most selective column first is a myth. "With this example, we can also falsify the myth that the most selective column should be at the leftmost index position." (Greater, Less and BETWEEN)

## Visuals worth redrawing

- Figures 2.2 and 2.3: the same query against `(date_of_birth, subsidiary_id)` and `(subsidiary_id, date_of_birth)`, with the scanned leaf range marked. Redrawn in composite-indexes.

## My notes

- In his example both single conditions match 13 rows, so selectivity can't explain the difference.

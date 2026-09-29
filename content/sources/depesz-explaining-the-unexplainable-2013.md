---
id: depesz-explaining-the-unexplainable-2013
title: Explaining the unexplainable
author: Hubert "depesz" Lubaczewski
url: https://www.depesz.com/2013/04/16/explaining-the-unexplainable/
kind: blog
primary: false
---

## Summary

A beginner's guide to the numbers in a Postgres plan by the author of
explain.depesz.com, written in 2013 and edited since. It explains cost
units, start-up vs total cost, how plans execute top-down with each node
pulling rows from its children, and why loops matter. Its sample output
is from an older version ("Total runtime" instead of "Execution Time"),
so use it for concepts, not output format.

## Key claims

- Cost is not seconds; its unit is one sequential page fetch. "It's unit is “fetching single page in sequential manner"." (cost section)
- Whether an index helps depends on how many rows match; for one row in a one-page table a seq scan is cheaper. "To do seq scan, I just need to read one page (8192 bytes) from table, and I get the row." (cost section)
- enable_* settings are for testing, not production code. "These are for development/testing, not for production." (cost section)
- Explains are trees; upper nodes pull data from nodes below. "Explains are trees. Upper node needs data from nodes below." (plan tree section)
- Some nodes return rows gradually (Seq Scan); others like Hash must read all input first. "for hashing operation to start (well, to be able to return even single row), it has to read in all the rows from suboperation(s)." (plan tree section)
- Limit stops the scan beneath it once it has enough rows. (LIMIT example)
- Actual time and rows are averages per loop; multiply by loops. "So the total time spent in this particular operation is 2 * 0.160ms = 0.32ms" (actual time section)
- Many slow queries are something looped many times. "Very often poor performance of a query comes from the fact that it had to loop many times over something." (actual time section)
- Example: 0.003 ms per loop, over 26,000 loops, almost 79 ms total. "this operation was run over 26000 times, resulting in total time spent in here of almost 79ms." (actual time section)
- Its examples are from an older version and end with "Total runtime", e.g. "Total runtime: 0.016 ms" (cost section examples).
- explain.depesz.com shows per-node exclusive and inclusive times. "(that's what is in exclusive/inclusive columns on explain.depesz.com)" (actual time section)

## Visuals worth redrawing

None.

## My notes

- Part 1 of a series; later parts cover individual node types.

---
id: postgres-window-functions
title: "PostgreSQL documentation, 9.22 Window Functions"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/functions-window.html
kind: docs
primary: true
---

## Summary

The reference list of built-in window functions in Postgres (read at
version 18.6): row_number, rank, dense_rank, percent_rank, cume_dist,
ntile, lag, lead, first_value, last_value, nth_value. Plus the rules on
peers, frames and the last_value trap.

## Key claims

- Any ordinary aggregate works as a window function with OVER. "In addition to these functions, any built-in or user-defined ordinary aggregate (i.e., not ordered-set or hypothetical-set aggregates) can be used as a window function" (9.22)
- row_number counts from 1 in each partition. "Returns the number of the current row within its partition, counting from 1." (Table 9.67)
- rank leaves gaps after ties. "Returns the rank of the current row, with gaps; that is, the row_number of the first row in its peer group." (Table 9.67)
- dense_rank doesn't. "Returns the rank of the current row, without gaps; this function effectively counts peer groups." (Table 9.67)
- lag reads a row before the current one in the partition, default one row back, NULL if none. "If omitted, offset defaults to 1 and default to NULL." (Table 9.67, lag)
- Peers are rows equal on the ORDER BY columns. "Rows that are not distinct when considering only the ORDER BY columns are said to be peers." (9.22)
- first_value, last_value, nth_value use the frame, which by default ends at the current row's last peer, so last_value surprises people. "This is likely to give unhelpful results for last_value and sometimes also nth_value." (9.22)
- Frames can be changed with RANGE, ROWS or GROUPS. "You can redefine the frame by adding a suitable frame specification (RANGE, ROWS or GROUPS) to the OVER clause." (9.22)
- An aggregate with ORDER BY and the default frame gives a running sum. "An aggregate used with ORDER BY and the default window frame definition produces a “running sum” type of behavior, which may or may not be what's wanted." (9.22)
- For the whole partition, drop ORDER BY or widen the frame. "To obtain aggregation over the whole partition, omit ORDER BY or use ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING." (9.22)
- IGNORE NULLS is not implemented. "This is not implemented in PostgreSQL: the behavior is always the same as the standard's default, namely RESPECT NULLS." (9.22, Note)
- ntile splits the partition into buckets as evenly as possible. "Returns an integer ranging from 1 to the argument value, dividing the partition as equally as possible." (Table 9.67, ntile)

## Visuals worth redrawing

None.

## My notes

- Whether IGNORE NULLS lands in a later Postgres release is worth
  re-checking when a new version ships.

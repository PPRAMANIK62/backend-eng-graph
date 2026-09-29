---
id: postgres-partial-indexes
title: "PostgreSQL documentation, 11.8 Partial Indexes"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/indexes-partial.html
kind: docs
primary: true
---

## Summary

Indexes built over a subset of rows (read at version 18.6): the uses
(skip common values, skip uninteresting rows, partial uniqueness), and the
rule for when the planner can use one.

## Key claims

- Definition. "A partial index is an index built over a subset of a table; the subset is defined by a conditional expression (called the predicate of the partial index)." (11.8)
- Common values aren't worth indexing. "Since a query searching for a common value (one that accounts for more than a few percent of all the table rows) will not use the index anyway, there is no point in keeping those rows in the index at all." (11.8)
- Smaller index, cheaper writes. "It will also speed up many table update operations because the index does not need to be updated in all cases." (11.8)
- Unbilled orders example. "CREATE INDEX orders_unbilled_index ON orders (order_nr)" (Example 11.2)
- A query outside the predicate can't use it. "The order 3501 might be among the billed or unbilled orders." (Example 11.2)
- The query must imply the predicate. "a partial index can be used in a query only if the system can recognize that the WHERE condition of the query mathematically implies the predicate of the index." (11.8)
- Only simple implications are recognised. "The system can recognize simple inequality implications, for example “x < 1” implies “x < 2”; otherwise the predicate condition must exactly match part of the query's WHERE condition or the index will not be recognized as usable." (11.8)
- Parameters don't match. "Matching takes place at query planning time, not at run time. As a result, parameterized query clauses do not work with a partial index." (11.8)
- Partial unique indexes. "This enforces uniqueness among the rows that satisfy the index predicate, without constraining those that do not." (11.8)
- Don't use many partial indexes instead of partitioning. "The core of the problem is that the system does not understand the relationship among the partial indexes, and will laboriously test each one to see if it's applicable to the current query." (Example 11.4)
- The advantage is usually small. "In most cases, the advantage of a partial index over a regular index will be minimal." (11.8)
- One ordinary index is the better choice. "Almost certainly, you'll be better off with a single non-partial index" (Example 11.4)
- Partitioning is the tool for a table too big for one index. "If your table is large enough that a single index really is a bad idea, you should look into using partitioning instead" (Example 11.4)

## Visuals worth redrawing

None.

## My notes

- The unique partial index example: one successful test per (subject, target).

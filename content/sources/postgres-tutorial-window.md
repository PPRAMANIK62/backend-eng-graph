---
id: postgres-tutorial-window
title: "PostgreSQL documentation, 3.5 Window Functions (tutorial)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/tutorial-window.html
kind: docs
primary: true
---

## Summary

The tutorial introduction to window functions in the Postgres manual
(read at version 18.6), built on an `empsalary` table: OVER, PARTITION
BY, ORDER BY inside OVER, the default window frame, where window
functions may appear, and filtering on their result with a sub-select.

## Key claims

- A window function computes across related rows without grouping them. "However, window functions do not cause rows to become grouped into a single output row like non-window aggregate calls would. Instead, the rows retain their separate identities." (3.5)
- The OVER clause is what makes a call a window function. "A window function call always contains an OVER clause directly following the window function's name and argument(s)." (3.5)
- PARTITION BY splits rows into groups. "The PARTITION BY clause within OVER divides the rows into groups, or partitions, that share the same values of the PARTITION BY expression(s)." (3.5)
- row_number numbers rows in each partition by the window's ORDER BY; ties get an unspecified order. "with tied rows numbered in an unspecified order" (3.5)
- Window functions see rows after WHERE, GROUP BY and HAVING. "For example, a row removed because it does not meet the WHERE condition is not seen by any window function." (3.5)
- Without PARTITION BY, one partition holds all rows. "It is also possible to omit PARTITION BY, in which case there is a single partition containing all rows." (3.5)
- Default frame with ORDER BY: start of partition through the current row and its peers. "By default, if ORDER BY is supplied then the frame consists of all rows from the start of the partition up through the current row, plus any following rows that are equal to the current row according to the ORDER BY clause." (3.5)
- Without ORDER BY the frame is the whole partition. "When ORDER BY is omitted the default frame consists of all rows in the partition." (3.5)
- Adding ORDER BY to sum() turns it into a running total, and duplicates share a value. "Here the sum is taken from the first (lowest) salary up through the current one, including any duplicates of the current one" (3.5)
- Allowed only in the SELECT list and ORDER BY. "Window functions are permitted only in the SELECT list and the ORDER BY clause of the query. They are forbidden elsewhere, such as in GROUP BY, HAVING and WHERE clauses." (3.5)
- Because they run after those clauses. "This is because they logically execute after the processing of those clauses." (3.5)
- To filter on a window result, use a sub-select. "If there is a need to filter or group rows after the window calculations are performed, you can use a sub-select." (3.5)
- A WINDOW clause names a window for reuse. "each windowing behavior can be named in a WINDOW clause and then referenced in OVER." (3.5)
- An aggregate can go inside a window function's arguments, not the reverse. "This means it is valid to include an aggregate function call in the arguments of a window function, but not vice versa." (3.5)
- The running-total example: the two 4800 salaries both show 25700. "Here the sum is taken from the first (lowest) salary up through the current one, including any duplicates of the current one (notice the results for the duplicated salaries)" (3.5, example output)

## Visuals worth redrawing

- The empsalary example: the same ten rows with avg over PARTITION BY
  depname, and sum over ORDER BY salary. Good base for a figure showing
  partitions and frames.

## My notes

- Frame options (ROWS, RANGE, GROUPS) are in 4.2.8, not here.

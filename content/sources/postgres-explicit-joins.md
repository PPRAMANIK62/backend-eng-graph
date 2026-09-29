---
id: postgres-explicit-joins
title: Controlling the Planner with Explicit JOIN Clauses (PostgreSQL 18 documentation)
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/explicit-joins.html
kind: docs
primary: true
---

## Summary

Section 14.3 of the PostgreSQL 18 manual, in the performance tips
chapter. Explains join order freedom, why it explodes with many tables,
how outer joins restrict it, and join_collapse_limit.

## Key claims

- Different join orders give the same answer at very different cost. "The important point is that these different join possibilities give semantically equivalent results but might have hugely different execution costs." (14.3)
- A join order with no connecting condition forms a Cartesian product. "Or it could join A to C and then join them with B — but that would be inefficient, since the full Cartesian product of A and C would have to be formed" (14.3)
- The number of orders grows exponentially with tables. "But the number of possible join orders grows exponentially as the number of tables expands." (14.3)
- Past about ten tables exhaustive search isn't practical. "Beyond ten or so input tables it's no longer practical to do an exhaustive search of all the possibilities, and even for six or seven tables planning might take an annoyingly long time." (14.3)
- Outer joins restrict the order; only FULL JOIN fixes it completely. "Currently, only FULL JOIN completely constrains the join order." (14.3)
- Writing INNER JOIN is the same as listing tables in FROM. "Explicit inner join syntax (INNER JOIN, CROSS JOIN, or unadorned JOIN) is semantically the same as listing the input relations in FROM, so it does not constrain the join order." (14.3)

## Visuals worth redrawing

None.

## My notes

None.

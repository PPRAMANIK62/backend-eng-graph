---
id: postgres-table-expressions
title: Table Expressions (PostgreSQL 18 documentation)
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/queries-table-expressions.html
kind: docs
primary: true
---

## Summary

Section 7.2 of the PostgreSQL 18 manual: the FROM clause and joined
tables (cross, inner, left, right, full, USING, NATURAL, LATERAL), then
WHERE, GROUP BY and HAVING, with small example tables.

## Key claims

- Several tables in FROM form a Cartesian product. "If more than one table reference is listed in the FROM clause, the tables are cross-joined (that is, the Cartesian product of their rows is formed; see below)." (7.2.1)
- A cross join of N and M rows has N * M rows. "If the tables have N and M rows respectively, the joined table will have N * M rows." (7.2.1.1)
- Inner join definition. "For each row R1 of T1, the joined table has a row for each row in T2 that satisfies the join condition with R1." (7.2.1.1)
- Left outer join keeps every left row. "Thus, the joined table always has at least one row for each row in T1." (7.2.1.1)
- NATURAL joins on every column name the tables share, which breaks when a column is added. "NATURAL is considerably more risky since any schema changes to either relation that cause a new matching column name to be present will cause the join to combine that new column as well." (7.2.1.1, Note)
- ON is applied before the join, WHERE after, which changes outer join results. "This is because a restriction placed in the ON clause is processed before the join, while a restriction placed in the WHERE clause is processed after the join. That does not matter with inner joins, but it matters a lot with outer joins." (7.2.1.1)
- WHERE keeps a row only if the condition is true; false and null both drop it. "If the result of the condition is true, the row is kept in the output table, otherwise (i.e., if the result is false or null) it is discarded." (7.2.2)

## Visuals worth redrawing

- The t1/t2 example tables and the result of each join type.

## My notes

None.

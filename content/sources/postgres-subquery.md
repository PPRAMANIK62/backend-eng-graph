---
id: postgres-subquery
title: Subquery Expressions (PostgreSQL 18 documentation)
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/functions-subquery.html
kind: docs
primary: true
---

## Summary

Section 9.24 of the PostgreSQL 18 manual: EXISTS, IN, NOT IN, ANY/SOME,
ALL and row comparisons against a subquery, including what each returns
when NULLs are involved.

## Key claims

- NOT IN is true only if no row equals the value. "The result of NOT IN is “true” if only unequal subquery rows are found (including the case where the subquery returns no rows)." (9.24.3)
- One NULL in the subquery's result turns a non-match into NULL, so the row is filtered out. "Note that if the left-hand expression yields null, or if there are no equal right-hand values and at least one right-hand row yields null, the result of the NOT IN construct will be null, not true." (9.24.3)
- NOT IN is <> ALL. "NOT IN is equivalent to <> ALL." (9.24.5)

## Visuals worth redrawing

None.

## My notes

None.

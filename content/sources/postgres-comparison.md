---
id: postgres-comparison
title: Comparison Functions and Operators (PostgreSQL 18 documentation)
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/functions-comparison.html
kind: docs
primary: true
---

## Summary

Section 9.2 of the PostgreSQL 18 manual: comparison operators, BETWEEN,
IS DISTINCT FROM, IS NULL and the boolean tests, and how each behaves
with NULL.

## Key claims

- Comparing with NULL gives NULL (unknown), not true or false. "Ordinary comparison operators yield null (signifying “unknown”), not true or false, when either input is null. For example, 7 = NULL yields null, as does 7 <> NULL." (9.2)
- IS NOT DISTINCT FROM treats NULL as a comparable value. "Thus, these predicates effectively act as though null were a normal data value, rather than “unknown”." (9.2)
- Don't write = NULL. "Do not write expression = NULL because NULL is not “equal to” NULL. (The null value represents an unknown value, and it is not known whether two unknown values are equal.)" (9.2)
- A setting exists to rewrite x = NULL for broken applications. "If it is enabled, PostgreSQL will convert x = NULL clauses to x IS NULL." (9.2, transform_null_equals)
- For row values, IS NULL and IS NOT NULL aren't opposites. "Because of this behavior, IS NULL and IS NOT NULL do not always return inverse results for row-valued expressions" (9.2)

## Visuals worth redrawing

None.

## My notes

None.

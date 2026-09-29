---
id: cmu-15445-modern-sql
title: "Lecture #02: Modern SQL (15-445/645 Database Systems)"
author: Andy Pavlo, Carnegie Mellon University
url: https://15445.courses.cs.cmu.edu/fall2024/notes/02-modernsql.pdf
kind: docs
primary: false
---

## Summary

Lecture notes for CMU's database systems course, Fall 2024 edition. A
short history of SQL and its standard editions, then aggregates, GROUP
BY, HAVING, string and date functions, output control, nested queries,
window functions, CTEs and lateral joins.

## Key claims

- SQL came from IBM's System R and was first called SEQUEL. "It was originally developed in the 1970s as part of the IBM System R project. IBM originally called it “SEQUEL” (Structured English Query Language)." (1 SQL History)
- The standard keeps getting new editions. "It is being updated with new features every couple of years." (1)
- SQL-92 is the minimum to claim SQL support, and every vendor adds extensions. "Each vendor follows the standard to a certain degree but there are many proprietary extensions." (1)
- Editions and headline features: "SQL:1999 Regular Expressions, Triggers", "SQL:2003 XML, Windows, Sequences", "SQL:2016 JSON, Polymorphic tables", "SQL:2023 Property Graph Queries, Multi-Dimensional Arrays" (1)
- SQL is split into DML, DDL and DCL. "Data Manipulation Language (DML): SELECT, INSERT, UPDATE, and DELETE statements." (2)
- Relational algebra uses sets, SQL uses bags. "Relational algebra is based on sets (unordered, no duplicates). SQL is based on bags (unordered, allows duplicates)." (2)
- Non-aggregated columns in the output must be in GROUP BY. "Non-aggregated values in SELECT output clause must appear in the GROUP BY clause." (4 Aggregates)
- HAVING filters groups. "This makes HAVING behave like a WHERE clause for a GROUP BY." (4)
- DDL and DCL. "Data Definition Language (DDL): Schema definitions for tables, indexes, views, and other objects." and "Data Control Language (DCL): Security, access controls." (2)
- SQL-92 is the floor. "The minimum language syntax a system needs to say that it supports SQL is SQL-92." (1)

## Visuals worth redrawing

None.

## My notes

- Dates SQL:2023 but not when each edition was published beyond its name.

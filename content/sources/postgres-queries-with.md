---
id: postgres-queries-with
title: "PostgreSQL documentation, 7.8 WITH Queries (Common Table Expressions)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/queries-with.html
kind: docs
primary: true
---

## Summary

The Postgres manual's section on CTEs (read at version 18.6): plain WITH
for splitting a query into named parts, WITH RECURSIVE and how it is
evaluated, SEARCH and CYCLE, when a CTE is materialized or folded into
the main query, and data-modifying statements inside WITH.

## Key claims

- A CTE is like a temporary table for one query. "These statements, which are often referred to as Common Table Expressions or CTEs, can be thought of as defining temporary tables that exist just for one query." (7.8)
- Each part can be SELECT, INSERT, UPDATE, DELETE or MERGE. "Each auxiliary statement in a WITH clause can be a SELECT, INSERT, UPDATE, DELETE, or MERGE" (7.8)
- Plain WITH is for readability. "The basic value of SELECT in WITH is to break down complicated queries into simpler parts." (7.8.1)
- RECURSIVE adds something plain SQL can't do. "The optional RECURSIVE modifier changes WITH from a mere syntactic convenience into a feature that accomplishes things not otherwise possible in standard SQL." (7.8.2)
- Shape: non-recursive term, UNION or UNION ALL, recursive term. "The general form of a recursive WITH query is always a non-recursive term, then UNION (or UNION ALL), then a recursive term, where only the recursive term can contain a reference to the query's own output." (7.8.2)
- Evaluation uses a working table and repeats while it isn't empty. "So long as the working table is not empty, repeat these steps" (7.8.2, Recursive Query Evaluation)
- Recursion is really iteration. "While RECURSIVE allows queries to be specified recursively, internally such queries are evaluated iteratively." (7.8.2, Note)
- Typical use is trees and hierarchies. "Recursive queries are typically used to deal with hierarchical or tree-structured data." (7.8.2)
- A recursive query must eventually return nothing or it loops forever. "When working with recursive queries it is important to be sure that the recursive part of the query will eventually return no tuples, or else the query will loop indefinitely." (7.8.2.2)
- The CYCLE clause handles cycle detection. "There is built-in syntax to simplify cycle detection." (7.8.2.2)
- Output happens to be breadth-first but don't rely on it. "The recursive query evaluation algorithm produces its output in breadth-first search order. However, this is an implementation detail and it is perhaps unsound to rely on it." (7.8.2.1, Tip)
- A CTE referenced several times is computed once. "A useful property of WITH queries is that they are normally evaluated only once per execution of the parent query, even if they are referred to more than once by the parent query or sibling WITH queries." (7.8.3)
- The cost: filters from outside can't be pushed into a multiply-referenced CTE. "the optimizer is not able to push restrictions from the parent query down into a multiply-referenced WITH query" (7.8.3)
- A side-effect-free, non-recursive CTE used once is folded into the parent query. "By default, this happens if the parent query references the WITH query just once, but not if it references the WITH query more than once." (7.8.3)
- MATERIALIZED and NOT MATERIALIZED override that. "You can override that decision by specifying MATERIALIZED to force separate calculation of the WITH query, or by specifying NOT MATERIALIZED to force it to be merged into the parent query." (7.8.3)
- A materialized CTE can lose the benefit of an index. "the WITH query will be materialized, producing a temporary copy of big_table that is then joined with itself — without benefit of any index." (7.8.3)
- Data-modifying statements in WITH always run to completion. "Data-modifying statements in WITH are executed exactly once, and always to completion, independently of whether the primary query reads all (or indeed any) of their output." (7.8.4)
- All parts share one snapshot and can't see each other's changes. "All the statements are executed with the same snapshot (see Chapter 13), so they cannot “see” one another's effects on the target tables." (7.8.4)
- RETURNING is the only channel between them. "RETURNING data is the only way to communicate changes between different WITH sub-statements and the main query." (7.8.4)
- With UNION, each step drops rows that repeat earlier output. "discard duplicate rows and rows that duplicate any previous result row." (7.8.2, Recursive Query Evaluation, step 2)
- UNION alone often doesn't stop a cycle, since cycle rows aren't exact duplicates. "However, often a cycle does not involve output rows that are completely duplicate: it may be necessary to check just one or a few fields to see if the same point has been reached before." (7.8.2.2)
- CYCLE tracks the path for you. "The CYCLE clause specifies first the list of columns to track for cycle detection, then a column name that will show whether a cycle has been detected, and finally the name of another column that will track the path." (7.8.2.2)
- SEARCH gives depth- or breadth-first order. "The SEARCH clause specifies whether depth- or breadth first search is wanted" (7.8.2.1)
- An outer LIMIT stops a runaway recursion in Postgres only. "This works because PostgreSQL's implementation evaluates only as many rows of a WITH query as are actually fetched by the parent query. Using this trick in production is not recommended, because other systems might work differently." (7.8.2.2)
- MATERIALIZED keeps an expensive function evaluated once per row when the CTE is used twice. "Here, materialization of the WITH query ensures that very_expensive_function is evaluated only once per table row, not twice." (7.8.3)
- Updating the same row twice in one statement is unpredictable. "Only one of the modifications takes place, but it is not easy (and sometimes not possible) to reliably predict which one." (7.8.4)

## Visuals worth redrawing

- The recursive evaluation loop (7.8.2): non-recursive term seeds the
  working table; recursive term runs on it; output appended; repeat
  until empty.

## My notes

- The folding rules arrived in PostgreSQL 12 (postgres-12-release-notes).

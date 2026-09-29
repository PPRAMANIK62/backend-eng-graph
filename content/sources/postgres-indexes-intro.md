---
id: postgres-indexes-intro
title: "PostgreSQL documentation, 11.1 Introduction (Indexes)"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/indexes-intro.html
kind: docs
primary: true
---

## Summary

The opening page of the Postgres manual's index chapter (read at version
18.6). What an index is for, what it costs, and how the planner decides
whether to use it.

## Key claims

- Without an index, a lookup reads the whole table row by row. "With no advance preparation, the system would have to scan the entire test1 table, row by row, to find all matching entries." (11.1)
- With an index the lookup walks a short tree. "For instance, it might only have to walk a few levels deep into a search tree." (11.1)
- The database keeps the index up to date and the planner decides when to use it. "the system will update the index when the table is modified, and it will use the index in queries when it thinks doing so would be more efficient than a sequential table scan." (11.1)
- Statistics must be kept current for that decision. "But you might have to run the ANALYZE command regularly to update statistics to allow the query planner to make educated decisions." (11.1)
- Indexes also help UPDATE, DELETE and joins. "Indexes can also benefit UPDATE and DELETE commands with search conditions. Indexes can moreover be used in join searches." (11.1)
- The indexable form of a condition. "indexed-column indexable-operator comparison-value" (11.1)
- Building an index on a big table is slow. "Creating an index on a large table can take a long time." (11.1)
- Building an index blocks writes by default. "By default, PostgreSQL allows reads (SELECT statements) to occur on the table in parallel with index creation, but writes (INSERT, UPDATE, DELETE) are blocked until the index build is finished." (11.1)
- Every index costs every write, and unused ones should go. "This adds overhead to data manipulation operations. Indexes can also prevent the creation of heap-only tuples. Therefore indexes that are seldom or never used in queries should be removed." (11.1)
- The indexed column can be an expression the index was built on. "Here, the indexed-column is whatever column or expression the index has been defined on." (11.1)
- Writes during a build are possible, with caveats. "It is possible to allow writes to occur in parallel with index creation, but there are several caveats to be aware of" (11.1)

## Visuals worth redrawing

None.

## My notes

- The book-index analogy is from this page; the article uses its own example instead.

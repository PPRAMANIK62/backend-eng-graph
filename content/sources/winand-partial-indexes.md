---
id: winand-partial-indexes
title: "Partial Indexes"
author: Markus Winand
url: https://use-the-index-luke.com/sql/where-clause/partial-and-filtered-indexes
kind: book
primary: false
---

## Summary

Partial indexes through a queue example: index only the unprocessed
messages, so the index stays small while the table grows.

## Key claims

- The queue query. "Queries like this are very common in queuing systems." (Partial Indexes)
- A partial index shrinks in two ways. "That means the index reduces its size in two dimensions: vertically, because it contains fewer rows; horizontally, due to the removed column." (Partial Indexes)
- Its size can stay flat. "For a queue, it can even mean that the index size remains unchanged although the table grows without bounds." (Partial Indexes)
- Names in other databases. "With partial (PostgreSQL) or filtered (SQL Server) indexes you can also specify the rows that are indexed." (Partial Indexes)
- Only deterministic functions in the predicate. "you can only use deterministic functions as is the case everywhere in an index definition." (Partial Indexes)
- Oracle does it differently. "The Oracle database has a unique approach to partial indexing." (Caution box)
- Db2 lacks them. "Db2 (LUW) does not support partial indexes, but the can be emulated like in the Oracle database when using the EXCLUDE NULL KEYS feature." (Partial Indexes)

## Visuals worth redrawing

None.

## My notes

- Oracle and Db2 don't have them and need workarounds (next page of the book).

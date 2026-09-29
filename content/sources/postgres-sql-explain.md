---
id: postgres-sql-explain
title: "PostgreSQL documentation, EXPLAIN"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/sql-explain.html
kind: docs
primary: true
---

## Summary

The reference page for the EXPLAIN command (read at version 18.6):
every option, what BUFFERS counts, and the notes on statistics and
profiling overhead.

## Key claims

- Options: ANALYZE, VERBOSE, COSTS, SETTINGS, GENERIC_PLAN, BUFFERS, SERIALIZE, WAL, TIMING, SUMMARY, MEMORY, FORMAT. (Synopsis)
- Two costs: start-up before the first row, total for all rows; for EXISTS the planner picks the smallest start-up cost. "the planner will choose the smallest start-up cost instead of the smallest total cost (since the executor will stop after getting one row, anyway)." (Description)
- ANALYZE really executes the statement. "Keep in mind that the statement is actually executed when the ANALYZE option is used." (Description, Important)
- BUFFERS: a hit means the block was already in cache. "A hit means that a read was avoided because the block was found already in cache when needed." (Parameters, BUFFERS)
- Written means a dirty block evicted by this backend. "the number of blocks written indicates the number of previously-dirtied blocks evicted from cache by this backend during query processing." (Parameters, BUFFERS)
- Temp blocks are for sorts, hashes and similar. "temporary blocks contain short-term working data used in sorts, hashes, Materialize plan nodes, and similar cases." (Parameters, BUFFERS)
- Buffers come automatically with ANALYZE. "Buffers information is automatically included when ANALYZE is used." (Parameters, BUFFERS)
- TIMING can be turned off to cut clock overhead and keep row counts. "The overhead of repeatedly reading the system clock can slow down the query significantly on some systems" (Parameters, TIMING)
- GENERIC_PLAN shows a plan for a statement with $1 placeholders, and can't be combined with ANALYZE. (Parameters, GENERIC_PLAN)
- FORMAT can be TEXT, XML, JSON, YAML. (Parameters, FORMAT)
- Statistics should be current; after big changes run ANALYZE by hand. "you might need to do a manual ANALYZE rather than wait for autovacuum to catch up with the changes." (Notes)
- EXPLAIN ANALYZE adds profiling overhead. "running EXPLAIN ANALYZE on a query can sometimes take significantly longer than executing the query normally." (Notes)
- Dirtied blocks are ones this query changed. "The number of blocks dirtied indicates the number of previously unmodified blocks that were changed by this query" (Parameters, BUFFERS)

## Visuals worth redrawing

None.

## My notes

- Pairs with postgres-using-explain, which has the worked examples.

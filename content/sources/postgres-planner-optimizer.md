---
id: postgres-planner-optimizer
title: "PostgreSQL documentation, 51.5 Planner/Optimizer"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/planner-optimizer.html
kind: docs
primary: true
---

## Summary

How the Postgres planner (read at version 18.6) builds candidate plans:
scans for each table first, then join orders and join methods, keeping the
cheapest estimate. Switches to a genetic search for very large joins.

## Key claims

- Many plans give the same answer; pick the one expected fastest. "A given SQL query (and hence, a query tree) can be actually executed in a wide variety of different ways, each of which will produce the same set of results." (51.5)
- The goal. "the query optimizer will examine each of these possible execution plans, ultimately selecting the execution plan that is expected to run the fastest." (51.5)
- Big joins get a genetic search instead. "PostgreSQL uses a Genetic Query Optimizer (see Chapter 61) when the number of joins exceeds a threshold (see geqo_threshold)." (51.5)
- It works on cut-down plans called paths. "The planner's search procedure actually works with data structures called paths, which are simply cut-down representations of plans containing only as much information as the planner needs to make its decisions." (51.5)
- A sequential scan is always a candidate. "There is always the possibility of performing a sequential scan on a relation, so a sequential scan plan is always created." (51.5.1)
- Index scans are candidates when the condition matches the index's operators, or for ordering. "Index scan plans are also generated for indexes that have a sort ordering that can match the query's ORDER BY clause (if any), or a sort ordering that might be useful for merge joining" (51.5.1)
- Three join strategies. "The three available join strategies are:" nested loop, merge join, hash join (51.5.1)
- Nested loop with an index on the inner side can be good. "However, if the right relation can be scanned with an index scan, this can be a good strategy." (51.5.1)
- Join order is searched. "The planner examines different possible join sequences to find the cheapest one." (51.5.1)
- Below the threshold the search is near-exhaustive. "If the query uses fewer than geqo_threshold relations, a near-exhaustive search is conducted to find the best join sequence." (51.5.1)
- Pairs with a join clause are tried first. "Join pairs with no join clause are considered only when there is no other choice" (51.5.1)
- Every join pair gets every plan, cheapest estimate wins. "All possible plans are generated for every join pair considered by the planner, and the one that is (estimated to be) the cheapest is chosen." (51.5.1)
- Nested loop scans the right side once per left row. "The right relation is scanned once for every row found in the left relation. This strategy is easy to implement but can be very time consuming." (51.5.1, nested loop join)
- Merge join: sort both sides, scan each once. "This kind of join is attractive because each relation has to be scanned only once." (51.5.1, merge join)
- The sort for a merge join can come from an index. "The required sorting might be achieved either by an explicit sort step, or by scanning the relation in the proper order using an index on the join key." (51.5.1)
- Hash join loads one side into a hash table and probes it with the other. "the right relation is first scanned and loaded into a hash table, using its join attributes as hash keys." (51.5.1, hash join)
- Multi-table joins are a tree of two-input joins. "When the query involves more than two relations, the final result must be built up by a tree of join steps, each with two inputs." (51.5.1)
- Above the threshold the plan is reasonable, not necessarily optimal. "In order to determine a reasonable (not necessarily optimal) query plan in a reasonable amount of time" (51.5, Note)

## Visuals worth redrawing

None.

## My notes

- geqo_threshold default is in postgres-runtime-config-query (12).

---
id: postgres-using-explain
title: "PostgreSQL documentation, 14.1 Using EXPLAIN"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/using-explain.html
kind: docs
primary: true
---

## Summary

The manual's walkthrough of reading plans (read at version 18.6). It
builds up from a one-line sequential scan to joins and subplans, then
shows what EXPLAIN ANALYZE adds (actual times, rows, loops, buffers)
and the cases where estimates and actuals legitimately differ.

## Key claims

- A plan is a tree of nodes; scan nodes at the bottom return raw rows. "The structure of a query plan is a tree of plan nodes." (14.1.1)
- Scan node types: sequential, index, bitmap index scans. "There are different types of scan nodes for different table access methods: sequential scans, index scans, and bitmap index scans." (14.1.1)
- The top line's total cost is what the planner minimises. "it is this number that the planner seeks to minimize." (14.1.1)
- The four numbers in parentheses are start-up cost, total cost, rows and width; start-up cost is spent before the first row, e.g. sorting. "This is the time expended before the output phase can begin, e.g., time to do the sorting in a sort node." (14.1.1)
- Width is the average row width in bytes. "Estimated average width of rows output by this plan node (in bytes)." (14.1.1)
- Costs are in arbitrary units, conventionally page fetches. "Traditional practice is to measure the costs in units of disk page fetches; that is, seq_page_cost is conventionally set to 1.0" (14.1.1)
- An upper node's cost includes its children. "the cost of an upper-level node includes the cost of all its child nodes." (14.1.1)
- Cost ignores sending results to the client. "the cost does not consider the time spent to convert output values to text form or to transmit them to the client" (14.1.1)
- Rows means rows emitted, not rows scanned. "it is not the number of rows processed or scanned by the plan node, but rather the number emitted by the node." (14.1.1)
- Worked cost: tenk1 has 345 pages and 10000 rows; (345 × 1.0) + (10000 × 0.01) = 445, with cpu_tuple_cost 0.01. "By default, seq_page_cost is 1.0 and cpu_tuple_cost is 0.01, so the estimated cost is (345 * 1.0) + (10000 * 0.01) = 445." (14.1.1)
- A Filter checks every scanned row; the scan still visits all rows. "This means that the plan node checks the condition for each row it scans, and outputs only the ones that pass the condition." (14.1.1)
- Bitmap scan: the index finds row locations, which are sorted into physical order before fetching. "the upper plan node sorts the row locations identified by the index into physical order before reading them, to minimize the cost of separate fetches." (14.1.1)
- A condition the index can't use becomes a Filter on the fetched rows. "Instead it is applied as a filter on the rows retrieved using the index." (14.1.1)
- A plain Index Scan fetches rows in index order, used for few rows or a matching ORDER BY. "You'll most often see this plan type for queries that fetch just a single row." (14.1.1)
- Nested loop runs its inner child once per outer row. "The nested-loop join node will run its second, or “inner” child once for each row obtained from the outer child." (14.1.1)
- Indentation shows the tree. "The indentation of the node summary lines reflects the plan tree structure." (14.1.1)
- Hash join builds an in-memory hash table from one input and probes it with the other. "rows of one table are entered into an in-memory hash table, after which the other table is scanned and the hash table is probed for matches to each row." (14.1.1)
- Merge join needs both inputs sorted on the join key. "Merge join requires its input data to be sorted on the join keys." (14.1.1)
- enable_* flags let you see alternative plans; a crude tool. "(This is a crude tool, but useful. See also Section 14.3.)" (14.1.1)
- EXPLAIN ANALYZE runs the query and shows true row counts and times per node. "With this option, EXPLAIN actually executes the query, and then displays the true row counts and true run time accumulated within each plan node" (14.1.2)
- Actual time is in milliseconds; cost units are arbitrary, so they won't match. "Note that the “actual time” values are in milliseconds of real time, whereas the cost estimates are expressed in arbitrary units; so they are unlikely to match up." (14.1.2)
- The main thing to check is estimated vs actual rows. "The thing that's usually most important to look for is whether the estimated row counts are reasonably close to reality." (14.1.2)
- Loops: times and rows are per-execution averages; multiply by loops. "Multiply by the loops value to get the total time actually spent in the node." (14.1.2)
- Sort nodes show whether the sort was in memory or on disk; Hash nodes show buckets, batches, memory. "The Sort node shows the sort method used (in particular, whether the sort was in-memory or on-disk) and the amount of memory or disk space needed." (14.1.2)
- More than one hash batch means disk was used. "(If the number of batches exceeds one, there will also be disk space usage involved, but that is not shown.)" (14.1.2)
- Index Searches line counts index descents across loops. (14.1.2, Index Searches examples)
- Rows Removed by Filter. "Another type of extra information is the number of rows removed by a filter condition" (14.1.2)
- Lossy GiST scan rechecks rows: "Rows Removed by Index Recheck". "This happens because a GiST index is “lossy” for polygon containment tests" (14.1.2)
- ANALYZE implies BUFFERS; counts hit, read, dirtied, written. "The ANALYZE option implicitly enables the BUFFERS option." (14.1.2)
- EXPLAIN ANALYZE has side effects; wrap writes in a transaction and roll back. "Keep in mind that because EXPLAIN ANALYZE actually runs the query, any side-effects will happen as usual" (14.1.2)
- Planning Time excludes parsing and rewriting; Execution Time includes triggers but not planning. "It does not include parsing or rewriting." (14.1.2)
- SERIALIZE measures output conversion; data is never sent to the client. (14.1.2)
- Caveat: no network cost, and timing overhead. "Second, the measurement overhead added by EXPLAIN ANALYZE can be significant, especially on machines with slow gettimeofday() operating-system calls." (14.1.3)
- Don't extrapolate from toy tables. "results on a toy-sized table cannot be assumed to apply to large tables." (14.1.3)
- LIMIT stops a node early; actual rows lower than estimate is not an error. "This is not an estimation error, only a discrepancy in the way the estimates and true values are displayed." (14.1.3)
- Merge join can rescan inner rows, inflating actual row counts. "EXPLAIN ANALYZE counts these repeated emissions of the same inner rows as if they were real additional rows." (14.1.3)
- BitmapAnd and BitmapOr report zero actual rows. "BitmapAnd and BitmapOr nodes always report their actual row counts as zero, due to implementation limitations." (14.1.3)
- A LIMIT can change the chosen plan, because a node can stop early. "This is the same query as above, but we added a LIMIT so that not all the rows need be retrieved, and the planner changed its mind about what to do." (14.1.1)
- An index scan already returns rows in index order, so a matching ORDER BY needs no sort. "In this example, adding ORDER BY unique1 would use the same plan because the index already implicitly provides the requested ordering." (14.1.1)
- A small change in selectivity can pick a different join method. "If we change the query's selectivity a bit, we might get a very different join plan:" (14.1.1)
- Fetching rows through an index one by one costs more per row than reading in order, but can still win. "Fetching rows separately is much more expensive than reading them sequentially, but because not all the pages of the table have to be visited, this is still cheaper than a sequential scan." (14.1.1)
- A Filter lowers the row estimate but raises the cost slightly, since every row is still visited and checked. "in fact it has gone up a bit (by 10000 * cpu_operator_cost, to be exact) to reflect the extra CPU time spent checking the WHERE condition." (14.1.1)
- Many enable_* flags only discourage a node type, and EXPLAIN marks disabled nodes. "many of the flags only discourage the use of the corresponding plan node and don't outright disallow the planner's ability to use the plan node type." (14.1.1)
- Index Searches counts index descents across all loops. "show an “Index Searches” line that reports the total number of searches across all node executions/loops" (14.1.2)
- On a one-page table you nearly always get a sequential scan. "on a table that only occupies one disk page, you'll nearly always get a sequential scan plan whether indexes are available or not." (14.1.3)
- Adding a WHERE filter raises a seq scan's cost slightly (445 to 470 in the example). "in fact it has gone up a bit (by 10000 * cpu_operator_cost, to be exact) to reflect the extra CPU time spent checking the WHERE condition." (14.1.1)
- The less selective version of the nested-loop example (t1.unique1 < 100) becomes a Hash Join. "If we change the query's selectivity a bit, we might get a very different join plan:" followed by a Hash Join plan (14.1.1)

## Visuals worth redrawing

- The nested loop example with a Bitmap Heap Scan outer and an Index
  Scan inner (14.1.2), as an annotated plan tree.

## My notes

- Examples are from the regression database on v18 sources, so row
  counts print with two decimals (rows=10.00), new in 18.

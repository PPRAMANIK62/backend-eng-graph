---
id: selinger-access-path-1979
title: "Access Path Selection in a Relational Database Management System"
author: P. Griffiths Selinger, M. M. Astrahan, D. D. Chamberlin, R. A. Lorie, T. G. Price
url: https://courses.cs.duke.edu/compsci516/cps216/spring03/papers/selinger-etal-1979.pdf
kind: paper
primary: true
---

## Summary

The System R optimizer paper (IBM, SIGMOD 1979), the design nearly every
cost-based planner still follows: estimate how many rows each condition
keeps from stored statistics, cost each access path in page fetches plus
CPU, and search join orders by building the best plan for growing
subsets of tables. Read from a PDF copy on a Duke course page.

## Key claims

- SQL says what, not how. "requests are stated non-procedurally, without reference to access paths." (Abstract)
- The cost formula mixes I/O and CPU. "COST = PAGE FETCHES + W * (RSI CALLS)." (section 4)
- W is a tunable weight. "W is an adjustable weighting factor between I/O and CPU." (section 4)
- Statistics are refreshed by a command, not on every write. "They are then updated periodically by an UPDATE STATISTICS command, which can be run by any user." (section 4)
- Why not on every write. "System R does not update these statistics at every INSERT, DELETE, or UPDATE because of the extra database operations and the locking bottleneck this would create at the system catalogs." (section 4)
- With no index statistics, an equality condition is guessed to keep one tenth. "F = 1/10 otherwise" (Table 1, column = value)
- Conditions are combined by multiplying their selectivities, which assumes independence. "the product of all the selectivity factors" (section 4)
- Join order search space. "If a query block has n relations in its FROM list, then there are n factorial permutations of relation join orders." (section 5)
- The dynamic-programming idea. "Using this property, an efficient way to organize the search is to find the best join order for successively larger subsets of tables." (section 5)
- Interesting orders: sort orders that later steps can use. "Also every join column defines an “interesting” order." (section 5)
- Estimates were off but rankings mostly right. "Preliminary results indicate that, although the costs predicted by the optimizer are often not accurate in absolute value, the true optimal path is selected in a large majority of cases." (section 7)

## Visuals worth redrawing

- The search tree of join orders built subset by subset (section 5, figures of the example query).

## My notes

- Combined selectivity is the product of the per-condition factors, which is the independence assumption later papers attack.

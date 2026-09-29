---
id: leis-query-optimizers-2015
title: "How Good Are Query Optimizers, Really?"
author: Viktor Leis, Andrey Gubichev, Atanas Mirchev, Peter Boncz, Alfons Kemper, Thomas Neumann
url: https://www.vldb.org/pvldb/vol9/p204-leis.pdf
kind: paper
primary: true
---

## Summary

A PVLDB paper (vol. 9, 2015) that measured the three parts of a classic
optimizer, cardinality estimation, cost model and plan enumeration, on a
real correlated data set (IMDB, the Join Order Benchmark) using
PostgreSQL 9.4 and several other systems. Main finding: row estimates
are badly wrong, get worse with each join, and cause most bad plans; the
cost model matters much less.

## Key claims

- The classic architecture relies on simplifying assumptions. "In reality, cardinality estimates are usually computed based on simplifying assumptions like uniformity and independence." (1 Introduction)
- Those assumptions fail on real data. "In realworld data sets, these assumptions are frequently wrong, which may lead to sub-optimal and sometimes disastrous plans." (1 Introduction)
- Setup: 113 queries. "Our query set consists of 33 query structures, each with 2-6 variants that differ in their selections only, resulting in a total of 113 queries." (2.2)
- Setup: PostgreSQL 9.4, data in RAM. "running PostgreSQL 9.4 on Linux" (2.4)
- Large errors everywhere. "For all systems we routinely observe misestimates by a factor of 1000 or more." (3.2)
- Errors grow with joins. "the errors grow exponentially (note the logarithmic scale)" (3.2)
- Systematic underestimation of join sizes. "all tested systems—though DBMS A to a lesser degree—tend to systematically underestimate the results sizes of queries with multiple joins." (3.2)
- PostgreSQL picks nested loops on cost alone, which is risky when rows are underestimated. "The underlying reason why PostgreSQL chooses nested-loop joins is that it picks the join algorithm on a purely cost-based basis." (4, The Risk of Relying on Estimates)
- The cost model matters less than estimates. "We show that, unsurprisingly, the difference between the cost models is dwarfed by the cardinality estimates errors." (5)
- Conclusion. "relational database systems produce large estimation errors that quickly grow as the number of joins increases, and that these errors are usually the reason for bad plans." (8)
- Exhaustive search still helps. "exhaustive enumeration algorithms find better plans than heuristics." (8)
- Five systems tested. "We loaded the IMDB data set into 5 relational database systems: PostgreSQL, HyPer, and 3 commercial systems." (2.4)
- The data set is highly correlated. "the highly correlated IMDB real-world data set" (1 Introduction)
- A tiny cost gap decides the join method. "if the cost estimate is 1,000,000 with the nested-loop join algorithm and 1,000,001 with a hash join, PostgreSQL will always prefer the nested-loop algorithm" (4, The Risk of Relying on Estimates)

## Visuals worth redrawing

- Figure 1: traditional optimizer architecture (cardinality estimation, cost model, plan space enumeration). Redrawn in query-planner.
- Figure 3: estimate error vs number of joins, per system.

## My notes

- Their results are for their benchmark and versions; newer PostgreSQL versions weren't tested.

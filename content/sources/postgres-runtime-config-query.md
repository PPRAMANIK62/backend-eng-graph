---
id: postgres-runtime-config-query
title: "PostgreSQL documentation, 19.7 Query Planning"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/runtime-config-query.html
kind: docs
primary: true
---

## Summary

The planner's settings in Postgres 18.6: switches that discourage plan
types, the cost constants and their defaults, the genetic optimizer
threshold, and generic vs custom plans for prepared statements.

## Key claims

- Turning off a plan type only discourages it. "It is impossible to suppress sequential scans entirely, but turning this variable off discourages the planner from using one if there are other methods available." (19.7.1, enable_seqscan)
- Cost units are arbitrary, only ratios matter. "The cost variables described in this section are measured on an arbitrary scale. Only their relative values matter" (19.7.2)
- No well-defined way to set them. "Unfortunately, there is no well-defined method for determining ideal values for the cost variables." (19.7.2)
- seq_page_cost default. "The default is 1.0." (19.7.2, seq_page_cost)
- random_page_cost default. "The default is 4.0." (19.7.2, random_page_cost)
- Why random_page_cost is only 4. "However, a lower default is used (4.0) because the majority of random accesses to storage, such as indexed reads, are assumed to be in cache." (19.7.2, random_page_cost)
- Real random reads cost far more than 4x. "Random access to durable storage is normally much more expensive than four times sequential access." (19.7.2, random_page_cost)
- Equal page costs make sense when everything is cached. "However, setting them equal makes sense if the database is entirely cached in RAM, since in that case there is no penalty for touching pages out of sequence." (19.7.2, random_page_cost)
- cpu_tuple_cost default. "Sets the planner's estimate of the cost of processing each row during a query. The default is 0.01." (19.7.2)
- cpu_index_tuple_cost default. "Sets the planner's estimate of the cost of processing each index entry during an index scan. The default is 0.005." (19.7.2)
- cpu_operator_cost default. "Sets the planner's estimate of the cost of processing each operator or function executed during a query. The default is 0.0025." (19.7.2)
- A page (block) is typically 8 kB. "If this value is specified without units, it is taken as blocks, that is BLCKSZ bytes, typically 8kB." (19.7.2, effective_cache_size)
- effective_cache_size is an estimate only, default 4GB. "The default is 4 gigabytes (4GB)." (19.7.2)
- geqo_threshold default and reason. "The default is 12. For simpler queries it is usually best to use the regular, exhaustive-search planner, but for queries with many tables the exhaustive search takes too long, often longer than the penalty of executing a suboptimal plan." (19.7.3)
- default_statistics_target. "The default is 100." (19.7.4)
- Generic plans skip planning but ignore parameter values. "Thus, use of a generic plan saves planning time, but if the ideal plan depends strongly on the parameter values then a generic plan may be inefficient." (19.7.4, plan_cache_mode)
- geqo_threshold counts FROM items. "Use genetic query optimization to plan queries with at least this many FROM items involved." (19.7.3)
- random_page_cost is the cost of an out-of-order page. "Sets the planner's estimate of the cost of a non-sequentially-fetched disk page." (19.7.2)

## Visuals worth redrawing

None.

## My notes

- Pages are BLCKSZ, "typically 8kB" (effective_cache_size entry).

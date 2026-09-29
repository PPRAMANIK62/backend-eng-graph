---
id: spark-sql-performance-tuning
title: Performance Tuning (Spark SQL guide, Spark 4.2.0)
author: Apache Spark project
url: https://spark.apache.org/docs/latest/sql-performance-tuning.html
kind: docs
primary: true
---

## Summary

Spark SQL's tuning page (Spark 4.2.0): the default shuffle partition
count, broadcast joins, and Adaptive Query Execution, which uses
statistics from finished shuffle stages to merge small partitions and
split skewed ones.

## Key claims

- Default shuffle partitions for joins and aggregations: 200. "Configures the number of partitions to use when shuffling data for joins or aggregations." (spark.sql.shuffle.partitions, default 200)
- Small tables can be broadcast to every worker for a join. "Configures the maximum size in bytes for a table that will be broadcast to all worker nodes when performing a join." (spark.sql.autoBroadcastJoinThreshold)
- AQE is on by default since Spark 3.2.0. "Adaptive Query Execution (AQE) is an optimization technique in Spark SQL that makes use of the runtime statistics to choose the most efficient query execution plan, which is enabled by default since Apache Spark 3.2.0." (Adaptive Query Execution)
- AQE merges small shuffle partitions. "You do not need to set a proper shuffle partition number to fit your dataset." (Coalescing Post Shuffle Partitions)
- Skew hurts joins; AQE splits skewed partitions. "Data skew can severely downgrade the performance of join queries." (Optimizing Skew Join)
- What counts as skewed: 5 times the median and over 256 MB by default. "A partition is considered as skewed if its size is larger than this factor multiplying the median partition size and also larger than spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes." (skewedPartitionFactor, default 5.0; threshold default 256MB)
- The skew join handling works on sort-merge joins. "This feature dynamically handles skew in sort-merge join by splitting (and replicating if needed) skewed tasks into roughly evenly sized tasks." (Optimizing Skew Join)
- AQE also splits skewed partitions in a rebalance (the REBALANCE hint), since 3.2.0. "Spark will optimize the skewed shuffle partitions in RebalancePartitions and split them to smaller ones according to the target size" (Splitting skewed shuffle partitions, spark.sql.adaptive.optimizeSkewsInRebalancePartitions.enabled, default true)

## Visuals worth redrawing

None.

## My notes

- Advisory partition size default is 64MB (coalescePartitions section).

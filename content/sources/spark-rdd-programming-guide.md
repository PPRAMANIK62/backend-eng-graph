---
id: spark-rdd-programming-guide
title: RDD Programming Guide (Spark 4.2.0 documentation)
author: Apache Spark project
url: https://spark.apache.org/docs/latest/rdd-programming-guide.html
kind: docs
primary: true
---

## Summary

The Spark 4.2.0 guide to RDDs: transformations are lazy, actions run
them, and the "Shuffle operations" section explains which operations
cause a shuffle, how Spark writes and reads shuffle data, and why it's
expensive.

## Key claims

- Transformations are lazy; actions trigger work. "All transformations in Spark are lazy, in that they do not compute their results right away." (RDD Operations)
- The shuffle regroups data across partitions and machines. "The shuffle is Spark’s mechanism for re-distributing data so that it’s grouped differently across partitions." (Shuffle operations)
- It copies data between executors and machines. "This typically involves copying data across executors and machines, making the shuffle a complex and costly operation." (Shuffle operations)
- Shuffle map and reduce tasks are named after MapReduce, not Spark's map and reduce. "This nomenclature comes from MapReduce and does not directly relate to Spark’s map and reduce operations." (Shuffle operations, Performance Impact)
- It's an all-to-all operation. "Spark needs to perform an all-to-all operation." (Shuffle operations, Background)
- Which operations shuffle. "Operations which can cause a shuffle include repartition operations like repartition and coalesce, ‘ByKey operations (except for counting) like groupByKey and reduceByKey, and join operations like cogroup and join." (Shuffle operations, Background)
- Why it's expensive. "The Shuffle is an expensive operation since it involves disk I/O, data serialization, and network I/O." (Shuffle operations, Performance Impact)
- Map-side output is sorted by target partition and written to one file. "Then, these are sorted based on the target partition and written to a single file." (Shuffle operations, Performance Impact)
- Spilling when data doesn't fit in memory. "When data does not fit in memory Spark will spill these tables to disk, incurring the additional overhead of disk I/O and increased garbage collection." (Shuffle operations, Performance Impact)
- Order within a partition after a shuffle isn't deterministic. "Although the set of elements in each partition of newly shuffled data will be deterministic, and so is the ordering of partitions themselves, the ordering of these elements is not." (Shuffle operations, Background)
- Shuffle files are kept so lineage recompute doesn't redo them, and can fill disks. "This means that long-running Spark jobs may consume a large amount of disk space." (Shuffle operations, Performance Impact)
- Prefer reduceByKey over groupByKey for aggregations. "using reduceByKey or aggregateByKey will yield much better performance." (Transformations, groupByKey note)
- reduceByKey and aggregateByKey build their in-memory structures on the map side. "Specifically, reduceByKey and aggregateByKey create these structures on the map side, and 'ByKey operations generate these on the reduce side." (Shuffle operations, Performance Impact)
- Map output stays in memory until it no longer fits. "Internally, results from individual map tasks are kept in memory until they can’t fit." (Shuffle operations, Performance Impact)

## Visuals worth redrawing

None.

## My notes

- Spark's "map" and "reduce" tasks in a shuffle are named after
  MapReduce and aren't Spark's map/reduce operations; the guide says so.

---
id: zaharia-rdd-2012
title: "Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing"
author: Matei Zaharia, Mosharaf Chowdhury, Tathagata Das, Ankur Dave, Justin Ma, Murphy McCauley, Michael J. Franklin, Scott Shenker, Ion Stoica
url: https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf
kind: paper
primary: true
---

## Summary

The NSDI 2012 paper behind Spark. Chaining MapReduce jobs means writing
every intermediate result to a replicated file system; RDDs keep
intermediate data in memory and recover lost partitions from lineage
(the recipe that built them). Narrow vs wide dependencies decide where
shuffles, and stage boundaries, fall.

## Key claims

- The problem with MapReduce for multi-step work: reuse goes through stable storage. "the only way to reuse data between computations (e.g., between two MapReduce jobs) is to write it to an external stable storage system, e.g., a distributed file system." (1 Introduction)
- Iterative ML and graph algorithms reuse data. "Data reuse is common in many iterative machine learning and graph algorithms" (1 Introduction)
- RDDs are immutable. "Although individual RDDs are immutable" (2.1, footnote 2)
- Fault tolerance by lineage, not replication. "This allows them to efficiently provide fault tolerance by logging the transformations used to build a dataset (its lineage) rather than the actual data." (1 Introduction)
- A lost partition is recomputed from lineage. "If a partition of an RDD is lost, the RDD has enough information about how it was derived from other RDDs to recompute" (1 Introduction; the sentence ends "just that partition")
- Up to 20x faster than Hadoop for iterative jobs. "We show that Spark is up to 20× faster than Hadoop for iterative applications" (1 Introduction)
- Narrow vs wide dependencies. "narrow dependencies, where each partition of the parent RDD is used by at most one partition of the child RDD, wide dependencies, where multiple child partitions may depend on it." (4 Representing RDDs)
- Narrow dependencies pipeline on one node. "narrow dependencies allow for pipelined execution on one cluster node, which can compute all the parent partitions." (4 Representing RDDs)
- Wide dependencies need a shuffle. "In contrast, wide dependencies require data from all parent partitions to be available and to be shuffled across the nodes using a MapReducelike operation." (4 Representing RDDs)
- Losing a node under wide dependencies can mean recomputing a lot. "a single failed node might cause the loss of some partition from all the ancestors of an RDD, requiring a complete re-execution." (4 Representing RDDs)
- Stages end at shuffles. "The boundaries of the stages are the shuffle operations required for wide dependencies" (5.1 Job Scheduling)
- Shuffle output is materialized on the map side, like MapReduce. "we currently materialize intermediate records on the nodes holding parent partitions to simplify fault recovery, much like MapReduce materializes map outputs." (5.1 Job Scheduling)
- Writing intermediate data to a distributed file system costs replication, disk I/O and serialization. "This incurs substantial overheads due to data replication, disk I/O, and serialization" (1 Introduction)

## Visuals worth redrawing

- Figure 4 (narrow vs wide dependencies) and figure 5 (stages cut at
  shuffle boundaries).

## My notes

- The 20x figure is from the paper's own benchmarks on 2012 hardware
  and Hadoop; pin it to that.

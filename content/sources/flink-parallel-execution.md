---
id: flink-parallel-execution
title: Parallel Execution (Flink)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/execution/parallel/
kind: docs
primary: true
---

## Summary

Flink 2.3 docs on parallelism, and on max parallelism: the fixed number
of key groups that bounds how far a job can later scale out.

## Key claims

- Max parallelism exists because state is split into key groups. "This is required because Flink internally partitions state into key-groups and we cannot have +Inf number of key-groups because this would be detrimental to performance." (Parallel Execution)
- The default. "The default setting for the maximum parallelism is roughly operatorParallelism + (operatorParallelism / 2) with a lower bound of 128 and an upper bound of 32768." (Setting the Maximum Parallelism)
- Too large costs memory in some backends. "some state backends have to keep internal data structures that scale with the number of key-groups" (Setting the Maximum Parallelism)
- It can't be changed on restore. "Changing the maximum parallelism explicitly when recovery from original job will lead to state incompatibility." (Setting the Maximum Parallelism)
- Max parallelism is the upper bound when restoring with a new parallelism. "this setting specifies an upper bound on the parallelism." (Parallel Execution)

## Visuals worth redrawing

None.

## My notes

None.

---
id: dean-mapreduce-2004
title: "MapReduce: Simplified Data Processing on Large Clusters"
author: Jeffrey Dean, Sanjay Ghemawat
url: https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf
kind: paper
primary: true
---

## Summary

The OSDI 2004 paper from Google. You write a map function and a reduce
function; the library splits the input, runs map tasks near the data,
partitions their output by key, has reducers pull and sort it, and
handles failures by re-running tasks. Includes the combiner, backup
tasks for stragglers, and how atomic output commits make re-execution
safe.

## Key claims

- The model: map emits intermediate pairs, reduce merges values per key. "Users specify a map function that processes a key/value pair to generate a set of intermediate key/value pairs, and a reduce function that merges all intermediate values associated with the same intermediate key." (Abstract)
- The runtime hides partitioning, scheduling, failures and communication. "The run-time system takes care of the details of partitioning the input data, scheduling the program’s execution across a set of machines, handling machine failures, and managing the required inter-machine communication." (Abstract)
- The running example is word count. "Consider the problem of counting the number of occurrences of each word in a large collection of documents." (2.1 Example)
- Re-execution is the main fault-tolerance mechanism. "to use re-execution as the primary mechanism for fault tolerance." (1 Introduction)
- Input split into M pieces of 16 to 64 MB. "splits the input files into M pieces of typically 16 megabytes to 64 megabytes (MB) per piece" (3.1 Execution Overview, step 1)
- Reduce side partitioned by hash(key) mod R. "Reduce invocations are distributed by partitioning the intermediate key space into R pieces using a partitioning function (e.g., hash(key) mod R)." (3.1 Execution Overview)
- Map output goes to local disk, split into R regions. "Periodically, the buffered pairs are written to local disk, partitioned into R regions by the partitioning function." (3.1, step 4)
- Reducers fetch map output over RPC and sort it by key. "When a reduce worker has read all intermediate data, it sorts it by the intermediate keys so that all occurrences of the same key are grouped together." (3.1, step 5)
- Too much for memory means an external sort. "If the amount of intermediate data is too large to fit in memory, an external sort is used." (3.1, step 5)
- The master pings workers and marks silent ones failed. "The master pings every worker periodically." (3.3 Worker Failure)
- Completed reduce tasks are not re-run. "Completed reduce tasks do not need to be re-executed since their output is stored in a global file system." (3.3 Worker Failure)
- Completed map tasks re-run on failure because their output was on the dead machine's local disk. "Completed map tasks are re-executed on a failure because their output is stored on the local disk(s) of the failed machine and is therefore inaccessible." (3.3 Worker Failure)
- Deterministic functions give the same output as a sequential run. "When the user-supplied map and reduce operators are deterministic functions of their input values, our distributed implementation produces the same output as would have been produced by a non-faulting sequential execution of the entire program." (3.3 Semantics in the Presence of Failures)
- Reduce output is committed by atomic rename. "When a reduce task completes, the reduce worker atomically renames its temporary output file to the final output file." (3.3 Semantics in the Presence of Failures)
- With non-deterministic functions the guarantee is weaker. "When the map and/or reduce operators are nondeterministic, we provide weaker but still reasonable semantics." (3.3 Semantics in the Presence of Failures)
- Output is one file per reduce task. "the output of the mapreduce execution is available in the R output files (one per reduce task, with file names as specified by the user)." (3.1 Execution Overview)
- Scheduling map tasks near their input saves network. "attempts to schedule a map task on a machine that contains a replica of the corresponding input data." (3.4 Locality)
- Many more tasks than machines helps balancing and recovery. "Ideally, M and R should be much larger than the number of worker machines." (3.5 Task Granularity)
- Typical sizes. "We often perform MapReduce computations with M = 200, 000 and R = 5, 000, using 2,000 worker machines." (3.5 Task Granularity)
- Stragglers: backup tasks near the end; sort took 44% longer without them. "the sort program described in Section 5.3 takes 44% longer to complete when the backup task mechanism is disabled." (3.6 Backup Tasks)
- Combiner does partial reduce on the map side before the network. "We allow the user to specify an optional Combiner function that does partial merging of this data before it is sent over the network." (4.3 Combiner Function)
- Combiners need a commutative, associative reduce. "the userspecified Reduce function is commutative and associative." (4.3 Combiner Function)
- The sort benchmark is about 1 TB. "(approximately 1 terabyte of data)" (5.3 Sort)
- The failure test killed 200 of 1,746 workers. "we intentionally killed 200 out of 1746 worker processes several minutes into the computation." (5.5 Machine Failures)
- The hardware of the time. "Machines are typically dual-processor x86 processors running Linux, with 2-4 GB of memory per machine." (3 Implementation)
- Why a combiner helps word count: word frequencies are skewed. "Since word frequencies tend to follow a Zipf distribution, each map task will produce hundreds or thousands of records of the form <the, 1>." (4.3 Combiner Function)
- Side effects must be made atomic and idempotent by the programmer. "We rely on the application writer to make such side-effects atomic and idempotent." (4.5 Side-effects)
- Default partitioning is a hash, and users can supply their own. "A default partitioning function is provided that uses hashing (e.g. “hash(key) mod R”)." (4.1 Partitioning Function)
- Killing 200 of 1,746 workers added 5% to the sort. "The entire computation finishes in 933 seconds including startup overhead (just an increase of 5% over the normal execution time)." (5.5 Machine Failures)
- One copy of the program is the master; the rest are workers. "One of the copies of the program is special – the master. The rest are workers that are assigned work by the master." (3.1, step 2; text interleaved across columns)
- Map workers report where their output is, and the master tells the reducers. "The locations of these buffered pairs on the local disk are passed back to the master, who is responsible for forwarding these locations to the reduce workers." (3.1, step 4)
- Reduce output is appended to one output file per partition. "The output of the Reduce function is appended to a final output file for this reduce partition." (3.1, step 6)
- Every in-progress task writes to private temporary files. "Each in-progress task writes its output to private temporary files." (3.3 Semantics in the Presence of Failures)
- Atomic rename leaves exactly one execution's output. "to guarantee that the final file system state contains just the data produced by one execution of the reduce task." (3.3)
- Many small tasks spread a failed worker's map work over everyone. "the many map tasks it has completed can be spread out across all the other worker machines." (3.5 Task Granularity)
- Clusters are hundreds or thousands of machines, so failures are common. "A cluster consists of hundreds or thousands of machines, and therefore machine failures are common." (3 Implementation)
- With non-deterministic operators, each reduce task matches some sequential run, possibly a different one per task. "the output of a particular reduce task R1 is equivalent to the output for R1 produced by a sequential execution of the non-deterministic program." (3.3; the next sentences say R2 may match a different execution)

## Visuals worth redrawing

- Figure 1: execution overview (user program, master, map workers
  reading splits, local intermediate files, reduce workers, output
  files).

## My notes

- The hardware section (2 to 4 GB RAM, 100 Mb/s to 1 Gb/s) dates the
  paper; don't carry its numbers into present-tense claims.

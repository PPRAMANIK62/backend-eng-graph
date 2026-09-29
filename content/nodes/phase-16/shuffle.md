---
id: shuffle
title: The shuffle
depth: short
phase: 16
note: >-
  Moving data between machines so matching keys meet. The expensive
  step.
needs: [batch-processing]
leads_to: []
compare_with: [stateful-stream-processing, hot-spots]
---

# The shuffle

The shuffle is the step in a [[batch-processing|batch job]] that moves
data between machines so that all the records with the same key end up
in the same place. Any grouping, aggregation by key or [[joins|join]] needs one.
It's costly, because it touches the disk, the network and
serialization all at once.

## Why you can't avoid it

Take a Spark job that sums sales per customer with `reduceByKey`. The
input is split into partitions, and each task works on one partition.
But nothing put all of one customer's sales in the same partition, so
the sales for customer 42 are spread over every partition, on every
machine. To compute one total, some task has to see all of them.

So Spark regroups the data: it reads from all the partitions, sends
each record to the partition that owns its key, and only then runs the
sum. Every input partition may send data to every output partition.
That all-to-all regrouping is the shuffle.

Operations that trigger one in Spark: repartitioning (`repartition`,
`coalesce`), most "by key" operations (`groupByKey`, `reduceByKey`,
but not counting), and joins (`join`, `cogroup`). Each shuffle is also
a stage boundary, because a wide dependency needs data from every
input partition before it can start. Everything before it runs as one pipelined pass per
partition; everything after has to wait for it.

## What actually happens

A shuffle has two sides, and Spark still names them after MapReduce:
**map tasks** write the data out, **reduce tasks** read it in. The
names have nothing to do with Spark's `map` and `reduce` operations.

![Three map tasks, each with one output file divided into blocks p1, p2 and p3, sorted by target partition. Three reduce tasks each fetch their own block from every map task's file, so reduce 2 fetches p2 from map 1, map 2 and map 3. Nine transfers in all: with M map tasks and R reduce tasks there are M times R pieces to move.](img/shuffle-all-to-all.svg)

*Every reduce task reads a piece from every map task.*

On the map side, each task keeps its output in memory as long as it
fits, then sorts it by target partition and writes it to a single file
on local disk. On the reduce side, each task reads its own sorted block
from every map task's file. With M map tasks and R reduce tasks, that's
M × R pieces.

It costs in several places at once:

- **Serialization.** Records are turned into bytes to be written and
  sent, and back again on the other side.
- **Disk.** Map output goes to disk. Data that doesn't fit in memory
  on either side spills to disk too, which adds more I/O and more
  [[garbage-collection|garbage collection]].
- **Network.** Blocks are copied across executors and machines.
- **Leftover files.** Spark keeps shuffle files around so it doesn't
  have to recompute them if a partition is lost. A long-running job
  can fill up the disk this way.

## Making it cheaper

**Combine before you shuffle.** For an aggregation, use `reduceByKey`
or `aggregateByKey`, not `groupByKey` followed by a sum. The first two
combine values on the map side, so each map task sends one partial
total per key instead of every record, and they perform much better.

**Don't shuffle a small table.** If one side of a join is small, Spark
SQL can send a copy of it to every worker instead (a broadcast join),
and the big side never moves.

**Get the number of partitions right.** Spark SQL uses 200 shuffle
partitions by default for joins and aggregations. Too few and each
task gets too much data; too many and you get thousands of tiny tasks.
Since Spark 3.2.0, adaptive query execution is on by default: it looks
at how big the map output actually was and merges small shuffle
partitions, so you don't have to guess the number up front.

## Where it gets tricky

**Skew.** Hashing sends every record for one key to one partition. If
one key has far more data than the rest (a [[hot-spots|hot key]]), one
reduce task does most of the work and the job waits on it. Spark SQL's
adaptive execution treats a partition as skewed when it's more than 5
times the median size and larger than 256 MB (the defaults), and splits
it during a sort-merge join. It also splits skewed partitions when you
ask for a `REBALANCE`. Outside those cases, skew is yours to fix.

**Order isn't kept.** After a shuffle, which records land in which
partition is deterministic, but their order inside the partition isn't.
If you need sorted output, sort explicitly.

## What this means when you build

- Count the shuffles in your job; each one is a stage boundary and a
  full pass over the data through disk and network.
- Filter and project before a shuffle, and combine on the map side.
- Broadcast small tables instead of shuffling big ones.
- Watch for one task that runs far longer than the rest. It's usually
  a hot key.

## Further reading

- [RDD Programming Guide](https://spark.apache.org/docs/latest/rdd-programming-guide.html), Apache Spark 4.2.0 docs. The "Shuffle operations" section: what triggers a shuffle, how it's written and read, and why it's expensive.
- [Resilient Distributed Datasets](https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf), Matei Zaharia and others, NSDI 2012. Why wide dependencies need a shuffle and how shuffles cut a job into stages.
- [Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html), Spark SQL 4.2.0 docs. Shuffle partition count, broadcast joins, and how adaptive execution coalesces partitions and splits skewed ones.

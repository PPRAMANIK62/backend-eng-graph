---
id: batch-processing
title: Batch processing
depth: deep
phase: 16
note: >-
  MapReduce and Spark: split the input, map, shuffle, reduce.
needs: [partitioning, atomic-rename]
leads_to: [shuffle, backfills, lambda-vs-kappa]
compare_with: [stream-processing]
---

# Batch processing

A batch job reads a fixed input, all of it, computes something, writes
the result and stops. When the input is too big for one machine,
systems like MapReduce and Spark split it into
[[partitioning|partitions]], run your code on every partition in
parallel across many machines, and deal with the machines that fail
along the way. Nightly reports, search indexes, training sets and
recomputing old data after a bug are all batch jobs.

## Word count, the classic example

Say you want to count how often each word appears in a large pile of
documents. On one machine you'd loop over the words and keep a hash map
of counts. MapReduce splits the job into two functions you write:

- **map** takes one input record (here, a document) and emits
  intermediate key-value pairs: `(word, 1)` for every word it sees.
- **reduce** takes one key and all the values emitted for it, and
  combines them: it sums the ones and emits `(word, total)`.

Everything between the two is the framework's job. It has to make sure
that every `(the, 1)` from every document, wherever it was produced,
ends up in the same reduce call.

![Word count as a MapReduce job. Three input splits, "the cat sat", "the dog" and "cat the", each go to a map task. Each map task writes its pairs into two parts on local disk, p1 and p2, chosen by hash of the word mod 2: for example the first writes "the 1" to p1 and "cat 1, sat 1" to p2. In the shuffle, reduce task 1 pulls p1 from all three map tasks and reduce task 2 pulls p2 from all three. Reduce 1 sorts and sums to "the 3, dog 1", reduce 2 to "cat 2, sat 1", and each writes one output file.](img/batch-processing-word-count.svg)

*Word count with three map tasks and two reduce tasks. Adapted from Jeffrey Dean and Sanjay Ghemawat, "MapReduce: Simplified Data Processing on Large Clusters", figure 1 (OSDI 2004).*

## How MapReduce runs it

Google's MapReduce (described in 2004) ran a job like this:

1. **Split the input** into M pieces, typically 16 to 64 MB each, and
   start copies of the program on many machines. One copy is the
   **master**; the rest are workers it hands tasks to.
2. **Map.** A worker given a map task reads its split, calls your map
   function on each record and buffers the output in memory.
3. **Partition to local disk.** Now and then it writes the buffered
   pairs to its own local disk, split into R regions, one per reduce
   task. Which region a key goes to is decided by a partitioning
   function, by default `hash(key) mod R`, so the same key always goes
   to the same reducer (see [[range-vs-hash-partitioning]]). The
   worker tells the master where the files are.
4. **Shuffle.** Each reduce worker fetches its region from every map
   worker's disk over RPC. This moving step is the [[shuffle]], and it's
   expensive: disk, serialization and network all at once.
5. **Sort and reduce.** Once it has all its data, the reducer sorts it
   by key (on disk, if it doesn't fit in memory), then calls your
   reduce function once per key, and appends the results to its output
   file.
6. **Done.** You get R output files, one per reduce task, often the
   input to the next job.

Two details make this fast in practice. The master schedules each map
task on a machine that already holds a copy of its input split, so most
input is read from local disk, not the network. And there are far more
tasks than machines. A typical job in the paper had M = 200,000 and
R = 5,000 on 2,000 workers. Many small tasks balance load, and when a
machine dies its work spreads over everyone else.

A **combiner** cuts the shuffle down. Word frequencies are very uneven,
so each map task produces hundreds or thousands of `(the, 1)` pairs. A
combiner runs the reduce logic on the map side first, so the map task
sends one `(the, n)` with its local total instead. It only works when the reduce is
commutative and associative, like a sum.

## Failure is handled by running it again

On a cluster of hundreds or thousands of machines, failures are
common. MapReduce's
answer is to re-run work rather than protect it.

The master pings every worker. If one stops answering, the master
marks it failed and reschedules its tasks elsewhere. That includes map
tasks that had already finished, because their output sat on the dead
machine's local disk. Finished reduce tasks don't need re-running: their
output is in the shared, replicated file system.

Re-running is safe because of a simple rule. If your map and reduce
functions are deterministic, the job's output is the same as a
single-machine run with no failures. The framework makes sure of that
by committing each task's output atomically. A task writes to private
temporary files. A finished reduce task [[atomic-rename|renames]] its
file to the final name, so even if two copies of the same task run,
the final file holds exactly one copy's output.

The same trick handles **stragglers**, machines that are slow rather
than dead. Near the end of a job, the master starts backup copies of
the tasks still running and takes whichever finishes first. In the
paper's 1 TB sort, turning that off made the job 44% slower. In the
same sort, killing 200 of 1,746 worker processes partway through
added only 5% to the total time.

## Spark: keep the intermediate data in memory

MapReduce has one weakness for multi-step work. Each job reads from
and writes to the replicated file system, so a chain of ten jobs writes
ten full intermediate results to disk, replicated. Iterative work, like
machine-learning training that passes over the same data many times,
pays that cost every pass.

Spark (the RDD paper, 2012) keeps intermediate datasets in memory
instead, and gets fault tolerance a different way. An RDD (resilient
distributed dataset) is an immutable, partitioned dataset that remembers
its **lineage**, the chain of transformations that built it from
stable input. If a machine dies, Spark rebuilds only the lost
partitions by replaying that recipe. On the paper's benchmarks it was
up to 20 times faster than Hadoop's MapReduce for iterative jobs.

Transformations like `map` and `filter` are lazy: they just record the
recipe. Nothing runs until an action, like `count` or writing output,
asks for a result. Then the scheduler looks at the recipe and splits
it into **stages**:

- A **narrow** dependency means each output partition needs only one
  input partition (`map`, `filter`). These chain together and run in
  one pass on one machine.
- A **wide** dependency means an output partition needs data from many
  input partitions (`groupByKey`, `reduceByKey`, most [[joins]]). That
  needs a shuffle, and every shuffle is a stage boundary.

Like MapReduce, Spark writes shuffle output on the map side, so losing
a reducer doesn't mean rerunning every map. MapReduce is a fixed
two-stage shape; Spark lets you string together any graph of stages,
but the cost model is the same. Stages are cheap. Shuffles are not.

## Batch next to streaming

A batch job has a beginning and an end: a known input, and a result
that only exists once the job finishes. A [[stream-processing|stream
processor]] runs forever over input that never ends, and has to decide
when a result is ready without ever seeing "all" of the data. Batch is
simpler to reason about, and because a deterministic job over the same
input gives the same output, you can rerun it whenever you like. That
is what makes [[backfills]] possible. Whether to keep a batch pipeline
next to a streaming one is its own question (see [[lambda-vs-kappa]]).

## Where it gets tricky

**"Deterministic" is a real requirement.** The same-output-as-one-run
guarantee holds only if map and reduce are deterministic. Use the clock,
a random number or anything that changes between runs, and a
re-executed task can produce different output. MapReduce then promises
something weaker: each reducer's output matches some single-machine
run, but two reducers may have seen different runs of the same map
task.

**Side effects run more than once.** Retries and backup tasks mean
your code can run twice for the same input. Output the framework
commits is safe. Anything else your task does, like writing a side
file or calling a service, is on you to make atomic and
[[idempotency|idempotent]].

**A job is as slow as its slowest task.** One slow machine, or one key
with far more data than the rest (a [[hot-spots|hot spot]]), leaves
the whole job waiting on one reducer. Backup tasks help with slow
machines but not with skew, because the backup has the same huge
partition to chew through. Spark SQL's adaptive execution, on by
default since Spark 3.2.0, can split skewed partitions during a join.

**Old numbers are old.** The MapReduce paper's machines had 2 to 4 GB
of memory, and Spark's 20 times was measured against Hadoop in 2012.
The design ideas hold up; the numbers don't carry over to today's
hardware.

## What this means when you build

- Write map and reduce logic as pure functions of their input. No
  clocks, no "latest" data, no hidden state.
- Make every side effect idempotent, since tasks run more than once.
- Commit output atomically: write to a temporary location, then
  publish in one step (a rename, or a table format commit).
- Design around the shuffle. Filter and combine before it, and watch
  for keys that are much bigger than the rest.
- Prefer many small tasks over a few big ones, so failures and slow
  machines cost little.

## Further reading

- [MapReduce: Simplified Data Processing on Large Clusters](https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf), Jeffrey Dean and Sanjay Ghemawat, OSDI 2004. The model, the execution steps, and fault tolerance by re-execution.
- [Resilient Distributed Datasets](https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf), Matei Zaharia and others, NSDI 2012. Why Spark keeps data in memory, lineage, and narrow vs wide dependencies.
- [RDD Programming Guide](https://spark.apache.org/docs/latest/rdd-programming-guide.html), Apache Spark 4.2.0 docs. Lazy transformations, actions, and which operations shuffle.
- [Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html), Spark SQL 4.2.0 docs. Adaptive query execution, including splitting skewed partitions.

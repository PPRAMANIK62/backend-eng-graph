---
id: stateful-stream-processing
title: Stateful stream processing
depth: deep
phase: 16
note: >-
  Keeping per-key state inside a stream job, where it lives, and how it
  moves when the job rescales. How Flink does it.
needs: [stream-processing, partitioning]
leads_to: [distributed-snapshots]
compare_with: [shuffle, rebalancing]
---

# Stateful stream processing

Most useful stream jobs have to remember things: a running count per
user, the events of a [[windowing|window]] that hasn't closed yet, the last reading
from each sensor. Stateful stream processing keeps that memory inside
the job itself, split by key across the machines that run it. Where the
state lives decides how fast the job runs, how it comes back after a
crash, and whether you can give it more machines later.

## A count per user, and where to keep it

Take a job that reads a topic of click events and counts clicks per
user per minute. Parsing each event and dropping bots is stateless:
every event can be handled on its own. Counting isn't. To add one to
Alice's count, the job has to know what her count was.

The traditional answer is to keep that count in a database the job
talks to. The job stays stateless, and every event turns into a remote
read and write. That works, but keeping the job and the database
consistent is now your code's problem, and the transactions it takes to
do that can become the bottleneck of the whole pipeline.

A stateful [[stream-processing|stream processor]] like Flink takes the
other route. The count lives in the job, in memory or on local disk,
right next to the code that updates it. Reading and updating it is a
local operation with no network hop.

## Partition the state the same way as the stream

A stream job runs as many parallel instances of each operator, spread
over several machines. For local state to work, all of Alice's events
have to reach the same instance, every time. So before a stateful step,
the job repartitions the stream by key: in Flink, `keyBy(userId)`. Each
event is routed by a hash of its key, the same idea as hash
[[partitioning]] in a database.

That one step also partitions the state. The instance that receives
Alice's events is the only one that holds Alice's count. Since no other
instance ever touches it, updates need no locks and no transactions.
It's the streaming version of a SQL `GROUP BY`: rows with the same key
end up in the same group, and each group is aggregated on its own.

One rule follows: the key must be a deterministic function of the
event. If the same event could produce a different key on a later run,
it would land on a different instance than its state.

Inside the operator, you declare state and the runtime scopes it to the
key of the event being processed. Flink offers a few shapes:

- `ValueState`: one value per key, like Alice's count.
- `ListState`: a list per key, like the events of an open window.
- `MapState`: a map per key, where you can read one entry without
  loading the whole map.
- `ReducingState` and `AggregatingState`: a value that new elements are
  folded into as they arrive.

This is **keyed state**, and it's what almost every stateful job uses.
The other kind is **operator state**, which belongs to one parallel
instance rather than to a key. The standard example is a Kafka source:
each instance keeps a map from the topic partitions it reads to its
current [[offsets-and-commits|offsets]]. There's also broadcast state,
where the same state (a set of rules, say) is kept on every instance.
Outside of sources, sinks and data with no natural key, you rarely need
operator state.

## Where the bytes live

The state handle in your code isn't the state. A **state backend**
decides where the bytes sit. Flink 2.3 has three:

- **HashMapStateBackend**, the default. State lives as Java objects on
  the heap. Every access is a plain object lookup, so it's fast, but all
  state has to fit in memory across the cluster.
- **EmbeddedRocksDBStateBackend**. State lives in an embedded RocksDB, a
  [[lsm-tree|LSM tree]], on each machine's local disk, as serialized
  bytes. The limit is disk space instead of memory. The cost is
  (de)serialization on every access and sometimes a disk read; on
  average it's an order of magnitude slower than the heap backend. A
  single key or value can't exceed 2^31 bytes. It can also take
  incremental checkpoints, writing only what changed since
  the last one.
- **ForStStateBackend**. It's built on RocksDB but keeps its files on
  remote storage like S3 or HDFS, with the local disk only as a cache.
  It's still marked experimental.

You can switch backends without changing the job's code. Since Flink
1.13 a savepoint taken under one backend can be restored under another.

## Rescaling: why keys go into key groups

Say the job runs with 2 instances and you need 3. The naive routing,
`hash(key) mod parallelism`, falls apart here: change the divisor and
most keys map to a different instance, so most of the state has to
move, key by key.

Flink adds a level in between. Each key is hashed into one of a fixed
number of **key groups**, and the number of key groups equals the job's
**max parallelism**. Each instance owns a contiguous range of key
groups. Rescaling changes the ranges, never the key-to-group mapping.

![Keys are hashed into 128 key groups. With 2 instances, instance 0 owns groups 0 to 63 and instance 1 owns 64 to 127. After rescaling to 3 instances, the ranges become 0 to 42, 43 to 85 and 86 to 127. A key such as user alice stays in the same key group; only the owner of the range changes.](img/stateful-stream-processing-key-groups.svg)

*Key groups with the default max parallelism of 128. Rescaling hands out new contiguous ranges; keys never change group. Ranges follow the allocation rule in Carbone et al., "State Management in Apache Flink" (VLDB 2017), section 3.1.1.*

Separating which group a key belongs to from which machine holds the
group is an idea Flink borrowed from Dynamo, and the same one behind
moving whole partitions instead of single keys when a database
[[rebalancing|rebalances]]. The key group is the
smallest unit of state that moves. Its size is a trade-off. At one
extreme, every new instance would scan all the state to find its keys,
which is a lot of wasted I/O. At the other, the snapshot would index
every single key, which costs metadata and many small reads. Key groups
sit in between: each new instance reads only the ranges it now owns, as
large sequential chunks, and contiguous ranges keep the reads from
seeking around.

Max parallelism is the ceiling on how far the job can ever scale out,
because you can't have more instances than key groups. The default is
roughly 1.5 times the operator's parallelism, at least 128 and at most
32,768. You can't change it when restoring a job from its saved state:
the key-to-group mapping would change and the state would no longer
line up. Setting it very high has a cost too, since some backends keep
data structures that grow with the number of key groups.

## Surviving a crash

Local state has an obvious weakness: it lives on one machine, and
machines die. Two designs deal with that.

Flink takes periodic, consistent snapshots of all operator state plus
the positions in the input streams, and writes them to durable storage.
After a failure it restores every operator from the latest snapshot and
rewinds the sources to the saved positions. That only works if the input
can be replayed from a position, which is why Flink jobs usually read
from a [[log-based-messaging|log-based broker]] like Kafka. How to take
such a snapshot without stopping the job is its own topic:
[[distributed-snapshots]]. One thing to know now: in Flink,
checkpointing is off by default, and a stateful job without it has
nothing to restore from.

Kafka Streams takes a different route. Each task keeps its local state
stores, and every update to a store is also written to a changelog
topic in Kafka. Those topics use [[log-compaction]] so they don't grow
forever. When a task moves to another machine, it rebuilds its stores
by replaying the changelog before processing resumes. That replay is
most of the recovery time, so you can ask for standby replicas: full
copies of a task's state kept on other instances, so a moved task can
start from one. The unit of
parallelism is fixed too, but by the number of input partitions rather
than by key groups.

## Where it gets tricky

**State that never shrinks.** Per-key state for a key you'll never see
again stays forever unless you remove it. A job that keeps state per
session ID grows without end. Flink lets you set a time-to-live on
keyed state, but only in processing time, and cleanup is best effort:
expired entries are dropped when read, and in the background by
incremental cleanup on the heap backend or a compaction filter in
RocksDB. Plan for expiry when you design the state, not after the disk
fills up.

**Max parallelism is chosen on day one.** It's easy to never set it,
then find the job can't scale past 128 instances without starting over
from empty state.

**Recovery time grows with state size.** With local backends, a
restarted or rescaled instance has to fetch its share of the snapshot
before it can process anything. A backend that keeps state in an
external store avoids that I/O on recovery. Flink points to ForSt,
which keeps its files on remote storage, when you want fast rescaling,
but it's still experimental in Flink 2.3.

**Memory or disk is a real trade.** The heap backend is limited by the
memory in the cluster. RocksDB is limited by disk instead, and pays for
it with (de)serialization on every access. RocksDB for state that would
fit in memory gives up speed for nothing.

## What this means when you build

- Key your state wherever you can. Keyed state rescales and needs no
  coordination; save operator state for sources and sinks.
- Make keys deterministic, and never key by something that changes on
  replay, like the processing time.
- Pick the backend by state size: memory if it will always fit, an
  on-disk store if it won't.
- Set max parallelism deliberately before the first production run.
- Give every piece of per-key state an expiry plan.
- Turn on checkpointing, and read from a source you can rewind. The
  phase 16 lab keeps per-key window aggregates in local state and
  depends on both.

## Further reading

- [Stateful Stream Processing](https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/), Apache Flink docs, Flink 2.3. The concepts: keyed state, key groups, backends and checkpointing in one page.
- [Working with State](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/state/), Apache Flink docs, Flink 2.3. The state types, TTL and its cleanup, operator and broadcast state.
- [State Backends](https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/state_backends/), Apache Flink docs, Flink 2.3. Heap vs RocksDB vs ForSt, and what each costs.
- [Parallel Execution](https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/execution/parallel/), Apache Flink docs, Flink 2.3. Max parallelism, its default, and why it can't change.
- [State Management in Apache Flink](https://www.vldb.org/pvldb/vol10/p1718-carbone.pdf), Paris Carbone et al., VLDB 2017. The design from the people who built it: key groups and the trade-off behind them, local vs external backends.
- [Kafka Streams Architecture](https://kafka.apache.org/43/streams/architecture/), Apache Kafka docs, Kafka 4.3. The changelog-topic alternative: local stores, restore by replay, standby replicas.

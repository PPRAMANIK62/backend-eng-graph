---
id: carbone-state-management-flink-2017
title: "State Management in Apache Flink: Consistent Stateful Distributed Stream Processing"
author: Paris Carbone, Stephan Ewen, Gyula Fóra, Seif Haridi, Stefan Richter, Kostas Tzoumas
url: https://www.vldb.org/pvldb/vol10/p1718-carbone.pdf
kind: paper
primary: true
---

## Summary

The VLDB 2017 paper by Flink's builders on how Flink manages state: keyed
and operator state, key groups for rescaling, the pipelined snapshot
protocol with alignment, local and external backends, asynchronous
snapshots, queryable state, exactly-once sinks, and production numbers
from King.

## Key claims

- State used to live in a shared database. "The typical architecture has the state centralized in a database management system shared among applications that are either stateless, or rely on the database for data consistency and scalability among others." (1 Introduction)
- Keyed state is scoped like a GROUP BY. "This is similar to how a relational GROUP BY projects rows of the same key to the same set to compute grouped aggregates." (3.1.1 Managed State)
- Key groups are the unit of reallocation. "This mapping ensures that a single parallel physical task will handle all states within each assigned group, making a key-group the atomic unit for re-allocation." (3.1.1, Key-Groups)
- The trade-off behind key groups. "The intuition behind key-groups lies in the trade-off between reconfiguration time (I/O during state scans) and metadata needed to re-allocate state (included within snapshots)." (3.1.1, Key-Groups)
- Each task gets a contiguous range, to avoid seeks. "by assigning contiguous key-groups we eliminate unnecessary seeks and read congestion, yielding low latency upon re-allocation." (3.1.1, State Re-Allocation)
- Assumption: input is durable and replayable from an offset. "Input data streams are durably logged and indexed externally allowing dataflow sources to re-consume their input, upon recovery, from a specific logical time (offset) by restoring their state." (3.2.2)
- Assumption: channels are reliable, FIFO and blockable. "Directional data channels between tasks are reliable, respect FIFO delivery and can be blocked or unblocked." (3.2.2)
- Blocked channels can spill to disk. "The blocking operation might result into spilling of in-transit records within that channel to disk, if allocated memory for network buffers reaches its limit." (3.2.3, Alignment)
- Snapshots hold only operator state, except in cycles. "snapshots are compacted, limited to minimal computational state with the exception of cyclic dataflow graphs where the partial inclusion of records in-transit is necessary." (1 Introduction)
- RocksDB snapshots mark a version so compaction keeps it. "Upon taking a snapshot, the synchronous triggerSnapshot() call simply marks the current version, which prevents all state as of that version to be overwritten during compactions." (4.2)
- The heap backend copies entries lazily on write while a snapshot is being written. "The operator’s regular stream processing thread lazily copies the state entries and overflow chains upon modification, if the materialization thread still holds onto the snapshot." (4.2)
- Queryable state reads uncommitted values. "From a traditional database isolation-level viewpoint, the queries access uncommitted state, thus following the read-uncommitted isolation level." (4.3)
- Local backends must load state from the snapshot on recovery; external backends don't. "A general advantage of external state backends is that rollback recovery does not require any I/O to retrieve and load state from snapshots (contrary to local state backends)." (4.1)
- Idempotent sinks can just write eagerly when the pipeline is deterministic. "For those cases, sinks need to take no further action to achieve exactly-once delivery guarantees than eagerly publishing their output." (4.4, Idempotent Sinks)
- Output can't be rolled back like state. "If sinks are connected, for example, to a printer that instantly flushes data on paper, a rollback would possibly print the same or alternating text twice." (4.4)
- Without idempotency, output needs a transactional commit. "When idempotency cannot be guaranteed, committing output to external systems (e.g., File Systems, DBMSs) has to be made in a coordinated, transactional way." (4.4)
- King measurement setup: five deployments, parallelism 70, 100 to 500 GB of state, Flink 1.2.0 with RocksDB on SSD snapshotting to HDFS. "We extracted measurements from five different RBEA deployments with fixed parallelism π = 70 ranging from 100 to 500 GB of global state respectively" (5.1.2)
- Average alignment cost. "inducing an average delay of 1.3 seconds per full snapshot across all deployments." (5.1.2)
- Alignment time doesn't grow with state size. "there are no indications that alignment times can be affected by the global state size." (5.1.2)
- It grows with shuffles and parallelism. "the overall alignment time is proportional to two factors: 1) the number of shuffles chained across the pipeline" (5.1.2)
- With state in an external database, keeping it consistent is the application's job, and transactions with it can become the bottleneck. "the burden of ensuring data consistency lies in the application logic, coordinating computation with external database systems." (1 Introduction)
- Keys are hashed into key groups. "maps keys to an intermediate circular hash space of “key-groups”" (3.1.1, Key-Groups)
- The design follows Dynamo in separating key partitioning from state allocation. "Flink decouples key-space partitioning and state allocation similarly to Dynamo" (3.1.1, Key-Groups)
- Key groups keep reads to what's needed, in large sequential chunks. "reads are only limited to data that is required and key-groups are typically large enough for coarse grained sequential reading" (3.1.1, Key-Groups)
- ListState is for append-only state such as a window. "For append-only state per key (e.g. for storing a pattern sequence or a window) there is a ListState collection supporting an add operation." (3.1.1, Keyed-State)
- MapState avoids deserializing a whole map for one lookup. "it avoids a full map deserialization to perform single key lookups." (3.1.1, Keyed-State)
- The JobManager coordinates each snapshot. "The snapshotting protocol is coordinated centrally by the JobManager and each invocation eventually completes or gets aborted" (3.2.1)
- The heap backend copies its table array, then writes in the background. "During a snapshot, it copies the current table array synchronously and then starts the external materialization of the snapshot, in a background thread." (4.2)
- King's cluster. "The production jobs share resources on a YARN cluster with 18 physical machines" (5.1.2)
- Parallelism affects alignment time. "Evidently, the number of parallel subtasks π affects the alignment time." (5.1.2)
- Eager idempotent output exposes uncommitted results; if readers can't tolerate that, output must wait for the snapshot. "cannot tolerate uncommitted reads" (4.4, Idempotent Sinks)
- Idempotent eager output needs deterministic pipeline logic. "In some cases deterministic pipeline logic and idempotency can already be offered by the stream application" (4.4, Idempotent Sinks)
- Equal-sized contiguous range allocation: instance i of π gets key groups from ceil(i·π-max/π) to floor((i+1)·π-max/π). "To re-assign state, we employ an equal-sized key-group range allocation." (3.1.1, State Re-Allocation)

## Visuals worth redrawing

- Figure 3: the pipelined snapshotting protocol across a dataflow graph.
- Figure 4: alignment steps (a) to (d) on a two-input task.

## My notes

- Numbers are from Flink 1.2.0 on King's 18-machine YARN cluster; old, but the only production numbers found.

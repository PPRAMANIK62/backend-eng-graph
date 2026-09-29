---
id: flink-stateful-stream-processing
title: Stateful Stream Processing (Flink concepts)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/concepts/stateful-stream-processing/
kind: docs
primary: true
---

## Summary

Flink's concepts page on state, as of the Flink 2.3 docs. What counts as
state, keyed state and key groups, how checkpoints work (barriers,
alignment, snapshotting operator state, recovery), unaligned checkpoints,
state backends, savepoints, and the at-least-once switch.

## Key claims

- Stateful operations remember information across events, like window operators. "some operations remember information across multiple events (for example window operators)" (What is State?)
- Examples: pending aggregates per minute or hour. "When aggregating events per minute/hour/day, the state holds the pending aggregates." (What is State?)
- Keyed state lives in an embedded key/value store. "Keyed state is maintained in what can be thought of as an embedded key/value store." (Keyed State)
- Keys of streams and state line up, so updates are local and need no transactions. "Aligning the keys of streams and state makes sure that all state updates are local operations, guaranteeing consistency without transaction overhead." (Keyed State)
- Key groups are the unit of redistribution, one per unit of max parallelism. "Key Groups are the atomic unit by which Flink can redistribute Keyed State; there are exactly as many Key Groups as the defined maximum parallelism." (Keyed State)
- Each parallel instance handles one or more key groups. "During execution each parallel instance of a keyed operator works with the keys for one or more Key Groups." (Keyed State)
- Fault tolerance is replay plus checkpoints. "Flink implements fault tolerance using a combination of stream replay and checkpointing." (State Persistence)
- The checkpoint interval trades runtime overhead against recovery time. "The checkpoint interval is a means of trading off the overhead of fault tolerance during execution with the recovery time (the number of records that need to be replayed)." (State Persistence)
- Checkpointing is off by default. "By default, checkpointing is disabled." (State Persistence)
- The source must be able to rewind. "the data stream source (such as message queue or broker) needs to be able to rewind the stream to a defined recent point." (State Persistence)
- Flink's snapshot algorithm comes from the ABS paper and is inspired by Chandy-Lamport. "It is inspired by the standard Chandy-Lamport algorithm for distributed snapshots and is specifically tailored to Flink’s execution model." (Checkpointing)
- Barriers flow in line with records. "Barriers never overtake records, they flow strictly in line." (Barriers)
- A barrier splits records into this snapshot and the next. "A barrier separates the records in the data stream into the set of records that goes into the current snapshot, and the records that go into the next snapshot." (Barriers)
- Several snapshots can be in flight at once. "Multiple barriers from different snapshots can be in the stream at the same time, which means that various snapshots may happen concurrently." (Barriers)
- The injection point Sn is a source position, e.g. a Kafka offset. "For example, in Apache Kafka, this position would be the last record’s offset in the partition." (Barriers)
- The checkpoint completes when all sinks acknowledge. "After all sinks have acknowledged a snapshot, it is considered completed." (Barriers)
- Operators with several inputs must align, or they'd mix snapshots. "Otherwise, it would mix records that belong to snapshot n and with records that belong to snapshot n+1." (Barriers)
- Where alignment is needed. "Note that the alignment is needed for all operators with multiple inputs and for operators after a shuffle when they consume output streams of multiple upstream subtasks." (Barriers)
- The state is written to the backend asynchronously. "Finally, the operator writes the state asynchronously to the state backend." (Barriers)
- The snapshot moment is clean. "At that point, all updates to the state from records before the barriers have been made, and no updates that depend on records from after the barriers have been applied." (Snapshotting Operator State)
- A snapshot holds source offsets plus a pointer to each operator's state. "For each parallel stream data source, the offset/position in the stream when the snapshot was started" (Snapshotting Operator State)
- Recovery uses the latest completed checkpoint. "Upon a failure, Flink selects the latest completed checkpoint k." (Recovery)
- Incremental recovery: full snapshot plus deltas. "If state was snapshotted incrementally, the operators start with the state of the latest full snapshot and then apply a series of incremental snapshot updates to that state." (Recovery)
- Unaligned checkpoints overtake in-flight data and store it. "The basic idea is that checkpoints can overtake all in-flight data as long as the in-flight data becomes part of the operator state." (Unaligned Checkpointing)
- Unaligned is closer to Chandy-Lamport. "Note that this approach is actually closer to the Chandy-Lamport algorithm" (Unaligned Checkpointing)
- Alignment can take hours with a slow path. "It’s especially suited for applications with at least one slow moving data path, where alignment times can reach hours." (Unaligned Checkpointing)
- Savepoints are always aligned. "Note that savepoints will always be aligned." (Unaligned Checkpointing)
- Two backends: heap hash map or RocksDB. "One state backend stores data in an in-memory hash map, another state backend uses RocksDB as the key/value store." (State Backends)
- Alignment usually adds a few ms. "Usually, this extra latency is on the order of a few milliseconds, but we have seen cases where the latency of some outliers increased noticeably." (Exactly Once vs. At Least Once)
- Skipping alignment causes duplicates on restore. "On a restore, these records will occur as duplicates, because they are both included in the state snapshot of checkpoint n, and will be replayed as part of the data after checkpoint n." (Exactly Once vs. At Least Once)
- Backends can change without changing the code. "State backends can be configured without changing your application logic." (State Backends)
- Kafka can rewind, and Flink's Kafka connector uses that. "Apache Kafka has this ability and Flink’s connector to Kafka exploits this." (State Persistence)
- Barriers are lightweight. "Barriers do not interrupt the flow of the stream and are hence very lightweight." (Barriers)
- Barriers are injected at the sources. "Stream barriers are injected into the parallel data flow at the stream sources." (Barriers)
- Unaligned: react to the first barrier. "The operator reacts on the first barrier that is stored in its input buffers." (Unaligned Checkpointing)
- Unaligned: forward it at once to the end of the output buffers. "It immediately forwards the barrier to the downstream operator by adding it to the end of the output buffers." (Unaligned Checkpointing)
- At-least-once mode still snapshots once every input has shown the barrier. "Checkpoint snapshots are still drawn as soon as an operator has seen the checkpoint barrier from each input." (Exactly Once vs. At Least Once)
- Map/filter-only jobs are exactly once even in at-least-once mode. "dataflows with only embarrassingly parallel streaming operations (map(), flatMap(), filter(), …) actually give exactly once guarantees even in at least once mode." (Exactly Once vs. At Least Once)
- The source position is reported to the coordinator. "This position Sn is reported to the checkpoint coordinator (Flink’s JobManager)." (Barriers)
- Replayed records never affected the restored state. "Any records that are processed as part of the restarted parallel dataflow are guaranteed to not have affected the previously checkpointed state." (State Persistence)
- Each barrier carries its snapshot ID. "Each barrier carries the ID of the snapshot whose records it pushed in front of it." (Barriers)

## Visuals worth redrawing

- Barriers in a stream, and the alignment steps on a two-input operator (Barriers section figures).

## My notes

- Version: the "stable" docs were Flink 2.3 when read. Unaligned checkpoints since 1.11.

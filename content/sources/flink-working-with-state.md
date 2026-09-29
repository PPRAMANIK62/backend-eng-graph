---
id: flink-working-with-state
title: Working with State (Flink DataStream API)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/dev/datastream/fault-tolerance/state/
kind: docs
primary: true
---

## Summary

The Flink 2.3 guide to using state in code: keyBy, the keyed state types,
state TTL and its cleanup, and operator and broadcast state.

## Key claims

- keyBy partitions both the state and the records. "If you want to use keyed state, you first need to specify a key on a DataStream that should be used to partition the state (and also the records in the stream themselves)." (Keyed DataStream)
- Keys must be deterministic. "The key can be of any type and must be derived from deterministic computations." (Keyed DataStream)
- ValueState holds one value per key. "ValueState<T>: This keeps a value that can be updated and retrieved" (Using Keyed State)
- MapState holds a map per key. "MapState<UK, UV>: This keeps a list of mappings." (Using Keyed State)
- The handle isn't where state lives. "The state is not necessarily stored inside but might reside on disk or somewhere else." (Using Keyed State)
- TTL cleans expired state on a best-effort basis. "If a TTL is configured and a state value has expired, the stored value will be cleaned up on a best effort basis" (State Time-To-Live)
- TTL is processing time only. "Only TTLs in reference to processing time are currently supported." (State Time-To-Live)
- Operator state belongs to one parallel instance. "Operator State (or non-keyed state) is state that is bound to one parallel operator instance." (Operator State)
- Kafka source offsets are operator state. "Each parallel instance of the Kafka consumer maintains a map of topic partitions and offsets as its Operator State." (Operator State)
- Most jobs don't need operator state. "In a typical stateful Flink Application you don’t need operators state." (Operator State)
- Broadcast state keeps the same state on every subtask. "records of one stream need to be broadcasted to all downstream tasks, where they are used to maintain the same state among all subtasks." (Broadcast State)
- ReducingState folds added values into one. "ReducingState<T>: This keeps a single value that represents the aggregation of all values added to the state." (Using Keyed State)
- Operator state is mostly for sources, sinks, and state with no key. "It is mostly a special type of state that is used in source/sink implementations and scenarios where you don’t have a key by which state can be partitioned." (Operator State)
- Expired values are removed on read by default, plus background cleanup. "By default, expired values are explicitly removed on read, such as ValueState#value, and periodically garbage collected in the background if supported by the configured state backend." (Cleanup of Expired State)
- Background cleanup differs per backend. "Currently, heap state backend relies on incremental cleanup and RocksDB backend uses compaction filter for background cleanup." (Cleanup of Expired State)

## Visuals worth redrawing

None.

## My notes

- State types: ValueState, ListState, ReducingState, AggregatingState, MapState.

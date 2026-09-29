---
id: flink-state-backends
title: State Backends (Flink)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/state_backends/
kind: docs
primary: true
---

## Summary

The Flink 2.3 page on where state lives: on the Java heap
(HashMapStateBackend, the default), in an embedded RocksDB on local disk,
or in ForSt, an experimental backend that keeps its files on remote
storage. Also incremental checkpoints and RocksDB memory tuning.

## Key claims

- Heap is the default. "If nothing else is configured, the system will use the HashMapStateBackend." (Available State Backends)
- Heap backend keeps Java objects. "The HashMapStateBackend holds data internally as objects on the Java heap." (The HashMapStateBackend)
- RocksDB keeps state on local disk. "The EmbeddedRocksDBStateBackend holds in-flight data in a RocksDB database that is (per default) stored in the TaskManager local data directories." (The EmbeddedRocksDBStateBackend)
- RocksDB stores serialized bytes. "data is stored as serialized byte arrays" (The EmbeddedRocksDBStateBackend)
- RocksDB state is limited by disk. "Note that the amount of state that you can keep is only limited by the amount of disk space available." (The EmbeddedRocksDBStateBackend)
- Per-key and per-value size limit. "the maximum supported size per key and per value is 2^31 bytes each." (The EmbeddedRocksDBStateBackend)
- RocksDB is about 10x slower on average. "each state access and update requires (de-)serialization and potentially reading from disk which leads to average performance that is an order of magnitude slower than the memory state backends." (Choose The Right State Backend)
- Heap state is limited by memory. "state size is limited by available memory within the cluster." (Choose The Right State Backend)
- ForSt keeps SST files on remote storage. "Most importantly, it can hold its sst files on remote file systems that Flink supports, such as HDFS, S3, etc." (The ForStStateBackend)
- ForSt is experimental. "The ForStStateBackend is still in the experimental stage and is not fully available for production." (The ForStStateBackend)
- Incremental checkpoints record only changes. "Instead of producing a full, self-contained backup of the state backend, incremental checkpoints only record the changes that happened since the latest completed checkpoint." (Incremental Checkpoints)
- Savepoint format unified in 1.13. "In Flink 1.13 we unified the binary format of Flink’s savepoints." (Choose The Right State Backend)
- A savepoint can be restored under a different backend. "That means you can take a savepoint and then restore from it using a different state backend." (Choose The Right State Backend)
- ForSt is the choice for state bigger than disk or for fast rescaling. "If you are handling very large state even exceeding the available disk space, or you prefer a fast rescale under cloud-native setup, you should consider using ForStStateBackend." (Choose The Right State Backend)
- ForSt uses local disk only as a cache. "The local disk of TaskManager is only used to store cache of file, to provide better performance." (The ForStStateBackend)
- Only RocksDB offers incremental checkpoints. "EmbeddedRocksDBStateBackend is currently the only backend that offers incremental checkpoints" (The EmbeddedRocksDBStateBackend)
- ForSt is built on RocksDB. "which is also a LSM-tree structured key-value store and built on top of the RocksDB." (The ForStStateBackend)

## Visuals worth redrawing

None.

## My notes

- The page recommends HashMapStateBackend for "jobs with large state", the same wording as for RocksDB, which contradicts its own "choose" section. Probably a docs copy-paste.
- It says RocksDB is the only backend with incremental checkpoints, then that ForSt always does incremental snapshots.

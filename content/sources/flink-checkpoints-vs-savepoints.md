---
id: flink-checkpoints-vs-savepoints
title: Checkpoints vs. Savepoints (Flink)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpoints_vs_savepoints/
kind: docs
primary: true
---

## Summary

Flink 2.3 docs on the two kinds of snapshot: checkpoints for automatic
recovery, savepoints for planned operations like upgrades, and a table of
what each kind supports.

## Key claims

- The analogy. "Conceptually, Flink’s savepoints are different from checkpoints in a way that’s analogous to how backups are different from recovery logs in traditional database systems." (Overview)
- Flink owns checkpoints. "a checkpoint is created, owned, and released by Flink - without user interaction." (Overview)
- Checkpoints aim to be cheap to take and fast to restore. "i) being as lightweight to create and ii) being as fast to restore from as possible." (Overview)
- The user owns savepoints. "Savepoints are created, owned and deleted solely by the user." (Overview)
- Savepoints are for planned operations. "The use case for savepoints is for planned, manual operations." (Overview)
- Rescaling is supported by every kind of snapshot in the table. "Rescaling - restoring the snapshot with a different parallelism than was used during the snapshot creation." (Capabilities and limitations) In the table, unaligned checkpoints don't support an arbitrary job upgrade or a Flink minor version upgrade; only canonical savepoints support changing the state backend.
- Checkpoints use the native format and may be incremental. "Checkpoints are stored in state backend-specific (native) data format (may be incremental depending on the specific backend)." (Overview)
- Savepoints use a portable format by default. "Savepoints are stored in a state backend independent (canonical) format" (Overview)
- Savepoint examples. "For example, this could be an update of your Flink version, changing your job graph, and so on." (Overview)
- Arbitrary job upgrade means partitioning or in-flight record types changed. "Arbitrary job upgrade - the snapshot can be restored even if the partitioning types(rescale, rebalance, map, etc.) or in-flight record types for the existing operators have changed." (Capabilities and limitations)

## Visuals worth redrawing

None.

## My notes

- Native-format savepoints since Flink 1.15.

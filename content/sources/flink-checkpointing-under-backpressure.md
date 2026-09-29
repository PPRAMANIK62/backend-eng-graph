---
id: flink-checkpointing-under-backpressure
title: Checkpointing under backpressure (Flink)
author: Apache Flink
url: https://nightlies.apache.org/flink/flink-docs-stable/docs/ops/state/checkpointing_under_backpressure/
kind: docs
primary: true
---

## Summary

Flink 2.3 docs on why checkpoints get slow under backpressure, and the two
fixes: less buffered in-flight data (buffer debloating) and unaligned
checkpoints, with their limits.

## Key claims

- Under backpressure, barrier travel time dominates. "when a Flink job is running under heavy backpressure, the dominant factor in the end-to-end time of a checkpoint can be the time to propagate checkpoint barriers to all operators/subtasks." (Checkpointing under backpressure)
- Buffer debloating since 1.14. "Flink 1.14 introduced a new tool to automatically control the amount of buffered in-flight data between Flink operators/subtasks." (Buffer debloating)
- Unaligned checkpoints since 1.11. "Starting with Flink 1.11, checkpoints can be unaligned." (Unaligned checkpoints)
- They store buffered data so barriers can overtake it. "Unaligned checkpoints contain in-flight data (i.e., data stored in buffers) as part of the checkpoint state, allowing checkpoint barriers to overtake these buffers." (Unaligned checkpoints)
- They cost more I/O. "Be aware unaligned checkpointing adds to I/O to the state storage, so you shouldn’t use it when the I/O to the state storage is actually the bottleneck during checkpointing." (Unaligned checkpoints)
- Aligned first, unaligned after a timeout. "each checkpoint will still begin as an aligned checkpoint, but when the global checkpoint duration exceeds the aligned-checkpoint-timeout, if the aligned checkpoint has not completed, then the checkpoint will proceed as an unaligned checkpoint." (Aligned checkpoint timeout)
- No concurrent unaligned checkpoints. "Flink currently does not support concurrent unaligned checkpoints." (Limitations)
- Watermark caveat. "Unaligned checkpoints break with an implicit guarantee in respect to watermarks during recovery." (Interplay with watermarks)
- A slow record still holds the barrier. "Flink can not interrupt processing of a single input record, and unaligned checkpoints have to wait for the currently processed record to be fully processed." (Interplay with long-running record processing)
- Watermarks are regenerated after in-flight data is restored. "In unaligned checkpoints, that means on recovery, Flink generates watermarks after it restores in-flight data." (Interplay with watermarks)

## Visuals worth redrawing

None.

## My notes

None.

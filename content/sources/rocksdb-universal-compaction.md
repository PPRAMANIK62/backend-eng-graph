---
id: rocksdb-universal-compaction
title: Universal Compaction (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/Universal-Compaction
kind: docs
primary: true
---

## Summary

RocksDB's tiered-family compaction style. Sorted runs are kept in time
order, and compaction merges adjacent runs of similar size when their
count passes a threshold. Explains why tiered writes less and reads
more, and the "double size" problem of a full compaction.

## Key claims

- Its goal. "Universal Compaction Style is a compaction style, targeting the use cases requiring lower write amplification, trading off read amplification and space amplification." (opening)
- The difference in one sentence. "The key difference between the two strategies is that leveled compaction tends to aggressively merge a smaller sorted run into a larger one, while \"tiered\" waits for several sorted runs with similar size and merge them together." (Conceptual Basis)
- Why tiered writes less: each merge moves data into a much larger run. "Every compaction is likely to make the update exponentially closer to the final sorted run, which is the largest." (Conceptual Basis)
- Why leveled writes more: data gets rewritten as part of the big run. "In leveled compaction, however, an update is compacted more as a part of the larger sorted run where a smaller sorted run is merged into, than as a part of the smaller sorted run." (Conceptual Basis)
- Tiered's costs: more sorted runs, spikier compaction. "The lazy nature of the compaction scheduling also makes the compaction traffic much more spiky, the number of sorted runs greatly varies over time, hence large variation of performance." (Conceptual Basis)
- When to try it. "Users may try this compaction style if leveled compaction is not able to handle the required write rate." (Conceptual Basis)
- A full compaction temporarily doubles disk use. "During compaction, both of input files and the output file need to be kept, so the DB will be temporarily double the disk space usage." (Double Size Issue)
- Compaction only starts once the number of sorted runs reaches a threshold. "Unless number of sorted runs reaches this threshold, no compaction will be triggered at all." (Compaction Picking Algorithm)
- Major vs minor compaction. "A _major compaction_ reads all sorted runs as input. A _minor compaction_ reads some, but not all, sorted runs as input." (Compaction Picking Algorithm)

## Visuals worth redrawing

None.

## My notes

- Undated wiki; read when this was written.

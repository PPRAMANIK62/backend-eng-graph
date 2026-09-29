---
id: callaghan-name-that-compaction-2018
title: Name that compaction algorithm
author: Mark Callaghan
url: https://smalldatum.blogspot.com/2018/08/name-that-compaction-algorithm.html
kind: blog
primary: false
---

## Summary

A short taxonomy of LSM compaction by Mark Callaghan: leveled, tiered, tiered+leveled, leveled-N and
time-series, what each minimizes, and the practical problems with
tiered. The RocksDB wiki's Compaction page copies this text as its
overview.

## Key claims

- Compaction defines the tree's shape. "Compaction algorithms constrain the LSM tree shape. They determine which sorted runs can be merged by it and which sorted runs need to be accessed for a read operation." (intro)
- History in one line: leveled first, then tiered in Bigtable, HBase and Cassandra, then LevelDB and RocksDB. "Then tiered compaction arrived in BigTable, HBase and Cassandra." (intro)
- Leveled trades. "Leveled compaction minimizes space amplification at the cost of read and write amplification." (Leveled)
- Leveled structure. "Each level is one sorted run that can be range partitioned into many files. Each level is many times larger than the previous level." (Leveled)
- Per-level write amp is the fanout at worst. "The per-level write amplification is equal to the fanout in the worst case, but it tends to be less than the fanout in practice" (Leveled)
- All-to-all vs some-to-some. "Compaction in the original LSM paper was all-to-all -- all data from Ln-1 is merged with all data from Ln. It is some-to-some for LevelDB and RocksDB -- some data from Ln-1 is merged with some (the overlapping) data in Ln." (Leveled)
- Where leveled holds up: key-order inserts and skewed writes. "The second one is skewed writes where only a small fraction of the keys are likely to be updated." (Leveled)
- Tiered trades. "Tiered compaction minimizes write amplification at the cost of read and space amplification." (Tiered)
- Tiered doesn't rewrite the next level's runs. "Compaction does not read/rewrite sorted runs in Ln when merging into Ln. The per-level write amplification is 1 which is much less than for leveled where it was fanout." (Tiered)
- Common tiered in practice: merge runs of similar size. "A common approach for tiered is to merge sorted runs of similar size, without having the notion of levels" (Tiered)
- Tiered's problems: big transient space, big indexes and filters, long compactions, all-to-all rewrites under skew. "Transient space amplification is large when compaction includes a sorted run from the max level." (Tiered)
- RocksDB's name for tiered. "Note that RocksDB used the name universal rather than tiered." (Tiered)
- Tiered+leveled sits between. "Tiered+Leveled has less write amplification than leveled and less space amplification than tiered." (Tiered+Leveled)
- RocksDB's leveled is really tiered+leveled, because L0 is tiered. "So the L0 is tiered." (Tiered+Leveled)
- Leveled-N. "Leveled-N compaction is like leveled compaction but with less write and more read amplification." (Leveled-N)
- Time-series strategies exist (Cassandra DTCS and TWCS). "Cassandra had DTCS and has TWCS." (Time Series)

## Visuals worth redrawing

None.

## My notes

- He writes as part of the RocksDB effort ("we didn't explain it that
  way until now"), but the taxonomy is his own framing, so marked not
  primary.

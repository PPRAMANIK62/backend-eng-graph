---
id: callaghan-read-only-lsm-benchmarks-2021
title: Read-only benchmarks with an LSM are complicated
author: Mark Callaghan
url: http://smalldatum.blogspot.com/2021/02/read-only-benchmarks-with-lsm-are.html
kind: blog
primary: true
---

## Summary

Shows that on a read-only, CPU-bound RocksDB benchmark, throughput moves
a lot with the "shape" of the LSM tree (what's in the memtable, how many
L0 runs, how many levels). Splits read amplification into an IO part and
a CPU part, and argues benchmark reports should describe the tree shape.

## Key claims

- Tree shape changed read-only QPS by up to 5x. "I have results from RocksDB for which QPS varies by up to 5X depending on the shape of the LSM tree." (intro)
- Read-amp should be split into IO and CPU, and CPU is usually the problem. "But read-amp should be described separately for IO vs CPU because (usually) CPU read-amp is the problem." (intro)
- Units: pages read from real storage for IO read-amp; cache lines, key comparisons and bloom checks as a proxy for CPU read-amp. "The unit for IO read-amp is pages read from storage (real storage, not a read from the OS page cache)." (intro)
- An LSM is really many trees: memtable, each L0 run, each level. "For the configurations I use it is common for there to be from 10 to 20 trees in one RocksDB instance." (intro)
- Bloom filters reduce but don't remove the cost. "While bloom filters help, they don't eliminate the overhead." (intro)
- What "LSM tree shape" means: KV pairs in the active memtable, immutable memtables waiting, sorted runs in L0, levels beyond L0 and their sizes. (list after intro)
- It's easy to make an LSM look better or worse by accident. "It is easy to make the LSM look better or worse -- on purpose or by accident." (intro)
- Worst case about 5x for range queries and point queries without bloom filters, about 2x with bloom. "The worst-case was ~5X for range and point without bloom vs ~2X for point with bloom." (Performance summary)
- Read-only tests freeze the tree in one shape for the whole run. "This is more of an issue for read-only benchmarks because the LSM tree shape is usually stuck in the same state for the duration of the test." (Performance summary)
- Setup: 16 GB RAM, 8 GB block cache, and the database fit in the block cache for all tests except the 200M-value one. "The database fit in the block cache for all tests except for 200M values." (My tests)

## Visuals worth redrawing

- The four tree shapes tested (pre_flush, post_flush, compact_l0,
  compact_l1) could be drawn as four stacks of memtable, L0 and levels.

## My notes

- Results use per-level fanout 8. Hardware details are in linked posts,
  not opened.

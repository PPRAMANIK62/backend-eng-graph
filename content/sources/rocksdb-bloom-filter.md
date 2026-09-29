---
id: rocksdb-bloom-filter
title: RocksDB Bloom Filter (RocksDB wiki)
author: RocksDB team (Meta)
url: https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter
kind: docs
primary: true
---

## Summary

How RocksDB uses Bloom filters in SST files: what they answer, the
bits-per-key setting and its diminishing returns, the Ribbon filter
alternative, the old per-block format vs full and partitioned filters,
cache-line-local probing and its small false-positive cost, prefix
filters, and the statistics that show how well a filter works.

## Key claims

- What a Bloom filter answers. "Given an arbitrary key, this bit array may be used to determine if the key *may exist* or *definitely does not exist* in the key set." (What is a Bloom Filter?)
- One filter per SST file. "In RocksDB, when the filter policy is set, every newly created SST file will contain a Bloom filter, which is used to determine if the file may contain the key we're looking for." (What is a Bloom Filter?)
- How it works: several hash functions set bits; any 0 on lookup means absent. "the key definitely does not exist if at least one of the probes return 0." (What is a Bloom Filter?)
- About 10 bits per key works for many workloads. "This generates filters using about 10 bits of space per key, which works well for many workloads" (Configuration basics)
- Diminishing returns table: 1.5 bits/key gives 50% FP, 2.9 gives 25%, 4.9 gives 10%, 9.9 gives 1%, 15.5 gives 0.1%. "9.9 bits per key (1% false positive rate) is 99% as effective as 100 bits per key" (Configuration basics)
- Advice on the memory question. "If the question is whether to enable Bloom filters or not and memory pressure is a concern, it's better to compare NewBloomFilterPolicy(3) to no filter policy, than to compare NewBloomFilterPolicy(10) to no filter policy." (Configuration basics)
- Ribbon filter, since 6.15.0: about 30% less space, 3-4x the CPU. "saving about 30% of Bloom filter space (most importantly, memory) but using about 3-4x as much CPU on filters." (Ribbon filter)
- Filters can use about 10% of RAM. "it is common for SST filters to use ~10% of system RAM and well under 1% of CPU." (Ribbon filter)
- Filters can't be merged; compaction builds a new one. "Even when we combine two SST files, a new Bloom filter is created from scratch with the keys of the new file" (Life Cycle)
- Full filters keep one key's probes in one CPU cache line. "Full filter limits the probe bits for a key to be all within the same CPU cache line." (Full Filters)
- The old full filter couldn't beat about 0.1% FP; the new one (format_version=5, 6.6) does with 16 bits/key and uses a 64-bit hash. "The new implementation is below 0.1% FP rate with only 16 bits/key." (Full Filters)
- Whole-key filters help point lookups only; prefix filters also help seeks. "whereas the whole key blooms are only used for point lookups." (Prefix vs. whole key)
- Cache-local probing costs a little accuracy: in the standard setup (10 bits/key, 6 probes) 0.95% FP vs 0.84% without locality. "The same Bloom filter without cache locality has false positive rate 0.84%." (The math)
- Ribbon is a drop-in replacement at the same FP rate. "`rocksdb::NewRibbonFilterPolicy(9.9)` has the same 1% FP rate as Bloom but only uses around 7 bits per key." (Ribbon filter)
- The old full filter degraded with millions of keys because of a 32-bit hash. "the original full filter would have degraded FP rates with millions of keys in a single filter, because of inherent limitations of 32-bit hashing." (Full Filters)
- Statistics report how useful the filter is in production. "Here are the statistics that can be used to gain insight of how well your full bloom filter settings are performing in production" (Statistic)

## Visuals worth redrawing

- FP rate vs bits per key chart (linked image). Could redraw as a
  table from the bullet list instead.

## My notes

- Undated wiki; version facts pinned to 6.6 and 6.15 as stated.

---
id: bloom-filter
title: Bloom filters
depth: short
phase: 7
note: >-
  A small structure that says "definitely not here" or "maybe here".
needs: []
leads_to: [sstable, count-min-sketch]
compare_with: [count-min-sketch]
---

# Bloom filters

A Bloom filter is a small bit array that answers one question about a
set of keys: "is this key in the set?" The answer is either "definitely
not" or "maybe". It never says "no" for a key that's there, and it
sometimes says "maybe" for one that isn't. Storage engines put one next
to each file on disk, so a lookup can skip every file that definitely
doesn't hold the key without reading it.

## How it works

Start with m bits, all 0, and pick k hash functions. The figure uses 16
bits and 3 hashes.

- **Insert a key:** hash it k times, each hash picks one bit, and set
  those bits to 1.
- **Look up a key:** hash it the same k ways and check those bits. If
  any bit is 0, the key was never inserted: every inserted key set all
  of its bits. If all of them are 1, the key may be there, or other
  keys may have set those bits between them.

![A 16-bit array with 3 hash functions. Inserting apple sets bits 1, 6 and 11; inserting melon sets bits 3, 6 and 14. Looking up grape checks bits 3, 9 and 14; bit 9 is 0, so grape is definitely not in the set. Looking up peach checks bits 1, 3 and 11, which are all 1 because of apple and melon, so the filter says maybe: a false positive.](img/bloom-filter-bits.svg)

*Two inserts and two lookups. A single 0 proves absence; all 1s prove nothing.*

A wrong "maybe" is a *false positive*. In a storage engine it costs a
wasted read, never a wrong answer, because the engine then checks the
real data.

## Sizing it: bits per key

The false positive rate depends on how many bits you spend per key.
With n keys in m bits and k hashes, it's about (1 − e^(−kn/m))^k, and
the best number of hashes is k = (m/n) × ln 2. LevelDB computes k
exactly that way, as bits per key × 0.69, rounded down to save a little
probing.

The usual setting is 10 bits per key, which gives about a 1% false
positive rate. Returns fall off fast after that. For RocksDB's filters:

| Bits per key | False positive rate |
|---|---|
| 1.5 | 50% |
| 2.9 | 25% |
| 4.9 | 10% |
| 9.9 | 1% |
| 15.5 | 0.1% |

Each extra ~5 bits per key cuts false positives by about 10x, but the
first few bits do most of the work: 4.9 bits already avoids 90% of the
wasted reads that 100 bits would avoid. So if memory is tight, a small
filter beats no filter.

That memory is real. In RocksDB it's common for SST file filters to
take about 10% of the machine's RAM, because most of them stay loaded.

## Bloom filters in an LSM tree

An [[lsm-tree]] keeps data in many sorted files. A point lookup for a
key that exists in the oldest file, or doesn't exist at all, would have
to check every newer file first. With a filter per file, it checks the
filter in memory and reads only the files that say "maybe". With 10
bits per key, about 1 in 100 files it didn't need gets read.

A few details from real engines:

- **One filter per file, built once.** The filter goes into the
  [[sstable]] when it's written. Filters of two files can't be merged,
  so when [[compaction]] merges files, it builds a new filter from the
  keys of the new file.
- **One hash, many probes.** LevelDB hashes each key once and derives
  all k bit positions from it (double hashing), instead of running k
  different hash functions.
- **One cache line per lookup.** RocksDB's current filters put all of a
  key's probe bits in the same CPU cache line, so a check costs one
  memory miss instead of k. The false positive rate goes up a little: in
  their standard setup, 0.95% instead of 0.84%.
- **Point lookups only.** A whole-key filter says nothing about a range
  of keys. RocksDB can add key prefixes to the filter so that a scan
  within one prefix can skip files too.

## Where it gets tricky

**You can't delete from a plain Bloom filter.** Clearing a key's bits
could clear bits another key also set, and then that key would get a
"definitely not": a false negative, the one mistake the structure
promises never to make. In an LSM tree this never comes up, because
files are immutable and each filter is rebuilt when files are merged.

**Newer filters use less space.** RocksDB 6.15 added the Ribbon filter,
a drop-in alternative that gives the same false positive rate in about
30% less space, for about 3 to 4 times the CPU to build and query. Since
filters often use far more RAM than CPU, that's usually a good trade.
RocksDB 6.6 also replaced its older filter, which couldn't get below
about 0.1% false positives at any size and degraded with millions of
keys because of its 32-bit hash.

**Counting is a different tool.** To estimate how often keys appear,
rather than whether they're present, see [[count-min-sketch]].

## What this means when you build

- Put a filter in each immutable data file and keep it in memory. Start
  at 10 bits per key.
- Choose k from bits per key (× 0.69), and derive the k positions from
  one or two hashes.
- Store k in the filter itself, so you can change the setting later
  and still read old files. LevelDB does this.
- Measure your filter's false positive rate in production if the engine
  exposes it; RocksDB has counters for exactly this.

## Further reading

- [RocksDB Bloom Filter (RocksDB wiki)](https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter), RocksDB team. Bits per key and their returns, full vs partitioned filters, cache-local probing, Ribbon filters.
- [LSM-based Storage Techniques: A Survey](https://arxiv.org/abs/1812.07527), Chen Luo and Michael J. Carey, 2019. Section 2.2.2: how Bloom filters fit an LSM tree, with the false positive formula.
- [leveldb util/bloom.cc](https://github.com/google/leveldb/blob/main/util/bloom.cc), LevelDB authors. A complete Bloom filter in about 90 lines, with double hashing.

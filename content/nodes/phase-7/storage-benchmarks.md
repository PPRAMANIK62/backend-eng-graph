---
id: storage-benchmarks
title: Storage benchmarks
depth: short
phase: 7
note: >-
  YCSB workloads, and what a storage benchmark has to control: data
  bigger than the cache, the engine in a steady state (compaction
  running, not a fresh sorted load), same durability settings.
needs: [amplification, latency-percentiles]
leads_to: []
compare_with: [benchmarking-pitfalls]
---

# Storage benchmarks

A storage benchmark runs the same workload against two engines and
compares throughput, latency and [[amplification]]. Getting a number is
easy. Getting one that means something is harder, because an engine's
speed depends on its state: what's cached, how far behind compaction
is, whether it waits for the disk before saying "done". Change those
and you can change the winner.

## YCSB: a shared set of workloads

The Yahoo! Cloud Serving Benchmark (YCSB, 2010) gave key-value stores a
common set of workloads. Each one picks an operation mix and a way to
choose which record to touch:

| Workload | Mix | Which records | Example |
|---|---|---|---|
| A, update heavy | 50% read, 50% update | zipfian | session store |
| B, read mostly | 95% read, 5% update | zipfian | photo tags |
| C, read only | 100% read | zipfian | user profile cache |
| D, read latest | 95% read, 5% insert | latest | status updates |
| E, short ranges | 95% scan, 5% insert | zipfian start, uniform length | threaded conversations |
| F, read-modify-write | 50% read, 50% read-modify-write | zipfian | user records |

*Zipfian* means a few records are very popular and most are rarely
touched. *Latest* is the same, except the newest records are the popular
ones, so popularity moves as you insert. Updates in A and B are blind
writes: they don't read the record first. F forces a read before every
write.

YCSB's main method is a curve, not a single number. You set a target
throughput, run, and record latency. Then you raise the target and run
again, until the throughput you actually get stops going up. The client
reports the average, the 95th and the 99th percentile, which is why a
storage comparison should show [[latency-percentiles]] at each load
level, not just the peak.

## What the benchmark has to control

**Data bigger than the cache.** If the whole database fits in RAM, you're
measuring the CPU path, not the storage engine's use of disk. In the
original YCSB runs each server held about 20 GB of data with 8 GB of
RAM, on purpose. Watch out between runs too: if a second run reuses the
same keys, the data it reads may still be in the OS [[page-cache]] from
the first.

**A settled engine.** A freshly loaded engine isn't in the state it will
be in after weeks of real traffic. For an [[lsm-tree|LSM tree]] this
matters a lot:

- Loading keys in sorted order lets an LSM tree skip most
  [[compaction]], so write amplification is 1 or 2 instead of tens.
  Reads right after such a load also look better than they will later.
- A read test right after loading runs with an empty memtable, which
  makes reads faster than they will be in production.
- A short burst of random writes after a sequential load doesn't get
  compaction going the way sustained writes do. One practice: load N
  keys, then overwrite N random keys, and only then start measuring.
- Record throughput and latency per interval, not just the average at
  the end, so you can see whether the engine slowed down as compaction
  fell behind.

Writes can also fragment an engine's files. YCSB suggests reloading if
earlier workloads' writes might change later results, and orders the
runs so that D and E, which insert records, come last, with a reload
before E.

**The same durability.** An engine that acknowledges a write before
calling [[fsync]] will look faster than one that waits. In the original
YCSB runs, three systems synced every update to disk before replying and
HBase didn't, and the paper said so. Give every engine the same rule,
and the same disks: YCSB put every system on one RAID-10 array with no
separate log disk, so none got an advantage from its layout.

**The same effort.** The YCSB authors got tuning help from each
system's developers. Small settings matter: skipping [[checksums|checksum]] checks on
reads removes a CPU cost production pays, and readahead set too high can
wreck an IO-bound test.

![A timeline of one benchmark. Load the data in key order. Overwrite every key once in random order to bring the engine to a steady state, with compaction running. Then run workloads A, B, C, F and D, each at several target throughputs, recording throughput, p95 and p99 latency, and disk reads, writes and database size. Then delete, reload, age again, and run E. Workloads are outlined in blue; the rest is setup.](img/storage-benchmarks-sequence.svg)

*One way to sequence a comparison. Adapted from the YCSB wiki, "Core Workloads", and Mark Callaghan, "Benchmarking the leveldb family" (2014).*

## Where it gets tricky

**Steady doesn't mean idle.** "Let compaction settle" is easy to misread
as "wait until compaction has finished". For a write-heavy test, the
steady state is the opposite: compaction running all the time, as it
would under sustained writes. What you want to avoid is a state no
production system is in, like a tree fresh from a sorted load.

**More engines, less trust.** Every extra system in a comparison needs
someone who knows how to configure it well, and it's hard to find one
person who knows them all. A bad result for one engine is often a bad
configuration.

**Averages hide slow compaction.** An LSM tree that can't keep up with
writes will eventually stall incoming writes. A short run finishes
before that happens.

General benchmarking traps, like warmup, noise and CPU frequency
scaling, are in [[benchmarking-pitfalls]].

## What this means when you build

- Use YCSB A to F, and report latency percentiles at several load
  levels.
- Make the dataset several times bigger than RAM, or say clearly that
  it's a cached test.
- Age the engine into a steady state before measuring, and describe
  that state.
- Match durability settings exactly, and write them down.
- Report write, read and space amplification next to throughput.

## Further reading

- [Benchmarking Cloud Serving Systems with YCSB](https://courses.cs.duke.edu/fall13/cps296.4/838-CloudPapers/ycsb.pdf), Brian F. Cooper and others, SoCC 2010. The paper behind YCSB: workloads, distributions, the latency-versus-throughput method, and a carefully described setup.
- [Core Workloads](https://github.com/brianfrankcooper/YCSB/wiki/Core-Workloads), YCSB wiki. The six workloads A to F, and the order to load and run them.
- [Benchmarking the leveldb family](http://smalldatum.blogspot.com/2014/07/benchmarking-leveldb-family.html), Mark Callaghan, 2014. How LSM benchmarks go wrong: cached data, sequential loads, empty memtables and no steady state.

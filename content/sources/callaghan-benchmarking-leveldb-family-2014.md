---
id: callaghan-benchmarking-leveldb-family-2014
title: Benchmarking the leveldb family
author: Mark Callaghan
url: http://smalldatum.blogspot.com/2014/07/benchmarking-leveldb-family.html
kind: blog
primary: true
---

## Summary

A list of ways benchmarks of LevelDB-style engines (LevelDB, RocksDB)
go wrong, from someone who worked on RocksDB. Covers write amplification
in a steady state, compaction falling behind, and sixteen traps in the
db_bench client and in how tests are sequenced: cached data between runs,
sequential loads that skip compaction, empty memtables, databases that
never reach a steady state.

## Key claims

- The problems appear only in a steady state on a large database. "These problems described below become visible when you run a random-write workload on a large database and get the LSM into a steady state." (Editorial #2)
- Write-amp can reach about 50 for a large database with leveled compaction and uniform keys. "The above means you might end up with a write-amplification of 50 for a large database." (Editorial #2, 1)
- Peak ingest is storage write rate divided by write-amp. "If storage can sustain 200MB/second of writes and write-amplification is 50 then the peak ingest rate is 4 MB/second" (Editorial #2, 3)
- Compaction falls behind and Puts stall. "The result of the above is that L0 -> L1 compaction will fall behind and likely trigger many stalls on Put operations." (Editorial #2, 4)
- Report throughput and latency per interval to see whether they degrade during the run. "For some tests I want to confirm that response time and throughput were stable and did not degrade continuously or intermittently over the duration of the test." (db_bench notes, 1)
- IO-bound means the database is much larger than RAM. "By IO-bound I mean the database is much larger than RAM." (db_bench notes, 2)
- Rerunning with the same seed can find the data still in the OS cache. "during the second run all of the read data might still be in the OS filesystem cache." (db_bench notes, 2)
- Short write tests rewriting the same keys stay in upper levels and understate write-amp. "the same keys are written for each run and more likely to fit in the upper levels of the LSM leading to less write-amplification and better performance than might occur in production." (db_bench notes, 2)
- Leaving out checksum verification drops a CPU cost production pays. "This excludes a CPU overhead that is likely to be enabled on production deployments." (db_bench notes, 4)
- Readahead set too high can ruin an IO-bound test. "A too large value for readahead (read_ahead_kb) can ruin your results on an IO-bound test." (db_bench notes, 9)
- Sequential inserts skip compaction, so write-amp is one or two. "Thus write-amplification is one (or two if the redo log is enabled)." (db_bench notes, 11)
- 1M random writes into an empty database don't give 1M distinct keys, so later reads hit missing keys. "A random write test that puts 1M keys into an empty database is unlikely to result in a database with 1M distinct keys." (db_bench notes, 12)
- A short random write test after a sequential load isn't a steady state; the author loads X million rows, then does X million random writes first. "For write-heavy tests I usually do a sequential load of X million rows, then do X million random writes, then consider the database to be ready for real tests." (db_bench notes, 13)
- Steady state means compaction is running, as under sustained writes, not finished. "By steady state I mean that compaction should be in progress as it would be for a sustained write-heavy workload." (db_bench notes, 13)
- It's hard to find one person with expertise in every system compared, so misconfiguration goes unnoticed. "It is hard to find someone with expertise in multiple systems to vouch that the result for a specific product wasn't lousy because of misconfiguration or misuse." (Editorial #1)
- Read QPS right after a load is inflated by an empty memtable. "Read QPS is also inflated in db_bench when the memtable is empty as no time must be spent checking an empty memtable." (db_bench notes, 15)
- RocksDB's universal compaction is what Cassandra calls size-tiered. "When RocksDB universal compaction is used (called size-tiered by Cassandra)" (db_bench notes, 16)
- Faith in a result drops as more products are compared. "my faith in a particular benchmark result is inversely related to the number of products evaluated in the test." (Editorial #1)
- Reads after a sequential load look better too: files don't overlap, so a point query checks at most one file. "Thus is is likely that at most one file will be checked on a point query after a sequential load." (db_bench notes, 11)

## Visuals worth redrawing

None.

## My notes

- Written about LevelDB and RocksDB as of 2014; several db_bench issues
  are marked as fixed in RocksDB. The sequencing traps (points 11 to 15)
  are about LSM behavior and still apply.

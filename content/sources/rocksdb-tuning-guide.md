---
id: rocksdb-tuning-guide
title: RocksDB Tuning Guide
author: RocksDB team (Meta) and wiki contributors
url: https://github.com/facebook/rocksdb/wiki/RocksDB-Tuning-Guide
kind: docs
primary: true
---

## Summary

The RocksDB wiki's tuning guide. Its "Amplification factors" section
gives working definitions of write, read and space amplification and how
to observe them; the leveled compaction section works through a 500 GB
example; later sections say which options move which factor.

## Key claims

- Compaction is the main lever between the three. "Either way, compaction is key to change the trade-off among the three." (Amplification factors)
- Write amplification definition. "Write amplification is the ratio of bytes written to storage versus bytes written to the database." (Amplification factors)
- Worked example: 10 MB/s into the database, 30 MB/s to disk. "For example, if you are writing 10 MB/s to the database and you observe 30 MB/s disk write rate, your write amplification is 3." (Amplification factors)
- High write-amp caps the ingest rate. "For example, if write amplification is 50 and max disk throughput is 500 MB/s, your database can sustain a 10 MB/s write rate." (Amplification factors)
- High write-amp wears flash. "High write amplification also decreases flash lifetime." (Amplification factors)
- How to observe it: rocksdb.stats, or disk write bandwidth over database write rate. "The second is to divide your disk write bandwidth (you can use iostat) by your DB write rate." (Amplification factors)
- Read amplification definition. "Read amplification is the number of disk reads per query." (Amplification factors)
- Physical reads seen in iostat also include compaction reads. "You might be able to estimate the physical read rate from iostat output but that include reads done for queries and for compaction." (Amplification factors)
- Space amplification definition. "Space amplification is the ratio of the size of database files on disk to data size." (Amplification factors)
- If compaction can't keep up, space keeps growing. "If compaction can't keep up with the write rate, the space used by the database will continue to grow." (Level Style Compaction)
- Worked example, 500 GB database, L1 512 MB, multiplier 10: size amplification 1.14. "It is (512 MB + 512 MB + 5GB + 51GB + 512GB) / (500GB) = 1.14." (Level Style Compaction)
- Same example, write amplification about 33. "Total write amplification is therefore approximately 1 + 2 + 10 + 10 + 10 = 33." (Level Style Compaction)
- Range scan read-amp with leveled compaction. "Bloom filters are not useful for range scans, so the read amplification is number_of_level0_files + number_of_non_empty_levels." (Level Style Compaction)
- Universal (tiered) compaction lowers write-amp at the cost of the others. "However, it may increase read amplification and always increases space amplification." (Universal Compaction)
- It can temporarily double space. "With universal compaction, a compaction process may temporarily increase size amplification by a factor of two." (Universal Compaction)
- Bloom filter default 10 bits per key, about 1% false positives; more bits cost space. "Default bits_per_key is 10, which yields ~1% false positive rate." (Other options)
- Larger blocks: smaller index, more read-amp. "Increasing block_size decreases memory usage and space amplification, but increases read amplification." (Other options)
- Even the developers recommend measuring. "If you want to fully optimize RocksDB for your workload, we recommend experiments and benchmarking, while keeping an eye on the three amplification factors." (end)

## Visuals worth redrawing

None.

## My notes

- Wiki page, last edited in 2023 when this was read (118 revisions). The
  1 + 2 + 10 + 10 + 10 sum counts L0 to L1 as 2, where Callaghan's
  2015 sum counts it as about 1 and uses 7 per level instead of 10.

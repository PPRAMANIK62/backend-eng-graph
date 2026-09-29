---
id: cockroachdb-hash-sharded-indexes
title: Hash-sharded indexes (CockroachDB docs)
author: Cockroach Labs
url: https://www.cockroachlabs.com/docs/stable/hash-sharded-indexes
kind: docs
primary: true
---

## Summary

CockroachDB v26.3 docs on hash-sharded indexes: a hidden shard column
that spreads sequential keys over a fixed number of buckets, so writes
don't all land at the end of one range.

## Key claims

- The purpose: spread sequential writes. "Hash-sharded indexes distribute sequential traffic uniformly across ranges, eliminating single-range hotspots and improving write performance on sequentially-keyed indexes at a small cost to read performance." (intro)
- It's partitioning, not a hash index. "Hash-sharded indexes are an implementation of hash partitioning, not hash indexing." (intro)
- With a sequential key, every write hits the end of one range and load-based splitting can't find a split point. "then all incoming writes to the range will be the last (or first) item in the index and appended to the end of the range." (How hash-sharded indexes work)
- The cost is on range reads. "The trade-off to this, however, is a small performance impact on reading sequential data or ranges of data, as it’s not guaranteed that sequentially close values will be on the same node." (Overview)
- More buckets than nodes doesn't help much. "Changing the cluster setting or storage parameter to a number greater than the number of nodes within that cluster will produce diminishing returns and is not recommended." (Shard count)
- More buckets make scans visit every bucket. "More buckets disadvantages operations that need to scan over the data to fulfill their query; such queries will now need to scan over each bucket and combine the results." (Shard count)
- You can hash only a prefix of the key (`shard_columns`) and keep the rest ordered. "This is useful when queries filter on the leading index columns but still need to scan or sort by later index columns within each shard." (Shard columns)
- So load-based splitting has nothing to split. "the system cannot find a point in the range that evenly divides the traffic, and the range cannot benefit from load-based splitting" (How hash-sharded indexes work)
- The shard column decides placement instead of the sequential column. "CockroachDB uses this shard column, as opposed to the sequential column in the index, to control the distribution of values across the index." (Overview)
- The shard column is a hash of the key columns. "By default, CockroachDB hashes all key columns in a hash-sharded index when it computes the shard column." (Shard columns)
- More buckets, more write throughput. "A larger number of buckets allows for greater load-balancing and thus greater write throughput." (Shard count)
- The shard column is hidden. "The shard column is hidden by default but can be seen with" (Overview)

## Visuals worth redrawing

None.

## My notes

- The related Load-based splitting page: ranges over
  `kv.range_split.load_qps_threshold` (default 2500 QPS) become split
  candidates; "no split key found" logs name a popular key or a clear
  direction. Not cited.

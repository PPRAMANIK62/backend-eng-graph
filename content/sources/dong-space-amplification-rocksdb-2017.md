---
id: dong-space-amplification-rocksdb-2017
title: Optimizing Space Amplification in RocksDB
author: Siying Dong, Mark Callaghan, Leonidas Galanis, Dhruba Borthakur, Tony Savor, Michael Stumm
url: https://www.cidrdb.org/cidr2017/papers/p82-dong-cidr17.pdf
kind: paper
primary: true
---

## Summary

CIDR 2017 paper from the RocksDB team at Facebook. Explains why storage
space, not throughput, was their bottleneck, how leveled compaction keeps
space amplification low, and the knobs (level size multiplier, dynamic
level sizes, per-level compression, block size) that trade space against
read and write amplification. Reports MyRocks against InnoDB.

## Key claims

- Their priority was efficiency, space first. "we optimize space efficiency while ensuring read and write latencies meet service-level requirements for the intended workloads." (Abstract)
- On their flash servers space was the bottleneck, not IO. "storage space is most often the primary bottleneck when using Flash SSDs under typical production workloads at Facebook." (Abstract)
- They cite the RUM work: you can't reduce all three at once. "it is not possible to simultaneously reduce space, read, and write amplification [13]." (§1)
- B-tree pages in their production databases were half to two-thirds full. "B-tree space utilization will be poor [24] with its pages only 1/2 to 2/3 full (as measured in Facebook production databases)." (§3)
- So B-tree space-amp is worse than 1.5. "This fragmentation causes space amplification to be worse than 1.5 in B-tree-based storage engines." (§3)
- LSM space-amp comes from stale data waiting for compaction. "LSM-tree space amplification is mostly determined by how much stale data is yet to be garbage-collected." (§3)
- With each level 10x the previous and the last level full, worst case is about 1.111. "then in the worst case, LSM-tree space amplification will be 1.111..." (§3)
- With fixed level targets, the last level can end up only a bit bigger than the one above, and space-amp goes above 2. "in which case space amplification would be larger than 2." (§3.1)
- Twice the data per SSD would need far fewer nodes, since the SSDs had IO to spare. "If the SSD could store twice as much data, then we would expect storage node efficiency to double" (§1)
- The size multiplier trades write-amp against read-amp and space-amp. "The larger the size multiplier is, the lower the space amplification and the read amplification, but the higher the write amplification." (§3.1)
- Most of their installations used 10, some 8. "For most of the Facebook production RocksDB installations, a size multiplier of 10 is used, although there are a few instances that use 8." (§3.1)
- Larger blocks compress better but cost read-amp. "a larger block size leads to improved compression without degrading write amplification, but negatively affects read amplification" (§4)
- In B-trees larger blocks hurt both. "(In B-Trees, larger blocks degrade both write and read amplification.)" (§4)
- Close to 90% of data sits in the last level, so strong compression goes there. "most (close to 90%) of the data is located at that level, yet only a small fraction of reads and writes go to it." (§4)
- Production review: RocksDB space about half of compressed InnoDB. "the storage space used by RocksDB is about 50% lower than the space used by InnoDB with compression" (§5)
- Production review: RocksDB writes 10 to 15% of what InnoDB writes. "the amount of data written to storage by RocksDB is between 10% and 15% of what InnoDB writes out" (§5)
- Why space was the bottleneck: data sharded over many nodes to fit, so each node got few queries. "it has to be sharded across many nodes to fit, and the more nodes, the fewer queries per node." (§1)
- The switch from InnoDB to MyRocks was mainly about space. "The switchover is primarily motivated by the fact that MyRocks uses half the storage InnoDB needs" (§1)
- Dynamic level sizing: set each level to 1/10 of the next, and space-amp stays under 1.111. "if we dynamically adjust the size of each level to be 1/10-th the size of the data on the next level, then space amplification will be reduced to less than 1.111...." (§3.1, Dynamic level size adaptation)

## Visuals worth redrawing

- Figure 1: levels L0 to L3 with target sizes growing 10x, SST files
  inside each level.
- Figure 2: one level-i SST merged with the overlapping level-(i+1) SSTs.

## My notes

- The 10% to 15% and 50% numbers are from Facebook's MySQL fleet, not a
  controlled benchmark.

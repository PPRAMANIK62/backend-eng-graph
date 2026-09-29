---
id: elhemali-dynamodb-2022
title: "Amazon DynamoDB: A Scalable, Predictably Performant, and Fully Managed NoSQL Database Service"
author: Mostafa Elhemali, Niall Gallagher, Nicholas Gordon, Joseph Idziorek, Richard Krog, Colin Lazier, Erben Mo, Akhilesh Mritunjai, Somu Perianayagam, Tim Rath, Swami Sivasubramanian, James Christopher Sorenson III, Sroaj Sosothikul, Doug Terry, Akshat Vig (AWS)
url: https://www.usenix.org/system/files/atc22-elhemali.pdf
kind: paper
primary: true
---

## Summary

USENIX ATC 2022 paper from the DynamoDB team (the AWS service, a
different system from the 2007 Dynamo paper). For partitioning, the
useful part is section 4: tables split into partitions by hashed key,
throughput allocated per partition, and what went wrong with skewed
traffic (hot partitions, throughput dilution) and how they fixed it
(bursting, adaptive capacity, global admission control, splitting for
consumption).

## Key claims

- The partition key is hashed; the hash plus the sort key decide where an item lives. "The output from the hash function and the sort key value (if present) determines where the item will be stored." (3 Architecture)
- Each partition holds one contiguous slice of the table's key range. "Each partition of the table hosts a disjoint and contiguous part of the table’s key-range." (3 Architecture)
- Each partition is replicated across availability zones, and the replicas run Multi-Paxos. "The replication group uses Multi-Paxos [14] for leader election and consensus." (3 Architecture)
- Partitions split and move as tables grow. "partitions could be further split and migrated to allow the table to scale elastically." (4)
- Splitting for size divided a partition's throughput between the children. "When a partition was split for size, the allocated throughput of the parent partition was equally divided among the child partitions." (4)
- The worked example: a partition holds at most 1000 WCUs; a 3200 WCU table gets four partitions of 800; raising it to 6000 WCUs gives eight partitions of 750 each. (4)
- Real traffic isn't uniform. "we discovered that application workloads frequently have non-uniform access patterns both over time and over key ranges." (4)
- The two problems were hot partitions and throughput dilution. "Two most commonly faced challenges by the applications were: hot partitions and throughput dilution." (4)
- Hot items can stay put or wander. "The hot items could belong to a stable set of partitions or could hop around to different partitions over time." (4)
- Throttling showed up even when the table as a whole had capacity to spare; customers over-provisioned to cope. "Customers who experienced throttling would work around it by increasing a table’s provisioned throughput and not use all the capacity." (4)
- Bursting kept up to 300 seconds of a partition's unused capacity. "DynamoDB retained a portion of a partition’s unused capacity for later bursts of throughput usage for up to 300 seconds" (4.1.1)
- Adaptive capacity boosted hot partitions and removed most skew throttling, but only after throttling had happened. "Adaptive capacity was reactive and kicked in only after throttling had been observed." (4.2)
- Adaptive capacity's effect. "eliminated over 99.99% of the throttling due to skewed access pattern." (4.1.2)
- Global admission control replaced it: request routers take tokens from a central service. "To solve the problem of admission control, DynamoDB replaced adaptive capacity with global admission control (GAC)." (4.2)
- Splitting for consumption picks the split point from the keys actually used. "The split point in the key range is chosen based on key distribution the partition has observed." (4.4)
- Splits take minutes. "Partition splits usually complete in the order of minutes." (4.4)
- Splitting can't help a single hot item or sequential access. "For example, a partition receiving high traffic to a single item or a partition where the key range is accessed sequentially will not benefit from split." (4.4)
- Many items can share a partition key value, told apart by the sort key. "Multiple items can have the same partition key value in a table with a composite primary key." (3 Architecture)
- Replicas of a partition sit in different availability zones. "Each partition has multiple replicas distributed across different Availability Zones for high availability and durability." (3 Architecture)
- Each storage node holds replicas of many partitions. "Each of the storage nodes hosts many replicas of different partitions." (3 Architecture)
- Request routers look up where a key lives in a metadata service. "The request routers look up the routing information from the metadata service." (3 Architecture)
- After a split for size, the hot half could end up with less throughput than before. "splitting a partition and dividing performance allocation proportionately can result in the hot portion of the partition having less available performance than it did before the split." (4)
- Throttling happened while the table as a whole had capacity. "even though the total provisioned throughput of the table was sufficient to meet its needs." (4)
- It spots those patterns and doesn't split. "DynamoDB detects such access patterns and avoids splitting the partition." (4.4)
- GAC tracks the table's total consumption centrally. "The GAC service centrally tracks the total consumption of the table capacity in terms of tokens." (4.2)
- The aim was to let partitions always burst. "remove admission control from the partition and let the partition burst always while providing workload isolation." (4.2)
- Throughput dilution is the split-for-size problem. "Throughput dilution was common for tables where partitions were split for size." (4)
- Splitting for consumption triggers on a throughput threshold. "Once the consumed throughput of a partition crosses a certain threshold, the partition is split for consumption." (4.4)

## Visuals worth redrawing

None used.

## My notes

- "Contiguous part of the key-range" plus "hashed partition key" means
  the range being split is a range of hash values, with each partition
  key's items kept together in sort-key order.

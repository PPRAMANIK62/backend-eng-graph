---
id: mongodb-sharding
title: Sharding (MongoDB manual)
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/sharding/
kind: docs
primary: true
---

## Summary

The overview page of MongoDB's sharding docs (manual 8.3, current when
this was written). Why you shard, the parts of a sharded cluster
(shards, mongos routers, config servers), shard keys, chunks, the
balancer, and targeted vs broadcast queries.

## Key claims

- Sharding spreads data over machines. "Sharding is a method for distributing data across multiple machines." (intro)
- One server runs out of CPU on query rate. "For example, high query rates can exhaust the CPU capacity of the server." (intro)
- And out of memory for the working set. "Working set sizes larger than the system's RAM stress the I/O capacity of disk drives." (intro)
- Vertical scaling has a ceiling. "Available technology and cloud provider hardware configurations impose a practical maximum for vertical scaling." (Vertical Scaling)
- Horizontal scaling costs complexity. "The trade-off is increased complexity in infrastructure and maintenance." (Horizontal Scaling)
- Each shard is a replica set. "Each shard must be deployed as a replica set." (Sharded Cluster)
- The router. "The mongos acts as a query router, providing an interface between client applications and the sharded cluster." (Sharded Cluster)
- Config servers hold the metadata. "Config servers store metadata and configuration settings for the cluster." (Sharded Cluster)
- The shard key decides placement. "MongoDB uses the shard key to distribute the collection's documents across shards." (Shard Keys)
- The shard key can be changed since 5.0. "Starting in MongoDB 5.0, you can reshard a collection by changing a collection's shard key." (Shard Keys)
- Chunks are key ranges. "Each chunk has an inclusive lower and exclusive upper range based on the shard key." (Chunks)
- Queries with the shard key go to the shards that hold it. "These targeted operations are generally more efficient than broadcasting to every shard in the cluster." (Advantages of Sharding)
- Without it, every shard is asked. "If queries do not include the shard key or the prefix of a compound shard key, mongos performs a broadcast operation , querying all shards in the sharded cluster." (Considerations Before Sharding)
- Those can be slow. "These scatter/gather queries can be long running operations." (Considerations Before Sharding)
- Choose the shard key carefully even though you can reshard. "While you can reshard your collection later, carefully consider your shard key choice to avoid scalability and performance issues." (Considerations Before Sharding)

## Visuals worth redrawing

- The sharded cluster diagram (app, mongos, config servers, shards).

## My notes

- MongoDB says "shard" and "chunk" where others say "partition" or
  "range".

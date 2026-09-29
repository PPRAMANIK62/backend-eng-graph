---
id: partitioning
title: Partitioning
depth: deep
phase: 11
note: >-
  Splitting data across machines so each holds a part.
needs: [distributed-system]
leads_to: [range-vs-hash-partitioning, consistent-hashing, rebalancing, hot-spots, partitioned-secondary-indexes, cell-based-architecture, batch-processing, stateful-stream-processing, search-architecture, id-generation]
compare_with: [replication, table-partitioning]
---

# Partitioning

Partitioning splits one dataset into parts and puts the parts on
different machines, so no single machine has to hold all the data or
serve all the traffic. Every record has a key, and a fixed rule sends
each key to exactly one part. The key and the rule you pick decide
which queries stay cheap, where the load lands, and how much work it is
to add a machine later.

Systems use different names for the same idea. MongoDB calls the parts
shards and chunks, Bigtable calls them tablets, CockroachDB calls them
ranges, and Dynamo and DynamoDB call them partitions.

## When one machine isn't enough

Picture a chat app that keeps every message in one table on one
database server. Two things run out as it grows. The query rate climbs
until the server's CPU can't keep up. And the data the app touches all
the time, its working set, outgrows memory, so reads start going to
disk. A bigger machine buys time, but there's a largest machine you can
buy or rent.

The other way out is to spread the table over many machines, each
holding a slice of the messages. Add machines and you add CPU, memory
and disk. The price is a [[distributed-system]]: something has to know
where each slice lives, some queries now need many machines, and there
are more parts to run and monitor.

## Two maps: key to partition, partition to machine

Partitioning is two decisions, and it helps to keep them apart.

1. **Key to partition.** You pick a partition key, the field that
   decides where a record goes. For the chat app, the channel ID is a
   good choice, because almost every query asks for one channel's
   messages. A rule maps each key to one partition. The two common
   rules are cutting the keys into ranges and hashing them
   ([[range-vs-hash-partitioning]]).
2. **Partition to machine.** A separate map says which machine holds
   each partition right now.

![Three columns. On the left, keys such as channel 17, channel 42 and channel 99. Arrows under the label "range or hash" send each key to one of six partitions, P1 to P6, in the middle. Arrows under the label "placement map" send each partition to one of three machines on the right: machine A holds P1 and P4, machine B holds P2 and P5, machine C holds P3 and P6. The path of channel 42 to P5 to machine B is highlighted. Notes at the bottom say map 1 changes rarely, because a change moves records, and map 2 changes often, when machines join, leave or get busy.](img/partitioning-two-maps.svg)

*Two separate maps. Moving P4 from machine A to machine C only edits the placement map; no key changes partition.*

The first map should almost never change, because changing it moves
records between partitions. The second map changes whenever a machine
joins, leaves or gets overloaded, and changing it only moves whole
partitions.

Dynamo learned this the hard way. In its first design each node took
random positions on a hash ring, and those positions decided both which
keys a node owned and where they lived. Adding a node for more capacity
changed the key ranges on many other nodes, and those nodes had to scan
their local stores to find the keys to hand over. Amazon moved Dynamo
to a fixed number of equal-sized partitions, placed on nodes
separately. How partitions move between machines is [[rebalancing]].

## Two ways to cut the keys

**By range.** Sort the keys and cut them into contiguous ranges.
Bigtable keeps a table's rows sorted by key and splits them into
tablets. CockroachDB keeps all of a cluster's data in one sorted key
space and splits it into ranges. Neighbouring keys sit together, so a
scan over a short range of keys only needs a few machines. Bigtable's
web table stores pages under reversed hostnames, like
`com.google.maps/index.html`, so all pages of one site sit next to each
other.

**By hash.** Hash the key first and cut up the hash values. Dynamo
hashes every key with MD5 to a 128-bit number and places it on a ring
([[consistent-hashing]]), to spread keys and load evenly. The keys lose
their order on the way, so a range of them is scattered over every
machine.

Many systems mix the two. DynamoDB hashes the partition key, then keeps
all items with the same partition key together, sorted by a second
key, the sort key. Each DynamoDB partition holds one contiguous slice
of the hashed key space.

## Finding the right partition

Every request has to reach the machine that holds its key. There are
three common places to keep the map:

- **A router in front.** A MongoDB client talks to `mongos`, a query
  router, which knows the chunk map from the config servers and
  forwards each query to the right shard.
- **A lookup tree, cached by clients.** Bigtable stores tablet
  locations in a three-level tree shaped like a
  [[b-plus-tree]]. The client library caches locations and walks back
  up the tree when a cached one turns out wrong. Reads and writes go
  straight to the tablet servers, never through the master.
  CockroachDB does the same with two levels of "meta ranges", cached
  on every node, with the location of the top level spread by
  [[gossip-protocols|gossip]].
- **Everyone knows the whole map.** Dynamo nodes gossip their
  membership list, each node talking to one random peer every second,
  so any node can work out who owns a key. A client that downloads the
  membership can route its own reads and skip a network hop.

Caches go stale while partitions move, so every design has a way to say
"not here, try there". A CockroachDB replica that gets a request it
can't serve answers with an error that points at the replica it last
knew to be in charge, and the node that sent the request retries there
without bothering the client.

## Partitions have replicas too

Partitioning and [[replication]] answer different questions.
Partitioning asks which part of the data a machine holds. Replication
asks how many machines hold a copy of each part. Real systems do both:
each partition is copied to several machines, and each machine holds
copies of many partitions.

In Dynamo, a key is stored on the node that owns it and copied to the
next N-1 nodes around the ring. In CockroachDB each range is its own
[[raft|Raft]] group, and splitting a range creates a new Raft group with
the same members. A DynamoDB partition's replicas sit in different
availability zones and agree on writes with [[paxos|Multi-Paxos]]. Each MongoDB
shard must be a replica set.

## Many small partitions, not one per machine

A Bigtable tablet server typically holds between ten and a thousand
tablets, and a tablet splits when it grows past about 100 to 200 MB by
default. A master assigns tablets to servers and balances the load
between them.

Small partitions are what make balancing cheap. Moving load means
moving a partition, and a small partition moves fast. CockroachDB
describes its range size as a compromise: small enough to move quickly
between nodes, large enough that keys used together stay together. In
Dynamo's later design, each fixed partition sits in its own file, so
moving one is a file copy instead of a search for scattered keys.

Too small has a cost as well. Every range a CockroachDB query touches
adds a fixed overhead, so CockroachDB merges a small range into its
right-hand neighbour once data has been deleted from it.

## What partitioning costs you

**Queries without the key ask everyone.** If a query includes the
shard key, MongoDB's router sends it only to the shards that hold that
key. If it doesn't, the router asks every shard and merges the answers,
and those scatter-gather queries can run long. So the real design
question is which of your queries carry the partition key. Looking
records up by any other field is
[[partitioned-secondary-indexes|secondary indexes on partitioned data]].

**Operations across partitions lose guarantees.** In Bigtable a read or
write of one row is atomic, but there are no general [[transaction|transactions]]
across rows. Keeping several partitions in step needs
[[distributed-transactions]].

**Even keys don't mean even load.** Dynamo's design assumed that even
with skewed traffic, enough keys would be popular to spread the load.
Amazon measured how many nodes were more than 15% away from the average
load: about 20% of nodes at low traffic, about 10% at high traffic,
because at low traffic fewer popular keys carry the load. The extreme
case is one key getting most of the traffic: [[hot-spots]].

**The key is hard to change.** Changing a key moves data between
partitions. MongoDB could only change a collection's shard key in place
from version 5.0, and its docs still tell you to choose the key
carefully up front.

## Where it gets tricky

**The same word means something smaller in a single database.** In
PostgreSQL, [[table-partitioning|partitioning]] splits one big table
into smaller tables on the same server. No second machine is involved,
so routing, rebalancing and cross-machine queries don't come up.

**"Partition key" and "partition" aren't the same thing.** In DynamoDB
many items can share one partition key value, and one partition holds
many partition key values: a whole slice of the hashed key space. The
key names the group; the partition is the unit that lives on a machine.

**Splitting by size can starve a hot partition.** Early DynamoDB gave
each partition a fixed share of the table's throughput. When a
partition split because it had grown, its share was divided equally
between the two halves. If the traffic was all in one half, that half
now had less capacity than before the split, and requests got
throttled while the table as a whole had capacity to spare. Amazon
calls this throughput dilution.

## What this means when you build

- Pick the partition key from your most frequent queries, so they
  carry the key and touch one partition.
- Make many more partitions than machines, so balancing moves small
  pieces.
- Keep the key-to-partition rule apart from the partition-to-machine
  map.
- Know which queries will fan out to every partition, and whether you
  need transactions across partitions, before you commit to a key.
- Don't partition until one machine really runs out. The operational
  cost doesn't go away.

## Further reading

- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., Amazon, SOSP 2007. The hash ring, replicas on successor nodes, measured load imbalance, and section 6.2 on why they separated partitioning from placement.
- [Bigtable: A Distributed Storage System for Structured Data](https://static.googleusercontent.com/media/research.google.com/en//archive/bigtable-osdi06.pdf), Chang et al., Google, OSDI 2006. Range partitioning into tablets, splits, and the cached three-level location tree.
- [Distribution Layer](https://www.cockroachlabs.com/docs/stable/architecture/distribution-layer), CockroachDB docs (v26.3). One sorted key space in ranges, meta ranges for lookup, splits, merges and why range size is a compromise.
- [Sharding](https://www.mongodb.com/docs/manual/sharding/), MongoDB manual 8.3. Why shard, routers and config servers, and targeted vs broadcast queries.
- [Amazon DynamoDB: A Scalable, Predictably Performant, and Fully Managed NoSQL Database Service](https://www.usenix.org/system/files/atc22-elhemali.pdf), Elhemali et al., AWS, USENIX ATC 2022. Hashed partitions with per-partition throughput, and what went wrong with splits and skewed traffic.
- [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html), PostgreSQL 18 docs. The single-server meaning of the word: range, list and hash partitions of one table.

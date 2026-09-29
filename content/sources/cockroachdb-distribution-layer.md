---
id: cockroachdb-distribution-layer
title: Distribution Layer (CockroachDB architecture docs)
author: Cockroach Labs
url: https://www.cockroachlabs.com/docs/stable/architecture/distribution-layer
kind: docs
primary: true
---

## Summary

How CockroachDB (docs for v26.3, "stable" when this was written) splits
all data into ranges of a single sorted key space, finds which node
holds a key through a two-level index of meta ranges cached on every
node, and splits and merges ranges as they grow and shrink.

## Key claims

- One sorted key-value map, cut into ranges. "This key-space describes all of the data in your cluster, as well as its location, and is divided into what we call “ranges”, contiguous chunks of the key-space, so that every key can always be found in a single range." (Overview)
- Sorting makes lookups and scans cheap. "By defining the order of data, it’s easy to find data within a particular range during a scan." (Overview)
- Range locations live in a two-level index at the start of the key space. "The locations of all ranges in your cluster are stored in a two-level index at the beginning of your key-space, known as meta ranges" (Meta ranges)
- Nodes cache meta2 and refresh it when it turns out wrong. "Whenever a node discovers that its meta2 cache is invalid for a specific key, the cache is updated by performing a regular read on the meta2 range." (Meta ranges)
- meta1's location is spread by gossip. "This lookup always succeeds because the location of meta1 is distributed among all the nodes in the cluster using a gossip protocol." (Using the monolithic sorted map)
- A table and each secondary index start as one range and split as they grow. "Each table and its secondary indexes initially map to a single range" (Table data)
- The range size is a compromise between moving fast and keeping related keys together. "small enough to move quickly between nodes, but large enough to store a meaningfully contiguous set of data whose keys are more likely to be accessed together." (Table data)
- A split creates a new Raft group with the same members. "During this range split, the node creates a new Raft group containing all of the same members as the range that was split." (Range splits)
- Small ranges merge with their right-hand neighbour. "your cluster can have any range below a certain size threshold try to merge with its “right-hand neighbor”" (How range merges work)
- Each range a query touches costs a fixed overhead. "Queries incur a fixed overhead in terms of processing time for each range they must coordinate with." (Why range merges improve performance)
- Requests go to the leaseholder first; a wrong guess is retried by the gateway. "Requests received by a non-leaseholder may fail with an error pointing at the replica’s last known leaseholder." (DistSender)
- Those retries are invisible to the client. "These requests are retried transparently with the updated lease by the gateway node and never reach the client." (DistSender)
- Ranges shrink when data is deleted, hence merges. "as you delete data from your cluster, a range might contain far less data than the default range size." (How range merges work)
- Each range has its own Raft group. "Range descriptors are updated whenever there are: Membership changes to a range’s Raft group" (Range descriptors)

## Visuals worth redrawing

- The range lookup tree (meta1, meta2, data ranges).

## My notes

- The page renders its default range size with JavaScript, so the
  number doesn't appear in the downloaded HTML. The replication zones
  page lists `range_max_bytes` default 536870912 (512 MiB); not cited.

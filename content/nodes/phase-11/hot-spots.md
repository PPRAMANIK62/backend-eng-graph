---
id: hot-spots
title: Hot spots
depth: short
phase: 11
note: >-
  One key or partition getting most of the traffic.
needs: [partitioning]
leads_to: [feed-fan-out]
compare_with: [message-ordering, cache-stampede, caching, shuffle]
---

# Hot spots

A hot spot is one key, or one partition, getting far more traffic than
the rest. [[partitioning|Partitioning]] spreads data evenly across
machines, but it can't spread one key: every request for that key goes
to the same partition, on the same few machines. Adding machines
doesn't help, because the busy key still lives in one place.

## Even data, uneven traffic

Discord stores chat messages partitioned by channel plus a time bucket,
so a channel's messages from one stretch of time sit together on the
same replicas. Most channels are quiet. A server with a few friends
sends orders of magnitude fewer messages than one with hundreds of
thousands of people. Now picture an announcement to everyone on a huge
server: users open the app and read the same recent
messages, which all live in one partition.

That partition got hot, and the damage didn't stay inside it. The node
serving it fell behind, so every other query sent to that node slowed
down too. Discord read and wrote with [[quorums]], so requests that needed
that node's answer waited as well, and the whole cluster's latency went
up.

Traffic skew also moves around. The DynamoDB team found that hot items
sometimes stayed in the same few partitions and sometimes hopped between
partitions over time. A fix that relies on knowing where the hot keys
are has to keep up.

## Why splitting doesn't always fix it

The obvious response is to split a hot partition in two and put the
halves on different machines. DynamoDB does this automatically: when a
partition's consumed throughput crosses a threshold, it splits it at a
point chosen from the keys it has actually seen, and the split usually
finishes within minutes.

Two cases don't benefit. If the traffic is all on one item, both halves
can't share it; the item is still in one partition. And if the keys are
written in order, like timestamps, all new traffic lands at the end of
whichever half holds the newest keys ([[range-vs-hash-partitioning]]).
DynamoDB detects both patterns and doesn't bother splitting.

Splitting can even make things worse if capacity is divided with the
data. Early DynamoDB gave each partition a fixed share of the table's
throughput and split that share evenly when a partition split for size.
When the traffic sat in one half, that half ended up with less capacity
than before, and requests were throttled while the table as a whole had
capacity to spare.

## Fixes that work

**Spread one key over many.** Add a suffix to a hot key so its writes
land in several partitions. DynamoDB's guide gives the example of a
date key with a random suffix from 1 to 200: writes for one day spread
over 200 key values. The cost moves to reads: reading that day means
querying all 200 and merging. If you compute the suffix from something
you know at read time, like the order ID, you can still fetch a single
item directly.

**Absorb the load before the database.** Discord put a service in front
of its database that coalesces requests: if many users ask for the
same row at the same moment, it queries the database once and hands the
answer to all of them. Requests are routed by a
[[consistent-hashing|consistent hash]] of the channel ID, so all
requests for one channel reach the same instance and can be merged.
It's the same idea as protecting a cache from a stampede
([[cache-stampede]]). It cut the hot partitions down but didn't end
them. For Discord it bought time to move to a new database.

**Let hot partitions borrow capacity.** DynamoDB first let a partition
burst into capacity it had left unused over the previous 300 seconds,
then boosted hot partitions after throttling happened, and later moved
[[admission-control|admission control]] out of the partitions into a central service that
tracks the whole table's consumption, so partitions can always burst.

## What this means when you build

- Look at how traffic spreads over keys, not only how data spreads.
  Big customers, announcements and "now" in a time-based key are the
  usual suspects.
- Don't partition by a timestamp or counter alone.
- For a known hot key, spread it with a suffix and pay on reads, or
  coalesce and cache in front of the store.
- Expect that splitting and [[autoscaling]] won't save you from a single
  hot item.

## Further reading

- [Amazon DynamoDB: A Scalable, Predictably Performant, and Fully Managed NoSQL Database Service](https://www.usenix.org/system/files/atc22-elhemali.pdf), Elhemali et al., AWS, USENIX ATC 2022. Section 4: hot partitions, throughput dilution, bursting, global admission control, and splitting for consumption.
- [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages), Bo Ingram, Discord, 2023. A real hot partition slowing a whole Cassandra cluster, and request coalescing as the fix.
- [Using write sharding to distribute workloads evenly](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html), DynamoDB Developer Guide. Random and calculated key suffixes, and what they cost on reads.

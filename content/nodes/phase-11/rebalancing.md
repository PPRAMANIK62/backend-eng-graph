---
id: rebalancing
title: Rebalancing
depth: short
phase: 11
note: >-
  Moving partitions when nodes join or leave.
needs: [partitioning]
leads_to: []
compare_with: [consumer-groups, consistent-hashing, stateful-stream-processing]
---

# Rebalancing

Rebalancing moves partitions from one machine to another: when a
machine joins, when one leaves for good, or when some machines hold
more than their share. The data keeps serving reads and writes while it
moves, so the move has to be gentle enough not to hurt live traffic and
careful enough that no request is lost halfway.

## Move whole partitions, don't redraw them

The trick that makes rebalancing manageable comes from
[[partitioning]]: fix the rule that maps keys to partitions, and only
change which machine holds each partition.

Redis Cluster does exactly this. Its key space is split into 16384
hash slots, and a key's slot is `CRC16(key) mod 16384`. The number of
slots never changes, so a key's slot never changes either. Adding a
node means moving some slots to it. Removing a node means moving its
slots away. Evening out load means moving slots between nodes. It's one
operation for all three cases: move a slot, which means moving the keys
in it.

Dynamo ended up in the same place. Its final design splits the hash
space into a fixed number of equal partitions and stores each one in
its own file, so moving a partition is copying a file.

## What happens when partitions aren't fixed

Dynamo's earlier designs show why. Each node took random positions,
called tokens, on a [[consistent-hashing]] ring, so adding a node
carved new key ranges out of other nodes' ranges. Those nodes had to
scan their local stores to find the keys to hand over. Scans are heavy,
so they ran at the lowest priority to protect customer traffic, and in
the busy shopping season adding one node took almost a day. Every join
also changed the key ranges of many nodes, so the Merkle trees they used
to compare replicas ([[anti-entropy]]) had to be rebuilt for all of
them.

Fixed partitions solved both problems. The price is coordination: when
membership changes, something has to decide which node takes which
partitions so the assignment stays even.

## Moving one partition while it's live

Here's how Redis moves slot 8 from node A to node B.

1. B is told it's importing slot 8 from A, and A is told it's migrating
   slot 8 to B. Every other node still sends clients to A.
2. A keeps answering for keys in slot 8 that it still has. For a key it
   doesn't have, which has either moved already or doesn't exist yet,
   it answers `-ASK` and points at B. New keys therefore get created on
   B.
3. A tool lists the keys still in slot 8 and moves them with `MIGRATE`.
   Each key moves atomically, so from outside a key is always either on
   A or on B.
4. When the slot is empty, it's assigned to B everywhere. A client that
   still asks A now gets `-MOVED`.

![Sequence diagram with three lanes: client, node A with slot 8 migrating, node B with slot 8 importing. The client asks A for user:1, which is still on A, and gets the value. A migrates user:2 to B; keys are copied over in batches, each atomically. The client asks A for user:2, gets -ASK 8 node B, then sends ASKING and GET user:2 to B and gets the value. After a line saying all keys moved and slot 8 now belongs to B, the client asks A for user:1 and gets -MOVED 8 node B, meaning update your slot map.](img/rebalancing-slot-migration.svg)

*Moving one Redis Cluster slot. Adapted from the slot 8 example in the Redis cluster specification.*

The two redirects mean different things. `-ASK` means "send just this
one request to B", because the next key in the same slot may still be
on A. `-MOVED` means "this slot lives on B now, update your map".
Clients that cache the slot map go straight to the right node almost
every time and only learn about moves from these replies.

## Where it gets tricky

**Don't rebalance on a blip.** Most outages, from failures or
maintenance, are temporary. Moving a node's data every time it stops
answering would copy a lot of data for a node that comes back. Dynamo
treats an outage as temporary and only adds or removes nodes when an
operator says so with an explicit command.

**Big keys make moves hurt.** Both nodes are locked while a batch of
keys migrates, which is usually brief. With big keys it isn't, so
resharding a cluster with big keys is a bad idea if the application
has latency limits.

**Some operations pause.** In Redis Cluster, commands on several keys
can be unavailable for a while during resharding, even though
single-key commands keep working.

**Moving data competes with serving it.** Throttling the move protects
live traffic but makes it slow, which is how Dynamo ended up with
day-long joins.

## What this means when you build

- Fix the number of partitions, many more than machines, and move
  whole partitions.
- Rebalance on purpose, when a machine really joins or leaves, not
  whenever a health check fails.
- Give clients a "wrong node, try there" reply so stale maps fix
  themselves.
- Keep individual keys and partitions small enough to move quickly.

## Further reading

- [Redis cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/), Redis. Hash slots, live resharding with MIGRATING and IMPORTING, and the difference between -ASK and -MOVED.
- [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), DeCandia et al., Amazon, SOSP 2007. Section 6.2 on why random token ranges made joins slow and how fixed partitions fixed it; 4.8.1 on explicit membership changes.

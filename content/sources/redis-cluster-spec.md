---
id: redis-cluster-spec
title: Redis cluster specification
author: Redis (Redis Open Source docs)
url: https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/
kind: spec
primary: true
---

## Summary

The design spec of Redis Cluster: the key space split into 16384 hash
slots, keys mapped by `CRC16(key) mod 16384`, hash tags to keep keys
together, clients redirected with -MOVED and -ASK, and live resharding
by moving one slot at a time between nodes.

## Key claims

- A fixed number of slots, spread over the masters. "The cluster's key space is split into 16384 slots, effectively setting an upper limit for the cluster size of 16384 master nodes" (Key distribution model)
- The suggested maximum is far lower. "(however, the suggested max size of nodes is on the order of ~ 1000 nodes)" (Key distribution model)
- The mapping. "HASH_SLOT = CRC16(key) mod 16384" (Key distribution model)
- Hash tags force keys into one slot for multi-key operations. "Hash tags are a way to ensure that multiple keys are allocated in the same hash slot." (Hash tags)
- Only the part between the braces is hashed. "If the key contains a "{...}" pattern only the substring between { and } is hashed in order to obtain the hash slot." (Hash tags)
- Adding, removing and rebalancing are all the same operation. "Adding or removing a node is abstracted into the same operation: moving a hash slot from one node to another." (Live reconfiguration)
- Moving a slot means moving its keys. "Moving a hash slot means moving all the keys that happen to hash into this hash slot." (Live reconfiguration)
- During a move the old owner is MIGRATING, the new one IMPORTING; the old owner answers for keys it still has and sends the rest on with -ASK. "When a slot is set as MIGRATING, the node will accept all queries that are about this hash slot, but only if the key in question exists, otherwise the query is forwarded using a -ASK redirection to the node that is target of the migration." (Live reconfiguration)
- Keys move one batch at a time with MIGRATE; a key is in one place at any moment. "From the point of view of an external client a key exists either in A or B at any given time." (Live reconfiguration)
- Moving big keys hurts latency. "in Redis Cluster reconfiguring the cluster where big keys are present is not considered a wise procedure if there are latency constraints in the application using the database." (Live reconfiguration)
- MOVED is permanent, ASK is for the next query only. "ASK means to send only the next query to the specified node." (ASK redirection)
- A wrong node answers -MOVED with the slot and the right address. "The error includes the hash slot of the key (3999) and the endpoint:port of the instance that can serve the query." (MOVED Redirection)
- Clients that cache the slot map avoid redirects. "However clients that are able to cache the map between keys and nodes can improve the performance in a sensible way." (Client and Server roles)
- Multi-key operations can stall during resharding. "However, during manual resharding, multi-key operations may become unavailable for some time while single-key operations are always available." (Redis Cluster goals)
- MIGRATE locks both nodes briefly per batch. "both instances are locked for the time (usually very small time) needed to migrate keys so there are no race conditions" (Live reconfiguration)
- The keys to move are listed with CLUSTER GETKEYSINSLOT. "The above command will return count keys in the specified hash slot." (Live reconfiguration)
- New keys stop being created on the old owner. "This way we no longer create new keys in "A"." (Live reconfiguration)
- When the move ends, the slot is assigned to the new node, usually on every node. "When the migration process is finally finished, the SETSLOT <slot> NODE <node-id> command is sent to the two nodes involved in the migration in order to set the slots to their normal state again. The same command is usually sent to all other nodes" (Live reconfiguration)

## Visuals worth redrawing

- The slot 8 migration example (A MIGRATING, B IMPORTING, -ASK for
  missing keys, SETSLOT NODE at the end). Redrawn in `rebalancing`.

## My notes

- Replication in Redis Cluster is asynchronous, so acknowledged writes
  can be lost on failover; that belongs to the replication nodes.

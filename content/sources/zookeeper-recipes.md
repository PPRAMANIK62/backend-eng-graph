---
id: zookeeper-recipes
title: ZooKeeper Recipes and Solutions
author: Apache ZooKeeper project
url: https://zookeeper.apache.org/doc/current/recipes.html
kind: docs
primary: true
---

## Summary

The official ZooKeeper 3.9 docs page of client-side "recipes": barriers,
queues, locks, shared locks, two-phase commit and leader election, all
built from sequential and ephemeral znodes plus watches. The lock and
leader election recipes both avoid the herd effect by having each client
watch only the node just before its own.

## Key claims

- Recipes are client-side conventions; the server needs nothing special. "All of them are conventions implemented at the client and do not require special support from ZooKeeper." (intro)
- They avoid polling and timers to avoid the herd effect. "they avoid polling, timers or anything else that would result in a "herd effect", causing bursts of traffic and limiting scalability." (intro)
- Lock step 1: create a sequential, ephemeral node with a guid in its name. "Call create( ) with a pathname of "locknode/guid-lock-" and the sequence and ephemeral flags set." (Locks)
- Lowest sequence number holds the lock. "If the pathname created in step 1 has the lowest sequence number suffix, the client has the lock and the client exits the protocol." (Locks)
- Unlock is deleting your node. "clients wishing to release a lock simply delete the node they created in step 1." (Locks)
- One wake-up per release. "The removal of a node will only cause one client to wake up since each node is watched by exactly one client." (Locks)
- The guid handles a create that succeeded on the server but whose reply was lost. "This handles the case (noted above) of the create() succeeding on the server but the server crashing before returning the name of the new node." (Recoverable Errors and the GUID)
- A lock implementation now ships with the release. "There now exists a Lock implementation in ZooKeeper recipes directory." (Locks)
- Leader election: each candidate creates a SEQUENCE|EPHEMERAL node under /election; the smallest is the leader. "The process that created the znode with the smallest appended sequence number is the leader." (Leader Election)
- If the leader dies, its ephemeral node goes away. "the smallest znode will go away if the leader fails because the node is ephemeral" (Leader Election)
- Everyone watching the leader's node causes a herd; watch the next one down instead. "To avoid the herd effect, it is sufficient to watch for the next znode down on the sequence of znodes." (Leader Election)
- Having the smallest node doesn't mean the process knows it's leader yet. "Note that the znode having no preceding znode on the list of children do not imply that the creator of this znode is aware that it is the current leader." (Leader Election, notes)

## Visuals worth redrawing

- None on the page; the chain of `guid-n_` nodes each watching its
  predecessor is worth drawing.

## My notes

- The recipes don't mention fencing. The znode's sequence number or zxid
  can serve as one (Kleppmann's note).

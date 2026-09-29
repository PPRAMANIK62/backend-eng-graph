---
id: kingsbury-jepsen-riak-2013
title: "Jepsen: Riak"
author: Kyle Kingsbury
url: https://aphyr.com/posts/285-jepsen-riak
kind: blog
primary: false
---

## Summary

The 2013 Jepsen post that ran Riak under concurrent writes and network
partitions with last-write-wins, then with strict quorums, then with
siblings merged by a CRDT-style set union. Last write wins lost most
acknowledged writes even with no partition; strict quorums didn't fix
it; merging kept every write.

## Key claims

- LWW loses writes with no fault at all. "Riak lost 71% of acknowledged writes on a fully-connected, healthy cluster. No partitions." (last-write-wins run)
- Why: concurrent writes from the same parent, and the higher timestamp wins. "If two clients write values which descend from the same object, Riak just picks the write with the higher timestamp, and throws away the other write." (last-write-wins run)
- Partitions and concurrency are the same problem. "In a very real sense, partitions are just really big windows of concurrency." (intro)
- On the side of a partition that can't see any copy, a read comes back empty. "If you’re adding items to a shopping cart and a partition occurs, your cart might appear to be empty." (intro)
- Sloppy quorum lets both sides of a partition keep writing. "Allowing both components to see a majority is called a sloppy quorum" (partition run)
- Waiting for a quorum can stall a so-called available system. "Even though Riak is an AP design, it can functionally become unavailable while nodes are timing out." (partition run)
- Strict quorums still lost writes. "PR=PW=R=W=quorum still allowed 92% write loss." (PR and PW run)
- A failed write can still land somewhere. "The problem is that that failed writes may still be partially successful." (PR and PW run)
- And then beat real writes. "This means the minority component’s failing writes can destroy all of the majority component’s successful writes." (PR and PW run)
- Under strict quorums a partitioned node serves some keys and not others. "In any given component, you’ll be able to read and write some fraction of the keys, but not others." (PR and PW run)
- What a safe merge needs. "If the merge function is associative, commutative, and idempotent over that type of object, we can guarantee that it always converges to the same value regardless of the order of writes." (CRDTs)
- Merging kept everything. "CRDTs preserve 100% of our writes." (CRDTs)
- When LWW is fine. "If your data is immutable, then it doesn’t matter which copy you choose." (Strategies)
- When it isn't. "If, however, your writes mean “I am changing something I read earlier,” then LWW is unsafe." (Strategies)
- LWW became Riak's default because siblings were hard to work with. "LWW never should have been the standard behavior for a Dynamo system, but Basho made it the default after customers complained that they didn’t like the complexity of reasoning about siblings." (Strategies)
- PR counts only a key's real owners. "PR means you have to read a value from at least that many of the original owners of a key: fallback vnodes don’t count." (PR and PW run)
- Partially successful failed writes spread and win by timestamp. "Those values will still be exchanged during read-repair, considered as conflicts, and the timestamp used to discard the older value" (PR and PW run)
- Requests stall until fallbacks are set up. "Those requests time out until Riak determines those nodes are inaccessible, and sets up fallback vnodes." (partition run)
- Locks cost latency and still lost data. "Even if they did prevent data loss–and as we saw, they don’t–you’ll impose a big latency cost." (Strategies)
- Community advice followed the default. "community resources which people rely on to learn how to use Riak are often aimed towards last-write-wins." (Strategies)
- The test wrapped every operation in a perfect distributed lock too. "We’ll wrap all operations against Riak in a perfectly consistent, available distributed lock." (lock runs)
- Locks give up what an AP store was for. "Moreover, locks restrict your system to being CP, so there’s little advantage to having an AP database." (Strategies)

## Visuals worth redrawing

None.

## My notes

- Riak as tested in 2013 (allow_mult=false by default then). Riak's own
  docs now recommend allow_mult=true (riak-causal-context).

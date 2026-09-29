---
id: decandia-dynamo-2007
title: "Dynamo: Amazon's Highly Available Key-value Store"
author: Giuseppe DeCandia, Deniz Hastorun, Madan Jampani, Gunavardhan Kakulapati, Avinash Lakshman, Alex Pilchin, Swaminathan Sivasubramanian, Peter Vosshall, Werner Vogels
url: https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
kind: paper
primary: true
---

## Summary

The SOSP 2007 paper on Dynamo, the key-value store Amazon built for
services like the shopping cart. For data models, the part that matters
is why: many services only read and write single items by primary key,
so a relational database was more than they needed and limited
availability and scale. For replication, it's the source of the
leaderless design: N replicas on a hash ring, R and W quorums, sloppy
quorums with hinted handoff, vector clocks with client-side merging,
read repair and Merkle-tree anti-entropy.

## Key claims

- Many Amazon services only need primary-key access. "There are many services on Amazon’s platform that only need primary-key access to a data store." (1)
- For those, a relational database hurt. "the common pattern of using a relational database would lead to inefficiencies and limit scale and availability." (1)
- The query model: read and write one item by key, values are blobs. "State is stored as binary objects (i.e., blobs) identified by unique keys." (2.1)
- No multi-item operations, no relational schema. "No operations span multiple data items and there is no need for relational schema." (2.1)
- Objects are small. "Dynamo targets applications that need to store objects that are relatively small (usually less than 1 MB)." (2.1)
- The RDBMS's extra features were cost without benefit for these services. "Most of these services only store and retrieve data by primary key and do not require the complex querying and management functionality offered by an RDBMS." (2)
- Relational replication then favoured consistency over availability. "In addition, the available replication technologies are limited and typically choose consistency over availability." (2)
- The example services. "For many services, such as those that provide best seller lists, shopping carts, customer preferences, session management, sales rank, and product catalog, the common pattern of using a relational database would lead to inefficiencies and limit scale and availability." (1)

Replication, quorums, versioning and repair (phase 11):

- Dynamo is eventually consistent by design. "Dynamo is designed to be an eventually consistent data store; that is all updates reach all replicas eventually." (2.3)
- It never rejects writes, so conflicts get resolved on read. "This requirement forces us to push the complexity of conflict resolution to the reads in order to ensure that writes are never rejected." (2.3)
- If the store resolves conflicts, it can only use simple rules. "If conflict resolution is done by the data store, its choices are rather limited." (2.3)
- The application can merge instead. "the application that maintains customer shopping carts can choose to “merge” the conflicting versions and return a single unified shopping cart." (2.3)
- No special nodes. "Every node in Dynamo should have the same set of responsibilities as its peers" (2.3)
- Each key lives on N nodes. "Each data item is replicated at N hosts, where N is a parameter configured “per-instance”." (4.3)
- The coordinator copies to the next N-1 nodes on the ring. "the coordinator replicates these keys at the N-1 clockwise successor nodes in the ring." (4.3)
- The preference list. "The list of nodes that is responsible for storing a particular key is called the preference list." (4.3)
- A put can return before all replicas have it. "return to its caller before the update has been applied at all the replicas" (4.4)
- Every write makes a new immutable version. "Dynamo treats the result of each modification as a new and immutable version of the data." (4.4)
- When branches can't be ordered, the client merges them. "the client must perform the reconciliation in order to collapse multiple branches of data evolution back into one (semantic reconciliation)." (4.4)
- The cart merge never loses an add, but deletes can come back. "Using this reconciliation mechanism, an “add to cart” operation is never lost. However, deleted items can resurface." (4.4)
- A vector clock. "A vector clock is effectively a list of (node, counter) pairs." (4.4)
- The ancestor rule. "If the counters on the first object’s clock are less-than-or-equal to all of the nodes in the second clock, then the first is an ancestor of the second and can be forgotten." (4.4)
- Otherwise it's a conflict. "Otherwise, the two changes are considered to be in conflict and require reconciliation." (4.4)
- An update carries the context from the read. "This is done by passing the context it obtained from an earlier read operation, which contains the vector clock information." (4.4)
- Figure 3's merge result. "The new data D5 will have the following clock: [(Sx, 3), (Sy, 1), (Sz, 1)]." (4.4)
- Clocks are truncated past a size. "When the number of (node, counter) pairs in the vector clock reaches a threshold (say 10), the oldest pair is removed from the clock." (4.4)
- Clocks stay short because a few servers coordinate most writes. "In practice, this is not likely because the writes are usually handled by one of the top N nodes in the preference list." (4.4)
- Truncation can hide ancestry. "Clearly, this truncation scheme can lead to inefficiencies in reconciliation as the descendant relationships cannot be derived accurately." (4.4)
- Two versions with no causal relation are both kept and handed to the client. "Both versions of the data must be kept and presented to a client (upon a read) for semantic reconciliation." (4.4)
- R defined. "R is the minimum number of nodes that must participate in a successful read operation." (4.5)
- R + W > N. "Setting R and W such that R + W > N yields a quorum-like system." (4.5)
- Latency is set by the slowest of the R or W. "In this model, the latency of a get (or put) operation is dictated by the slowest of the R (or W) replicas." (4.5)
- The coordinator counts itself toward W. "If at least W-1 nodes respond then the write is considered successful." (4.5)
- A read returns every version it can't order. "If the coordinator ends up gathering multiple versions of the data, it returns all the versions it deems to be causally unrelated." (4.5)
- Sloppy quorum. "it does not enforce strict quorum membership and instead it uses a “sloppy quorum”; all read and write operations are performed on the first N healthy nodes from the preference list" (4.6)
- Hinted handoff. "The replica sent to D will have a hint in its metadata that suggests which node was the intended recipient of the replica (in this case A)." (4.6)
- "Upon detecting that A has recovered, D will attempt to deliver the replica to A." (4.6)
- W=1 for maximum availability. "Applications that need the highest level of availability can set W to 1, which ensures that a write is accepted as long as a single node in the system has durably written the key it to its local store." (4.6)
- Replicas are spread across data centers. "Dynamo is configured such that each object is replicated across multiple data centers." (4.6)
- Hinted handoff has limits. "Hinted handoff works best if the system membership churn is low and node failures are transient." (4.7)
- Merkle tree. "A Merkle tree is a hash tree where leaves are hashes of the values of individual keys." (4.7)
- Equal roots mean nothing to sync. "For instance, if the hash values of the root of two trees are equal, then the values of the leaf nodes in the tree are equal and the nodes require no synchronization." (4.7)
- One tree per key range. "Each node maintains a separate Merkle tree for each key range (the set of keys covered by a virtual node) it hosts." (4.7)
- Membership changes force tree rebuilds. "The disadvantage with this scheme is that many key ranges change when a node joins or leaves the system thereby requiring the tree(s) to be recalculated." (4.7)
- Read repair. "This process is called read repair because it repairs replicas that have missed a recent update at an opportunistic time and relieves the anti-entropy protocol from having to do it." (5)
- Some services use last write wins by timestamp. "In case of divergent versions, Dynamo performs simple timestamp based reconciliation logic of “last write wins”; i.e., the object with the largest physical timestamp value is chosen as the correct version." (6)
- Read-heavy services use R=1, W=N. "In this configuration, typically R is set to be 1 and W to be N." (6)
- Typical N. "A typical value of N used by Dynamo’s users is 3." (6)
- Typical (N,R,W). "The common (N,R,W) configuration used by several instances of Dynamo is (3,2,2)." (6)
- Low W and R risk inconsistency. "low values of W and R can increase the risk of inconsistency as write requests are deemed successful and returned to the clients even if they are not processed by a majority of the replicas." (6)
- Any of the top N nodes can coordinate a write. "any of the top N nodes in the preference list is allowed to coordinate the writes." (6)
- Picking the node that answered the read helps read-your-writes. "This optimization enables us to pick the node that has the data that was read by the preceding read operation thereby increasing the chances of getting “read-your-writes” consistency." (6)
- Divergent versions are rare in the cart service. "During this period, 99.94% of requests saw exactly one version" (6.3)
- They come from concurrent writers more than failures. "Experience shows that the increase in the number of divergent versions is contributed not by failures but due to the increase in number of concurrent writers." (6.3)
- Dynamo had to grow one node at a time, so it needed to repartition as it went. "One of the key design requirements for Dynamo is that it must scale incrementally." (4.2)
- Keys are hashed with MD5 into a 128-bit identifier. "It applies a MD5 hash on the key to generate a 128-bit identifier, which is used to determine the storage nodes that are responsible for serving the key." (4.1)
- The hash space is a ring. "In consistent hashing [10], the output range of a hash function is treated as a fixed circular space or “ring” (i.e. the largest hash value wraps around to the smallest hash value)." (4.2)
- A key belongs to the first node clockwise from it. "Each data item identified by a key is assigned to a node by hashing the data item’s key to yield its position on the ring, and then walking the ring clockwise to find the first node with a position larger than the item’s position." (4.2)
- A joining or leaving node affects only its neighbours. "The principle advantage of consistent hashing is that departure or arrival of a node only affects its immediate neighbors and other nodes remain unaffected." (4.2)
- One random position per node gives uneven load. "First, the random position assignment of each node on the ring leads to non-uniform data and load distribution." (4.2)
- And ignores that machines differ. "Second, the basic algorithm is oblivious to the heterogeneity in the performance of nodes." (4.2)
- Virtual nodes: each physical node takes several positions ("tokens"). "A virtual node looks like a single node in the system, but each node can be responsible for more than one virtual node." (4.2)
- With virtual nodes, a failed node's load spreads over all the others. "If a node becomes unavailable (due to failures or routine maintenance), the load handled by this node is evenly dispersed across the remaining available nodes." (4.2)
- And a bigger machine can take more of them. "The number of virtual nodes that a node is responsible can decided based on its capacity, accounting for heterogeneity in the physical infrastructure." (4.2)
- Replicas go to the next N-1 nodes clockwise. "In addition to locally storing each key within its range, the coordinator replicates these keys at the N-1 clockwise successor nodes in the ring." (4.3)
- The preference list skips positions owned by a node already in it. "the preference list for a key is constructed by skipping positions in the ring to ensure that the list contains only distinct physical nodes." (4.3)
- An outage shouldn't trigger rebalancing. "A node outage rarely signifies a permanent departure and therefore should not result in rebalancing of the partition assignment or repair of the unreachable replicas." (4.8.1)
- Nodes join and leave only by an explicit admin command. "An administrator uses a command line tool or a browser to connect to a Dynamo node and issue a membership change to join a node to a ring or remove a node from a ring." (4.8.1)
- Membership spreads by gossip, one random peer a second. "Each node contacts a peer chosen at random every second and the two nodes efficiently reconcile their persisted membership change histories." (4.8.1)
- Uniform keys give uniform load only if enough keys are popular. "In particular, Dynamo’s design assumes that even where there is a significant skew in the access distribution there are enough keys in the popular end of the distribution so that the load of handling popular keys can be spread across the nodes uniformly through partitioning." (6.1)
- Measured imbalance (share of nodes more than 15% off average load): about 20% at low load, about 10% at high load. "For instance, during low loads the imbalance ratio is as high as 20% and during high loads it is close to 10%." (6.1)
- With random tokens, partitioning and placement were one thing. "The fundamental issue with this strategy is that the schemes for data partitioning and data placement are intertwined." (6.2)
- A joining node's data came from scans of other nodes' stores. "the nodes handing the key ranges off to the new node have to scan their local persistence store to retrieve the appropriate set of data items." (6.2)
- Bootstrapping ran at low priority and took almost a day in peak season. "during busy shopping season, when the nodes are handling millions of requests a day, the bootstrapping has taken almost a day to complete." (6.2)
- Many ranges changed on every join, so Merkle trees had to be rebuilt. "Second, when a node joins/leaves the system, the key ranges handled by many nodes change and the Merkle trees for the new ranges need to be recalculated, which is a non-trivial operation to perform on a production system." (6.2)
- Strategy 3: Q equal partitions fixed up front, placement separate. "Similar to strategy 2, this strategy divides the hash space into Q equally sized partitions and the placement of partition is decoupled from the partitioning scheme." (6.2)
- Fixed partitions move as whole files. "Since partition ranges are fixed, they can be stored in separate files, meaning a partition can be relocated as a unit by simply transferring the file (avoiding random accesses needed to locate specific items)." (6.2)
- Strategy 3 balanced best and cut membership data by three orders of magnitude. "Compared to Strategy 1, Strategy 3 achieves better efficiency and reduces the size of membership information maintained at each node by three orders of magnitude." (6.2)
- Its cost: membership changes need coordination. "The disadvantage of strategy 3 is that changing the node membership requires coordination in order to preserve the properties required of the assignment." (6.2)
- Clients that know the membership can route reads themselves and skip a hop. "Read requests can be coordinated at the client node thereby avoiding the extra network hop that is incurred if the request were assigned to a random Dynamo node by the load balancer." (6.4)
- Any node can take a request for any key. "Any storage node in Dynamo is eligible to receive client get and put operations for any key." (4.5)
- Low W leaves confirmed writes on few nodes. "This also introduces a vulnerability window for durability when a write request is successfully returned to the client even though it has been persisted at only a small number of nodes." (6)
- A node stores its own range plus the ranges it replicates for its predecessors. "Node D will store the keys that fall in the ranges (A, B], (B, C], and (C, D]." (4.3)
- Any node can work out a key's replicas. "every node in the system can determine which nodes should be in this list for any particular key." (4.3)
- Consistent hashing is there to spread keys, and so load, evenly. "Dynamo uses consistent hashing to partition its key space across its replicas and to ensure uniform load distribution." (6.1)
- Imbalance is worse at low load because fewer popular keys carry it. "fewer popular keys are accessed, resulting in a higher load imbalance." (6.1)
- Concurrent writers were mostly programs. "The increase in the number of concurrent writes is usually triggered by busy robots (automated client programs) and rarely by humans." (6.3)
- Truncating clocks loses ordering information. "Clearly, this truncation scheme can lead to inefficiencies in reconciliation as the descendant relationships cannot be derived accurately." (4.4)
- It hadn't been a problem in practice. "However, this problem has not surfaced in production and therefore this issue has not been thoroughly investigated." (4.4)
- Outages are usually temporary. "In Amazon’s environment node outages (due to failures and maintenance tasks) are often transient but may last for extended intervals." (4.8.1)
- Dynamo aims to be always writeable. "Dynamo targets the design space of an “always writeable” data store (i.e., a data store that is highly available for writes)." (2.3)
- After handing a hinted write back, the stand-in may drop it. "Once the transfer succeeds, D may delete the object from its local store without decreasing the total number of replicas in the system." (4.6)
- The cart measurement covered one day. "the number of versions returned to the shopping cart service was profiled for a period of 24 hours." (6.3)
- The session service used last write wins. "The service that maintains customer’s session information is a good example of a service that uses this mode." (6)
- Dynamo instances were migrated to strategy 3. "Strategy 2 served as an interim setup during the process of migrating Dynamo instances from using Strategy 1 to Strategy 3." (6.2)
- Why Merkle trees: less data moved. "To detect the inconsistencies between replicas faster and to minimize the amount of transferred data, Dynamo uses Merkle trees [13]." (4.7)
- Parents hash children. "Parent nodes higher in the tree are hashes of their respective children." (4.7)
- Each branch can be checked alone. "The principal advantage of Merkle tree is that each branch of the tree can be checked independently without requiring nodes to download the entire tree or the entire data set." (4.7)
- Equal roots mean equal data. "if the hash values of the root of two trees are equal, then the values of the leaf nodes in the tree are equal and the nodes require no synchronization." (4.7)
- Fewer disk reads too. "Merkle trees minimize the amount of data that needs to be transferred for synchronization and reduce the number of disk reads performed during the anti-entropy process." (4.7)

## Visuals worth redrawing

- Figure 2: the ring with nodes A to G, key K stored on B, C and D (N=3).
- Figure 3: version evolution D1 to D5 with vector clocks, the branch at
  D3/D4 and the reconciled D5 (4.4).

## My notes

- DynamoDB (the AWS service) is a different system from this paper's
  Dynamo; don't mix them up.

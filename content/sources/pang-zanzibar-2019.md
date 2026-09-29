---
id: pang-zanzibar-2019
title: "Zanzibar: Google's Consistent, Global Authorization System"
author: Ruoming Pang, Ramón Cáceres, Mike Burrows, Zhifeng Chen, Pratik Dave, Nathan Germer, Alexander Golynski, Kevin Graney, Nina Kang, Lea Kissner, Jeffrey L. Korn, Abhishek Parmar, Christina D. Richards, Mengzhi Wang
url: https://www.usenix.org/system/files/atc19-pang.pdf
kind: paper
primary: true
---

## Summary

The USENIX ATC 2019 paper on Zanzibar, the service that stores and
checks permissions for Google Calendar, Cloud, Drive, Maps, Photos and
YouTube. Permissions are relation tuples ("user U has relation R to
object O"), a per-namespace config says how relations imply each other,
and every check runs at one consistent snapshot. Zookies (opaque
timestamp tokens) stop the "new enemy" problem. The rest is how it
stays fast: caching, request deduplication, Leopard for nested groups,
hedging and per-client isolation.

## Key claims

- Zanzibar serves many Google products from one data model. "Zanzibar provides a uniform data model and configuration language for expressing a wide range of access control policies from hundreds of client services at Google, including Calendar, Cloud, Drive, Maps, Photos, and YouTube." (Abstract)
- Headline numbers. "It has maintained 95th-percentile latency of less than 10 milliseconds and availability of greater than 99.999% over 3 years of production use." (Abstract)
- Scale: more than two trillion ACLs, millions of checks a second, replicated everywhere because checks can come from anywhere. "The ACL data does not lend itself to geographic partitioning because authorization checks for any object can come from anywhere in the world." (§1)
- Why availability matters for authz. "in the absence of explicit authorizations, client services would be forced to deny their users access." (§1, goals)
- Search needs many checks per request. "Low latency at the tail is particularly important for serving search results, which often require tens to hundreds of checks." (§1, goals)
- A simple ACL and an ACL that points at another set. "A simple ACL takes the form of “user U has relation R to object O”. More complex ACLs take the form of “set of users S has relation R to object O”, where S is itself specified in terms of another object-relation pair." (§1)
- Groups are just ACLs with a member relation, and nested groups make checks expensive. "evaluating whether a user belongs to a group can entail following a long chain of nested group memberships." (§1)
- Tuple text notation: namespace:object_id#relation@user, where user is a user ID or a userset (object#relation). Groups need nothing special. "Groups are simply ACLs with membership semantics." (§2.1)
- Table 1 examples: doc:readme#owner@10, group:eng#member@11, doc:readme#viewer@group:eng#member, doc:readme#parent@folder:A#... (§2.1, Table 1)
- Tuples instead of per-object ACL lists unify ACLs and groups. "Defining our data model around tuples, instead of per-object ACLs, allows us to unify the concepts of ACLs and groups and to support efficient reads and incremental updates" (§2.1)
- The new enemy problem, defined. "“new enemy” problem, which can arise when we fail to respect the ordering between ACL updates or when we apply old ACLs to new content." (§2.2)
- Example A: Alice removes Bob from a folder, then asks Charlie to move new documents into it; Bob may see them if the check ignores the order of the two changes. (§2.2, Example A)
- Example B: Alice removes Bob from a document's ACL, then asks Charlie to add new contents; Bob may see them if the check uses a stale ACL. (§2.2, Example B)
- Two properties needed. "Hence Zanzibar must provide two key consistency properties: external consistency [18] and snapshot reads with bounded staleness." (§2.2)
- Causally related updates get timestamps in causal order, and a snapshot read at T sees all updates at or before T. "if the read observes an update x, it will observe all updates that happen causally before x." (§2.2)
- Spanner's TrueTime gives each ACL write a timestamp that reflects causal order. "Spanner’s TrueTime mechanism assigns each ACL write a microsecond-resolution timestamp, such that the timestamps of writes reflect the causal ordering between writes" (§2.2)
- Every check is evaluated at one snapshot across many reads. "We evaluate each ACL check at a single snapshot timestamp across multiple database reads" (§2.2)
- Always reading the latest snapshot would be slow and less available. "such evaluation would require global data synchronization with high-latency round trips and limited availability." (§2.2)
- Zookie protocol step 1: the client asks for a zookie via a content-change check when content is about to be saved, and stores it with the content in the same atomic write. "The client stores the zookie with the content change in an atomic write to the client storage." (§2.2)
- Zookie protocol step 2. "The client sends this zookie in subsequent ACL check requests to ensure that the check snapshot is at least as fresh as the timestamp for the content version." (§2.2)
- At-least-as-fresh gives Zanzibar freedom to pick a timestamp. "The freedom arises from the protocol’s at-least-as-fresh semantics, which allow Zanzibar to choose any timestamp fresher than the one encoded in a zookie." (§2.2)
- Userset rewrites: object-agnostic rules instead of storing a tuple per object. Figure 1: owners are editors, editors are viewers, viewers of the parent folder are viewers of the document. (§2.3.1, Figure 1)
- Three leaf kinds: _this (stored tuples), computed_userset (another relation on the same object), tuple_to_userset (follow a tuple, e.g. parent, and use a relation on that object). Combined with union, intersection and exclusion. (§2.3.1)
- A zookie is opaque on purpose. "We choose to use an opaque cookie instead of the actual timestamp to discourage our clients from choosing arbitrary timestamps and to allow future extensions." (§2.4)
- Without a zookie, reads use a recent snapshot. "If the request doesn’t contain a zookie, Zanzibar will choose a reasonably recent snapshot, possibly offering a lower-latency response than if a zookie were provided." (§2.4.1)
- Read returns stored tuples only, not rewrites; Expand returns the effective userset tree. (§2.4.1, §2.4.5)
- Writes use optimistic concurrency with a per-object lock tuple: read, write with a condition that the lock tuple hasn't changed, retry. (§2.4.2)
- Watch streams tuple changes in timestamp order, for clients that build secondary indexes. (§2.4.3)
- Content-change check. "A content-change check request does not carry a zookie and is evaluated at the latest snapshot." (§2.4.4)
- Expand lets clients build ACL-aware search indexes. "which allows them to build efficient search indices for access-controlled content." (§2.4.5)
- Storage: one Spanner database per namespace, rows keyed by (shard ID, object ID, relation, user, commit timestamp); many versions kept so checks can run at any timestamp inside the GC window. (§3.1.1)
- Every write goes to the tuple table and a changelog shard in one transaction. (§3.1.2)
- Default staleness is chosen from measured out-of-zone read rates and is only a performance choice. "This default staleness mechanism is purely a performance optimization. It does not violate consistency semantics because Zanzibar always respects zookies when provided." (§3.2.1)
- Check evaluation is a boolean expression over tuples, recursive "pointer chasing" through usersets; leaves are evaluated concurrently and cancelled early. (§3.2.3)
- Leopard flattens group-to-group paths so membership becomes a set intersection. "Group membership can be considered as a reachability problem in a graph, where nodes represent groups and users and edges represent direct membership." (§3.2.4)
- Leopard's offline index can't be fresh, so an incremental layer from Watch is merged at query time. (§3.2.4)
- Hot spots were the hardest part. "We found the handling of hot spots to be the most critical frontier in our pursuit of low latency and high availability." (§3.2.5)
- Cache keys include the snapshot timestamp, and timestamps are rounded up to a coarse quantum so checks share cache entries. "We choose evaluation timestamps rounded up to a coarse granularity, such as one or ten seconds, while respecting staleness constraints from request zookies." (§3.2.5)
- A lock table deduplicates concurrent requests for the same cache key (cache stampede). "Among requests sharing the same cache key only one request will begin processing; the rest block until the cache is populated." (§3.2.5)
- Per-client CPU limits, outstanding-RPC limits and per-(object, client) limits isolate clients from each other. (§3.2.6)
- Hedging is used for Spanner and Leopard calls, but not between Zanzibar servers, because check costs vary. (§3.2.7)
- Production numbers from a 7-day sample in 2018: more than 1,500 namespaces, more than 2 trillion tuples near 100 TB, more than 10 million client queries per second; Check peaks around 4.2M QPS, Write 25K. (§4)
- Replication heartbeats every 8 seconds; "Safe" requests have zookies more than 10 s old and are served locally, "Recent" ones often need cross-region trips; Safe requests are about two orders of magnitude more common. (§4.1)
- Check Safe latency peaked at roughly 3, 11, 20 and 93 ms at p50, p95, p99, p99.9 over 7 days. (§4.2)
- Table 2 (means over 7 days): Check Safe p50 3.0 ms, p95 9.46 ms; Check Recent p50 2.86 ms, p95 60.0 ms; Write p50 127.0 ms. (§4.2, Table 2)
- Some clients build RBAC on top. "A number of Zanzibar clients have implemented RBAC policies on top of Zanzibar’s namespace configuration language." (§5)
- Google Cloud IAM is built on Zanzibar. "Google’s Cloud IAM system [5] is built as a layer on top of Zanzibar’s ACL storage and evaluation system." (§5)
- Contrast with TAO: TAO gives eventual global consistency; Zanzibar gives external consistency and bounded-staleness snapshots, which is what stops the new enemy problem. (§5)
- Lamport clocks don't fit because some "processes" are humans or external clients. "Lamport clocks require explicit participation of all “processes”, where in Zanzibar’s use cases some of the “processes” can be external clients or even human users." (§5)
- Tuples are stored normalized, and intermediate results are cached too. "Zanzibar stores its data in normalized forms for consistency. It handles hot spots on normalized data by caching final and intermediate results" (§1)
- The cache is spread over the servers of a cluster with consistent hashing. "Cache entries are distributed across Zanzibar servers with consistent hashing" (§3.2.5)
- Rounding a timestamp up is safe because Spanner waits. "this holds even if T is in the future, in which case the read will wait until TrueTime has moved past T." (§3.2.5)
- Leopard stores sets as ordered integer lists so intersections are cheap. "Index tuples are stored as ordered lists of integers in a structure such as a skip list, thus allowing for efficient union and intersections among sets." (§3.2.4)
- Why checks between Zanzibar servers are not hedged. "Hedging check requests would result in duplicating the most expensive workloads and, ironically, worsening latency." (§3.2.7)
- Writes are the slowest call. "Writes are the least frequently used of all the APIs, and the slowest because they always require distributed coordination among Spanner servers." (§4.2)
- Tuples live in a globally distributed database with external consistency. "storing ACLs in a globally distributed database system with external consistency guarantees" (§1)

## Visuals worth redrawing

- Table 1: example tuples and their meaning.
- Figure 1: namespace config with owner ⊂ editor ⊂ viewer and parent-folder inheritance.
- Figure 2: architecture (aclservers, watchservers, Leopard, Spanner databases).

## My notes

- The paper never gives the default staleness value, only that it's
  adjusted from measurements.
- The 8-second heartbeat and 10-second Safe/Recent cut-off are specific
  to Google's Spanner setup in 2018.

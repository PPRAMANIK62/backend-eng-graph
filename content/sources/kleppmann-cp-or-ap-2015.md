---
id: kleppmann-cp-or-ap-2015
title: "Please stop calling databases CP or AP"
author: Martin Kleppmann
url: https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html
kind: blog
primary: false
---

## Summary

Kleppmann argues that CAP's definitions are so narrow that almost no
real database fits "CP" or "AP". Explains linearizability with a
stale-replica example, walks through the two-datacenter proof, and
shows that single-leader databases, Dynamo-style stores and ZooKeeper
all fail to be cleanly either.

## Key claims

- CAP's consistency is linearizability, unrelated to ACID's C. "Consistency in CAP actually means linearizability, which is a very specific (and very strong) notion of consistency." (CAP uses very narrow definitions)
- Any non-failing node must answer, not just some node. "It’s not sufficient for some node to be able to handle the request: any non-failing node needs to be able to handle it." (CAP uses very narrow definitions)
- Partition tolerance isn't a choice. "The internet and all our datacenters have this property, so you don’t really have any choice in this matter." (CAP uses very narrow definitions)
- CAP's model is one register. "The CAP system model is a single, read-write register – that’s all." (CAP uses very narrow definitions)
- The only fault it considers is a partition. "The only fault considered by the CAP theorem is a network partition (i.e. nodes remain up, but the network between some of them is not working)." (CAP uses very narrow definitions)
- CAP says nothing about latency. "In fact, CAP-available systems are allowed to be arbitrarily slow to respond, and can still be called “available”." (CAP uses very narrow definitions)
- The informal definition of linearizability. "If operation B started after operation A successfully completed, then operation B must see the the system in the same state as it was on completion of operation A, or a newer state." (Linearizability)
- The Alice and Bob example: Bob reloads after hearing Alice, and gets an older result from a lagging replica. "The fact that he got a stale query result is a violation of linearizability." (Linearizability)
- A database can't know its clients' side channels, so it must look like one copy. "if you want to provide linearizable semantics (CAP-consistency) in your database, you need to make it appear as though there is only a single copy of the data, even though there may be copies (replicas, caches) of the data in multiple places." (Linearizability)
- CPUs need barriers for it. "On modern CPUs, you need to use an explicit memory barrier instruction in order to get linearizability." (Linearizability)
- The two-datacenter proof is the whole proof. "And this, by the way, is essentially the proof of the CAP theorem." (CAP-Availability)
- Choosing linearizability doesn't mean an outage. "If you can shift all clients to using the leader datacenter, the clients will in fact see no downtime at all." (CAP-Availability)
- Async multi-datacenter replication is usually about latency. "However, the reason for that choice is often the latency of wide-area networks, not just wanting to tolerate datacenter and network failures." (CAP-Availability)
- Single-leader replication isn't CAP-available. "the fact that it cannot write means any single-leader setup is not CAP-available." (Many systems are neither linearizable nor CAP-available)
- Reading from async followers isn't linearizable. "In this case, your reads will not be linearizable, i.e. not CAP-consistent." (Many systems are neither linearizable nor CAP-available)
- Snapshot isolation databases aren't linearizable on purpose. "For example, PostgreSQL’s SSI provides serializability but not linearizability, and Oracle provides neither." (Many systems are neither linearizable nor CAP-available)
- Quorum stores: R=W=1 is CAP-available, quorum operations aren't. "If you accept a single replica for reads and writes (R=W=1), they are indeed CAP-available." (Many systems are neither linearizable nor CAP-available)
- Quorums don't reliably give linearizability. "You sometimes see people claiming that quorum reads and writes guarantee linearizability, but I think it would be unwise to rely on it" (Many systems are neither linearizable nor CAP-available)
- ZooKeeper reads aren't linearizable by default. "ZooKeeper by default does not provide linearizable reads." (Case study: ZooKeeper)
- A sync before the read makes it linearizable. "It is possible to make linearizable reads in ZooKeeper by preceding a read with a sync command." (Case study: ZooKeeper)
- ZooKeeper 3.4.0's read-only mode is CAP-available for reads. "To add to the fun, ZooKeeper 3.4.0 added a read-only mode, in which nodes on the minority side of a partition can continue serving read requests – no quorum needed!" (Case study: ZooKeeper)
- One piece of software has operations with different guarantees. "Within one piece of software, you may well have various operations with different consistency characteristics." (CP/AP: a false dichotomy)
- ZooKeeper needs a majority to process writes. "ZK requires a majority quorum in order to reach consensus, i.e. in order to process writes." (Case study: ZooKeeper)
- MVCC databases skip linearizability on purpose, for concurrency. "Moreover, databases with snapshot isolation/MVCC are intentionally non-linearizable, because enforcing linearizability would reduce the level of concurrency that the database can offer." (Many systems are neither linearizable nor CAP-available)
- Sloppy quorums and read repair are where quorum edge cases come from. "subtle combinations of features such as sloppy quorums and read repair can lead to tricky edge cases" (Many systems are neither linearizable nor CAP-available)
- An uptime SLA says nothing about CAP-availability. "Your application’s availability is probably measured with some SLA (e.g. 99.9% of well-formed requests must return a successful response within 1 second), but such an SLA can be met both with CAP-available and CAP-unavailable systems." (CAP-Availability)
- Changing the words breaks the theorem. "Unfortunately, if the meaning of the words is changed, the CAP theorem no longer applies, and thus the CP/AP distinction is rendered completely meaningless." (CP/AP: a false dichotomy)
- A ZooKeeper read sees only the server the client is connected to. "Each client is connected to one of the server nodes, and when you make a read, you see only the data on that node, even if there are more up-to-date writes on another node." (Case study: ZooKeeper)

## Visuals worth redrawing

- The Alice and Bob diagram (a lagging follower returns an older
  result to a request that started after another client saw the newer
  one). The two-datacenter partition diagram.

## My notes

- Written in 2015; ZooKeeper details are as of 3.4.

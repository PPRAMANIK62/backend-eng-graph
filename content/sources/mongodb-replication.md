---
id: mongodb-replication
title: "Replication (MongoDB Database Manual)"
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/replication/
kind: docs
primary: true
---

## Summary

The overview page for MongoDB replica sets (the current manual, MongoDB
8.0 era). One primary takes every write and logs it in the oplog;
secondaries copy and apply the oplog asynchronously; an election picks
a new primary when the old one goes quiet. Also covers why replicate,
replication lag, flow control and reads from secondaries.

## Key claims

- Why: redundancy and surviving the loss of a server. "Replication provides redundancy and data availability, maintaining multiple copies of data across database servers to tolerate the loss of any single server." (Redundancy and Data Availability)
- More reads, locality, and copies for DR, reporting or backup. "Maintaining copies of data in different data centers can increase data locality and availability for distributed applications." (Redundancy and Data Availability)
- One primary receives all writes. "The primary node receives all write operations." (Replication in MongoDB)
- Another node can briefly think it's primary too. "although in some circumstances, another mongod instance may transiently believe itself to also be primary." (Replication in MongoDB)
- The primary records changes in the oplog. "The primary records all changes to its data sets in its operation log, that is, the oplog." (Replication in MongoDB)
- Secondaries apply it asynchronously. "Secondaries replicate the primary's oplog and apply the operations to their data sets asynchronously." (Asynchronous Replication)
- Replication lag defined. "Replication lag is a delay between an operation on the primary and the application of that operation from the oplog to the secondary." (Replication Lag and Flow Control)
- Lag hurts the primary too. "Some small delay period may be acceptable, but significant problems emerge as replication lag grows, including building cache pressure on the primary." (Replication Lag and Flow Control)
- Flow control slows the primary's writes to keep lag under a target. "Administrators can limit the rate at which the primary applies its writes with the goal of keeping the majority committed lag under a configurable maximum value flowControlTargetLagSeconds." (Replication Lag and Flow Control)
- Election after 10 seconds of silence by default. "When a primary does not communicate with the other members of the set for more than the configured electionTimeoutMillis period (10 seconds by default), an eligible secondary calls for an election to nominate itself as the new primary." (Automatic Failover)
- Typical failover time. "The median time before a cluster elects a new primary should not typically exceed 12 seconds, assuming default replica configuration settings." (Automatic Failover)
- Faster detection means more false elections and more w:1 rollbacks. "This can result in increased rollbacks for w : 1 write operations." (Automatic Failover)
- Reads from secondaries can be stale. "Asynchronous replication to secondaries means that reads from secondaries may return data that does not reflect the state of the data on the primary." (Read Operations)

## Visuals worth redrawing

None.

## My notes

- Section headings are as they appear on the page when this was read;
  the MongoDB docs move pages around between versions.

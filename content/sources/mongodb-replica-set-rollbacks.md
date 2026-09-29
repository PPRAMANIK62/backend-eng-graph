---
id: mongodb-replica-set-rollbacks
title: "Rollbacks During Replica Set Failover (MongoDB manual)"
author: MongoDB, Inc.
url: https://www.mongodb.com/docs/manual/core/replica-set-rollbacks/
kind: docs
primary: true
---

## Summary

The MongoDB 8.0 manual on rollback: when an old primary rejoins after a
failover, it undoes writes that never reached the rest of the set and
saves them to files. Explains when it happens and how majority write
concern keeps acknowledged writes from being rolled back.

## Key claims

- What a rollback is. "A rollback reverts write operations on a former primary when the member rejoins its replica set after a failover." (intro)
- When it's needed. "A rollback is necessary only if the primary had accepted write operations that the secondaries had not successfully replicated before the primary stepped down." (intro)
- Usually after a network partition. "When a rollback does occur, it is often the result of a network partition." (intro)
- Lagging secondaries make it bigger. "Secondaries that can not keep up with the throughput of operations on the former primary, increase the size and impact of the rollback." (intro)
- The undone writes are kept in files for a human. "By default, when a rollback occurs, MongoDB writes the rollback data to BSON files." (Rollback Data)
- w: 1 only means the primary has it. "write concern { w: 1 } only provides acknowledgment of write operations on the primary" (Avoid Replica Set Rollbacks)
- Majority write concern is the default since MongoDB 5.0. "is the default write concern for most MongoDB deployments." (Journaling and Write Concern majority)
- Readers can see writes that later get rolled back. "can read data which may be subsequently rolled back during replica set failovers." (Visibility of Data That Can Be Rolled Back)
- Majority write concern plus journaling prevents rollback of acknowledged writes. "To prevent rollbacks of data that have been acknowledged to the client, run all voting members with journaling enabled" (Journaling and Write Concern majority)
- No rollback if the write reached a member that stays with the majority. "A rollback does not occur if the write operations replicate to another member of the replica set before the primary steps down and if that member remains available and accessible to a majority of the replica set." (intro)
- The version where majority became the default. "Starting in MongoDB 5.0, { w: "majority" } is the default write concern for most MongoDB deployments." (Journaling and Write Concern majority)

## Visuals worth redrawing

None.

## My notes

- Same shape as the Redis Sentinel case, except MongoDB saves the
  discarded writes to files instead of dropping them.

---
id: redis-sentinel
title: "High availability with Redis Sentinel"
author: Redis
url: https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/
kind: docs
primary: true
---

## Summary

The Redis docs for Sentinel, the group of processes that watches a Redis
primary, agrees it's down, elects one Sentinel to run the failover and
promotes a replica. Frank about lost writes: with asynchronous
replication, acknowledged writes can be lost on failover, and a primary
cut off with some clients keeps taking writes that are later thrown
away.

## Key claims

- Acknowledged writes aren't guaranteed to survive a failover. "Sentinel + Redis distributed system does not guarantee that acknowledged writes are retained during failures, since Redis uses asynchronous replication." (Fundamental things to know)
- The quorum setting only covers detection. "However the quorum is only used to detect the failure." (Configuring Sentinel)
- Running the failover needs a majority of Sentinels. "In practical terms this means during failures Sentinel never starts a failover if the majority of Sentinel processes are unable to talk (aka no failover in the minority partition)." (Configuring Sentinel)
- Two Sentinels are never enough. "Sentinels always need to talk with the majority in order to start a failover." (Example Sentinel deployments)
- Without agreement you get two primaries for good. "Clients may write indefinitely to both sides, and there is no way to understand when the partition heals what configuration is the right one, in order to prevent a permanent split brain condition." (Example 1)
- Asynchronous replication always risks losing acknowledged writes. "In every Sentinel setup, as Redis uses asynchronous replication, there is always the risk of losing some writes because a given acknowledged write may not be able to reach the replica which is promoted to master." (Example 2)
- The old primary's writes during a partition are discarded when it rejoins. "This data will be lost forever since when the partition will heal, the master will be reconfigured as a replica of the new master, discarding its data set." (Example 2)
- min-replicas-to-write makes a cut-off primary stop taking writes. "a Redis instance, when acting as a master, will stop accepting writes if it can't write to at least 1 replica." (Example 2)
- With a 10-second max lag, it stops after 10 seconds. "Using this configuration, the old Redis master M1 in the above example, will become unavailable after 10 seconds." (Example 2)
- A Sentinel marks a server down on its own after a timeout. "an SDOWN condition is reached when it does not receive a valid reply to PING requests for the number of seconds specified in the configuration as is-master-down-after-milliseconds parameter." (SDOWN and ODOWN failure state)
- Replicas with the same priority are ranked by how much data they have. "If the priority is the same, the replication offset processed by the replica is checked, and the replica that received more data from the master is selected." (Replica selection and priority)
- Each failover gets a unique epoch. "When a Sentinel is authorized, it gets a unique configuration epoch for the master it is failing over." (Configuration epochs)
- Higher epoch wins. "Because every configuration has a different version number, the greater version always wins over smaller versions." (Configuration propagation)
- A returning old primary is turned into a replica. "Masters failed over are reconfigured as replicas when they return available." (Sentinel reconfiguration of instances outside the failover procedure)
- Priority is checked first, and lower wins. "the replicas are sorted by replica-priority as configured in the redis.conf file of the Redis instance. A lower priority will be preferred." (Replica selection and priority)
- The docs refuse to show two-Sentinel setups. "Note that we will never show setups where just two Sentinels are used" (Example Sentinel deployments)

## Visuals worth redrawing

- Example 2: three boxes, each with Redis and a Sentinel; a partition
  cuts off the old master M1 with client C1, whose writes are lost.

## My notes

- The configuration epoch is the same idea as a term or a fencing token:
  a number that only goes up, so the newest decision wins.

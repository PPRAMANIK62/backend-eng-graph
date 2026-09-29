---
id: postgres-different-replication-solutions
title: "PostgreSQL documentation, 26.1. Comparison of Different Solutions"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/different-replication-solutions.html
kind: docs
primary: true
---

## Summary

The manual's tour of ways to keep several Postgres servers in step (read
at version 18): shared disk, block-device mirroring, WAL shipping,
logical replication, trigger-based, SQL middleware, and asynchronous and
synchronous multimaster, with a feature table. Good for "what exactly
gets copied" and the price of each choice.

## Key claims

- WAL shipping keeps standbys current from the log, for the whole server only. "Warm and hot standby servers can be kept current by reading a stream of write-ahead log (WAL) records." / "This can be synchronous or asynchronous and can only be done for the entire database server." (Write-Ahead Log Shipping)
- Logical replication builds a row-change stream from the WAL, per table, and can flow both ways. "Logical replication allows replication of data changes on a per-table basis." (Logical Replication)
- Broadcasting SQL statements makes non-deterministic functions differ per server. "If queries are simply broadcast unmodified, functions like random(), CURRENT_TIMESTAMP, and sequences can have different values on different servers." (SQL-Based Replication Middleware)
- Asynchronous multimaster suits servers that are far apart or not always connected. "For servers that are not regularly connected or have slow communication links, like laptops or remote servers, keeping data consistent among servers is a challenge." (Asynchronous Multimaster Replication)
- Asynchronous multimaster needs conflict resolution. "The conflicts can be resolved by users or conflict resolution rules." (Asynchronous Multimaster Replication)
- Synchronous multimaster: any server takes writes, but heavy writes hurt. "Heavy write activity can cause excessive locking and commit delays, leading to poor performance." (Synchronous Multimaster Replication)
- Postgres doesn't offer synchronous multimaster itself. "PostgreSQL does not offer this type of replication" (Synchronous Multimaster Replication)
- Trigger-based async replication can lose data on failover. "Because it updates the standby server asynchronously (in batches), there is possible data loss during fail over." (Trigger-Based Primary-Standby Replication)
- Block-device mirroring must keep write order. "writes to the standby must be done in the same order as those on the primary." (File System (Block Device) Replication)
- Data partitioning is a different tool: each set is modified by one server. "Data partitioning splits tables into data sets. Each set can be modified by only one server." (Data Partitioning)
- In table 26.1, WAL shipping never loses data on primary failure only with synchronous replication on, and avoids waiting for other servers only with it off. "with sync on" (Table 26.1, rows "Primary failure will never lose data" and "No waiting for multiple servers")

## Visuals worth redrawing

- Table 26.1, the feature matrix. Too wide for a figure; the article
  describes the families in words.

## My notes

None.

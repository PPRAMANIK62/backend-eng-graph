---
id: mysql-replication
title: "MySQL 8.4 Reference Manual, Chapter 19 Replication"
author: Oracle Corporation
url: https://dev.mysql.com/doc/refman/8.4/en/replication.html
kind: docs
primary: true
---

## Summary

The front page of MySQL's replication chapter (MySQL 8.4). A source
server copied to replicas, asynchronous by default, and the four reasons
it lists for doing it. Opened with WebFetch because curl got an error
page from dev.mysql.com; quotes are as WebFetch returned them.

## Key claims

- What it is. "Replication enables data from one MySQL database server (known as a source) to be copied to one or more MySQL database servers (known as replicas)." (chapter intro)
- Asynchronous by default, and replicas can be disconnected. "Replication is asynchronous by default; replicas do not need to be connected permanently to receive updates from a source." (chapter intro)
- Scale-out: writes on the source, reads spread over replicas. "In this environment, all writes and updates must take place on the source server. Reads, however, may take place on one or more replicas." (advantages, scale-out)
- Backups can run on a replica. "because the replica can pause the replication process, it is possible to run backup services on the replica without corrupting the corresponding source data." (advantages, data security)
- Analytics on a replica spares the source. "live data can be created on the source, while the analysis of the information can take place on the replica without affecting the performance of the source." (advantages, analytics)
- A local copy for a remote site. "you can use replication to create a local copy of data for a remote site to use, without permanent access to the source." (advantages, long-distance data distribution)

## Visuals worth redrawing

None.

## My notes

- "Backups on a replica" is about taking the backup somewhere else, not
  about the replica being a backup.

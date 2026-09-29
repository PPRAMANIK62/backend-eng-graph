---
id: postgres-high-availability
title: "PostgreSQL documentation, Chapter 26. High Availability, Load Balancing, and Replication"
author: The PostgreSQL Global Development Group
url: https://www.postgresql.org/docs/current/high-availability.html
kind: docs
primary: true
---

## Summary

The introduction to the manual's replication chapter (read at version
18). Why read-only servers are easy to combine and read/write servers
are not, the words primary, standby, warm and hot standby, and the
synchronous vs asynchronous trade in one paragraph each.

## Key claims

- Read-only copies are easy; writes are the hard part. "read-only database servers can be combined relatively easily too. Unfortunately, most database servers have a read/write mix of requests, and read/write servers are much harder to combine." (chapter intro)
- Every server has to learn about every write, and that is the core problem. "This synchronization problem is the fundamental difficulty for servers working together." (chapter intro)
- One family lets only one server change data. "Some solutions deal with synchronization by allowing only one server to modify the data." (chapter intro)
- Names: primary and standby, warm and hot. "A standby server that cannot be connected to until it is promoted to a primary server is called a warm standby server, and one that can accept connections and serves read-only queries is called a hot standby server." (chapter intro)
- Synchronous: not committed until all servers commit, so failover loses nothing. "This guarantees that a failover will not lose any data and that all load-balanced servers will return consistent results no matter which server is queried." (chapter intro)
- Asynchronous: some delay, so possible loss and stale reads. "opening the possibility that some transactions might be lost in the switch to a backup server, and that load balanced servers might return slightly stale results." (chapter intro)
- Async is used when sync is too slow. "Asynchronous communication is used when synchronous would be too slow." (chapter intro)
- The cost of full synchrony over a slow link. "For example, a fully synchronous solution over a slow network might cut performance by more than half, while an asynchronous one might have a minimal performance impact." (chapter intro)

## Visuals worth redrawing

None.

## My notes

- Section 26.1 (postgres-different-replication-solutions) has the full
  comparison table.

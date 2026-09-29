---
id: etcd-api
title: etcd API (central design overview)
author: etcd authors
url: https://etcd.io/docs/v3.6/learning/api/
kind: docs
primary: true
---

## Summary

The etcd v3.6 overview of its gRPC API: the KV, Watch and Lease services,
the response header (revision, Raft term), per-key revisions, and how
leases are granted, kept alive and tied to keys.

## Key claims

- The store revision is a 64-bit cluster-wide counter bumped on every change. "etcd maintains a 64-bit cluster-wide counter, the store revision, that is incremented each time the key space is modified." (Revisions)
- It works as a logical clock over all updates. "The revision serves as a global logical clock, sequentially ordering all updates to the store." (Revisions)
- Each key carries create_revision and mod_revision; the lock client waits on create_revision. "The etcd client's distributed shared locks use the creation revision to wait for lock ownership." (Key-Value pair)
- Every response carries the Raft term, which shows when a new leader was elected. "Applications can use raft_term to detect when the cluster completes a new leader election." (Response header)
- Leases detect client liveness. "Leases are a mechanism for detecting client liveness." (Lease API)
- A lease expires without keepAlives. "A lease expires if the etcd cluster does not receive a keepAlive within a given TTL period." (Lease API)
- Keys attached to an expired or revoked lease are deleted. "When a lease expires or is revoked, all keys attached to that lease will be deleted." (Lease API)
- The TTL a client asks for is advisory; the server picks the actual one. "TTL - the advisory time-to-live, in seconds." (Obtaining leases)
- Keep-alives go over a bidirectional stream. "Leases are refreshed using a bi-directional stream created with the LeaseKeepAlive API call." (Keep alives)

## Visuals worth redrawing

None.

## My notes

- The lock and election RPCs themselves live in the concurrency API,
  not on this page.

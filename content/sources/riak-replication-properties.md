---
id: riak-replication-properties
title: "Replication Properties (Riak KV docs)"
author: Basho Technologies (Riak KV docs)
url: https://docs.riak.com/riak/kv/latest/developing/app-guide/replication-properties/index.html
kind: docs
primary: true
---

## Summary

The Riak KV 2.2.3 guide to N, R, W and their relatives: PR and PW
(primary replicas only), DW (written to disk), notfound_ok, and what
"quorum" means. It names the sloppy quorum that Riak uses by default and
the strict quorum you get by setting PR or PW.

## Key claims

- N defaults to 3. "The default n_val in Riak is 3, which means that data stored in a bucket with the default N will be replicated to three different nodes" (Number of replicas)
- Sloppy quorum: when primaries fail, fallback nodes take the read or write. "Riak will attempt reads and writes to primary vnodes first, but in case of failure, those operations will go to failover nodes in order to comply with the R and W values that you have set. This failover option is called sloppy quorum." (Primary reads and writes with PR and PW)
- PR/PW make it strict. "Setting PR and/or PW to non-zero values produces a mode of operation called strict quorum." (Primary reads and writes with PR and PW)
- A write reported as failed may still have landed on some replicas. "But this does not necessarily mean that the write has failed completely." (Primary reads and writes with PR and PW)
- W says nothing about disk. "What they do not specify is whether data has actually been written to disk in the storage backend." (Durable writes with DW)
- By default a not-found from the first replica is trusted. "If notfound_ok is set to true (the default value) and the first vnode to respond doesn’t have a copy of the object, Riak will assume that the missing value is authoritative and immediately return a not found result to the client." (The implications of notfound_ok)
- Quorum is a majority. "A quorum of nodes is calculated as floor(N/2) + 1" (The implications of notfound_ok)
- R and W default to a majority. "r R quorum The number of servers that must respond to a read request w W quorum Number of servers that must respond to a write request" (Available parameters table)

## Visuals worth redrawing

None.

## My notes

- Default table: r and w are "quorum", pr and pw are 0, so out of the
  box Riak runs sloppy quorums.
- The "latest" URL serves the 2.2.3 docs. Use it for the design, and
  check a current release before quoting defaults as today's.

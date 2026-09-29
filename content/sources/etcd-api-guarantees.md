---
id: etcd-api-guarantees
title: "KV API guarantees (etcd v3.6 docs)"
author: etcd authors
url: https://etcd.io/docs/v3.6/learning/api_guarantees/
kind: docs
primary: true
---

## Summary

etcd's statement of what its key-value API guarantees (v3.6 docs):
durability and strict serializability for KV calls, linearizability
by default with an opt-in "serializable" read mode that may be stale.

## Key claims

- KV calls are durable and strictly serializable. "etcd ensures durability and strict serializability for all KV api calls." (KV APIs)
- Total order in real time, through the revision. "KV Service operations are atomic and occur in a total order, consistent with real-time order of those operations." (Strict serializability)
- The read example: a read started after a completed write must see it. "A client issuing a read at t2 (for t2 > t1) should receive a value at least as recent as the previous write, completed at t1." (Linearizability)
- Linearizable by default, and it costs a Raft round. "Linearizability comes with a cost, however, because linearized requests must go through the Raft consensus process." (Linearizability)
- Serializable reads are faster and may be stale. "To obtain lower latencies and higher throughput for read requests, clients can configure a request’s consistency mode to serializable, which may access stale data with respect to quorum, but removes the performance penalty of linearized accesses’ reliance on live consensus." (Linearizability)
- Linearizable is the default. "etcd ensures linearizability for all other operations by default." (Linearizability; "other" means other than watch)

## Visuals worth redrawing

None.

## My notes

- etcd's "serializable" read mode means a local, possibly stale read,
  not serializability in the transaction sense. The naming is confusing.

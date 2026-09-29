---
id: elastic-reading-writing-documents
title: Reading and writing documents (Elasticsearch docs)
author: Elastic
url: https://www.elastic.co/docs/deploy-manage/distributed-architecture/reading-and-writing-documents
kind: docs
primary: true
---

## Summary

Elastic's description of its replication model: primary-backup, based
on Microsoft's PacificA. Writes are routed by document ID to one
shard's primary, which replicates to an in-sync set. Searches go to a
coordinating node that fans out to one copy of every relevant shard and
merges the results, returning partial results if some shards fail.

## Key claims

- Primary-backup, after PacificA. "Elasticsearch's data replication model is based on the primary-backup model and is described very well in the PacificA paper of Microsoft Research." (Introduction)
- Writes are routed by document ID. "Every indexing operation in Elasticsearch is first resolved to a replication group using routing, typically based on the document ID." (Basic write model)
- The primary waits for all in-sync replicas before acknowledging. "Once all in-sync replicas have successfully performed the operation and responded to the primary, the primary acknowledges the successful completion of the request to the client." (Basic write model)
- A search usually touches many shards. "Note that since most searches will be sent to one or more indices, they typically need to read from multiple shards, each representing a different subset of the data." (Basic read model)
- One copy of each shard answers; the coordinating node merges. "When a read request is received by a node, that node is responsible for forwarding it to the nodes that hold the relevant shards, collating the responses, and responding to the client." (Basic read model)
- Replica chosen adaptively. "By default, Elasticsearch uses adaptive replica selection to select the shard copies." (Basic read model)
- Partial results come back as 200 OK. "Responses containing partial results still provide a 200 OK HTTP status code." (Shard failures)
- A slow shard slows the group. "Because the primary waits for all replicas in the in-sync copies set during each operation, a single slow shard can slow down the entire replication group." (Failures)
- A slow shard also slows searches routed to it. "Of course a single slow shard will also slow down unlucky searches that have been routed to it." (Failures)
- An isolated primary can expose unacknowledged writes. "An isolated primary can expose writes that will not be acknowledged." (Failures, Dirty reads)
- Any one in-sync copy can serve a read. "As such, a single in-sync copy is sufficient to serve read requests." (Basic read model)
- On a shard failure the coordinator tries another copy. "When a shard fails to respond to a read request, the coordinating node sends the request to another shard copy in the same replication group." (Shard failures)
- Failed shards are reported in the response. "Shard failures are indicated by the timed_out and _shards fields of the response header." (Shard failures)
- A read can see a write before it's acknowledged. "Since the primary first indexes locally and then replicates the request, it is possible for a concurrent read to already see the change before it has been acknowledged." (A few simple implications)

## Visuals worth redrawing

- Basic write model diagram. Not redrawn.

## My notes

- Links to Elastic's resiliency status page for known bugs; not read.

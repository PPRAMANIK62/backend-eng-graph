---
id: kubernetes-api-concepts
title: Kubernetes API Concepts
author: Kubernetes documentation
url: https://kubernetes.io/docs/reference/using-api/api-concepts/
kind: docs
primary: true
---

## Summary

The reference for how clients use the Kubernetes API (docs for
Kubernetes 1.37). The parts used here: every object has a
resourceVersion, clients list then watch from that version to get a
stream of changes, the history is short so watches can fail with 410
Gone, and updates that carry a stale resourceVersion get 409 Conflict.

## Key claims

- Watch is a stream of changes. "in the Kubernetes API, watch is a verb that is used to track changes to an object in Kubernetes as a stream." (Efficient detection of changes)
- Every object has a resourceVersion. "every Kubernetes object has a resourceVersion field representing the version of that resource as stored in the underlying persistence layer." (Efficient detection of changes)
- List then watch, without missing events. "The overall watch mechanism allows a client to fetch the current state and then subscribe to subsequent changes, without missing any events." (Efficient detection of changes)
- History is short: 5 minutes by default with etcd 3. "Clusters using etcd 3 preserve changes in the last 5 minutes by default." (Efficient detection of changes)
- When history is gone, clients get 410 and must re-list. "clients must handle the case by recognizing the status code 410 Gone, clearing their local cache, performing a new get or list operation, and starting the watch from the resourceVersion that was returned." (Efficient detection of changes)
- Client libraries wrap list-then-watch (the Go Reflector). "In the Go client library, this is called a Reflector and is located in the k8s.io/client-go/tools/cache package." (Efficient detection of changes)
- Listing big collections is expensive for the control plane. "On large clusters, retrieving the collection of some resource types may result in a significant increase of resource usage (primarily RAM) on the control plane." (Streaming lists)
- Stale writes are rejected with 409. "In the event that the resource has changed (the resourceVersion the client provided is stale), the API server returns a 409 Conflict error response." (Updates to existing resources)
- The server detects conflicts, the client must retry. "Kubernetes always detects the conflict, but you as the client author need to implement retries." (Update mechanism choice)

## Visuals worth redrawing

- The list, watch, 410, re-list cycle as a small timeline.

## My notes

- resourceVersion is optimistic concurrency, same idea as Omega's store
  (burns-borg-omega-kubernetes-2016).

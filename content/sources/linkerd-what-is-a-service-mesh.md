---
id: linkerd-what-is-a-service-mesh
title: "What is a service mesh?"
author: Linkerd project
url: https://linkerd.io/what-is-a-service-mesh/
kind: docs
primary: true
---

## Summary

The Linkerd project's explainer (docs for Linkerd 2.20). Linkerd calls
itself the first service mesh project. Defines a mesh, walks one request through Linkerd's proxy
step by step (routing, load balancing, mTLS, retries only if idempotent
and within a retry budget, metrics), and traces the idea back to RPC
libraries like Finagle, Hystrix and Stubby.

## Key claims

- Definition. "A service mesh like Linkerd is a tool for adding observability, security, and reliability features to applications by inserting these features at the platform layer rather than the application layer." (Service mesh in a nutshell)
- Proxies next to the app form the data plane; a control plane controls them. "The proxies comprise the service mesh’s data plane, and are controlled as a whole by its control plane." (Service mesh in a nutshell)
- One request's steps: dynamic routing (local or remote cluster, current version or canary), picking the instance likely to answer fastest from Kubernetes discovery data, reusing or opening an mTLS connection, then sending. (What does a service mesh actually do?, steps 1-3)
- It may upgrade HTTP/1.1 to HTTP/2 between proxies. "Even if the communication is happening over HTTP/1.1, Linkerd may automatically establish an HTTP/2 connection to the proxy on the remote side in order to multiplex requests across a single connection." (step 3)
- Retries only for idempotent requests and within a budget. "Linkerd retries the request on another instance—but only if it knows the request is idempotent and the retry budget is available." (step 4)
- Instances that keep failing are evicted from the pool. "If an instance is consistently returning errors, Linkerd evicts it from the load balancing pool, to be retried later." (step 4)
- The app doesn't need to know the mesh is there. "the application doesn’t need to implement these features, or even to be aware that the service mesh is there!" (Why do I need a service mesh?)
- Off Kubernetes, the cost rises fast. "Without these underlying features from Kubernetes, the cost of service mesh adoption starts increasing rapidly." (Why do I need a service mesh?)
- History: libraries first. "These systems solved this complexity by adopting a generalized communication layer , usually in the form of a library—Twitter’s Finagle, Netflix’s Hystrix, and Google’s Stubby being cases in point." (Where did the service mesh come from?)
- The mesh binds these features at runtime, not compile time. "rather than binding service mesh functionality at compile time, we can bind it at runtime, allowing us to completely decouple these platform-level features from the application itself." (Where did the service mesh come from?)
- Linkerd was admitted to the CNCF in 2017 and rewritten with Rust proxies in 2018. "rewritten to use Rust micro-proxies in 2018" (intro)

## Visuals worth redrawing

None.

## My notes

- Written by the makers of a mesh, so it argues for meshes; the cost
  side is only the Kubernetes caveat. No byline on the page.

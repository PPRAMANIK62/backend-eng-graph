---
id: envoy-life-of-a-request
title: Life of a Request
author: Envoy Project Authors
url: https://www.envoyproxy.io/docs/envoy/latest/intro/life_of_a_request
kind: docs
primary: true
---

## Summary

Envoy's walk-through of one HTTP/2 request over TLS through the proxy
(docs for Envoy 1.40.0-dev when read): the vocabulary (downstream,
upstream, cluster, endpoint, listener, filter), the threading model,
and each step from accept to response.

## Key claims

- Downstream is whoever connects to Envoy. "Downstream: an entity connecting to Envoy." (Terminology)
- Upstream is what Envoy connects to when forwarding. "Upstream: an endpoint (network node) that Envoy connects to when forwarding requests for a service." (Terminology)
- A cluster is a logical service with a set of endpoints. "Cluster: a logical service with a set of endpoints that Envoy forwards requests to." (Terminology)
- Envoy started as a service mesh sidecar, and is also used as an edge and internal proxy. "Envoy originated as a service mesh sidecar proxy, factoring out load balancing, routing, observability, security and discovery services from applications." (Network topology)
- A request may cross several proxies. "A request path may traverse multiple Envoys." (Network topology)
- Two halves: the listener subsystem (downstream) and the cluster subsystem (upstream), bridged by the router filter. "The two subsystems are bridged with the HTTP router filter, which forwards the HTTP request from downstream to upstream." (High level architecture)
- The cluster side holds health, load balancing and pooling. "This is where knowledge of cluster and endpoint health, load balancing and connection pooling exists." (High level architecture)
- One downstream connection stays on one worker thread. "any given downstream TCP connection (including all the multiplexed streams on it) will be handled by exactly one worker thread for its lifetime." (High level architecture)
- Each worker has its own upstream connection pool. "Each worker thread maintains its own pool of TCP connections to upstream endpoints." (High level architecture)
- The TLS transport socket decrypts before HTTP parsing. "On network reads, the TLS transport socket decrypts the data read from the TCP connection to a decrypted data stream for further processing." (Request flow, Overview)
- The router picks a route and cluster, then load balancing picks an endpoint and a new upstream connection is made only if the pool lacks one. "A new connection to the endpoint is created if the endpoint’s connection pool is empty or lacks capacity." (Request flow, Overview)
- Responses go back through the filters in reverse. "The response passes through the HTTP filters in the opposite order from the request" (Request flow, Overview)
- Listeners can be draining: no new connections, existing ones continue. "Draining: the listener no longer accepts new TCP connections while its existing TCP connections are allowed to continue for a drain period." (1. Listener TCP accept)

## Visuals worth redrawing

- The listener subsystem / router filter / cluster subsystem diagram
  (High level architecture).

## My notes

- Envoy's docs track "latest"; pin the version when citing.

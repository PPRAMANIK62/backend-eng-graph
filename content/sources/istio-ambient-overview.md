---
id: istio-ambient-overview
title: Istio ambient mode overview
author: Istio project
url: https://istio.io/latest/docs/ambient/overview/
kind: docs
primary: true
---

## Summary

Istio's page on ambient mode (docs for Istio 1.31): a data plane with no
sidecars, split into a per-node L4 proxy (ztunnel) for mTLS and L4
policy, and optional per-namespace L7 "waypoint" proxies (Envoy) for
HTTP features.

## Key claims

- The layout. "In ambient mode, Istio implements its features using a per-node Layer 4 (L4) proxy, and optionally a per-namespace Layer 7 (L7) proxy." (intro)
- Informally, "sidecar-less". "Since workload pods no longer require proxies running in sidecars in order to participate in the mesh, ambient mode is often informally referred to as “sidecar-less mesh”." (intro)
- Two layers: ztunnel below, waypoints above when needed. "At the base, the ztunnel secure overlay handles routing and zero trust security for traffic." (How it works)
- ztunnel is Rust, L3/L4 only, no HTTP parsing. "Ztunnel does not terminate workload HTTP traffic or parse workload HTTP headers." (ztunnel)
- ztunnel handles mTLS, authentication, L4 authorization, telemetry. "The ztunnel proxy is written in Rust and is intentionally scoped to handle L3 and L4 functions such as mTLS, authentication, L4 authorization and telemetry." (ztunnel)
- The tunnel protocol is HBONE, based on HTTP CONNECT. "At the transport layer, this is implemented via an HTTP CONNECT-based traffic tunneling protocol called HBONE." (ztunnel)
- Waypoints are Envoy, outside the app pods, scaled on their own. "Waypoint proxies run outside of application pods. They are installed, upgraded, and scale independently from applications." (Waypoint proxies)
- Sidecar and ambient pods can share a mesh. "Pods and workloads using sidecar mode can co-exist within the same mesh as pods that use ambient mode." (intro)
- Some uses need only the L4 overlay; L7 features need a waypoint. "Some use cases of Istio in ambient mode may be addressed solely via the L4 secure overlay features, and will not need L7 features, thereby not requiring deployment of a waypoint proxy." (Waypoint proxies)
- Waypoints are heavier than ztunnel alone. "Waypoint proxies, while heavier than the ztunnel overlay alone, still run as an ambient component of the infrastructure, requiring no modifications to application pods." (How it works)

## Visuals worth redrawing

- Ambient layers (ztunnel per node, waypoint per namespace). Redrawn in
  `service-mesh`.

## My notes

- The page doesn't give resource numbers comparing sidecar and ambient.
  Leave cost numbers out.

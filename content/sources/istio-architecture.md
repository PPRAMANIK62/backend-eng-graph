---
id: istio-architecture
title: Istio architecture
author: Istio project
url: https://istio.io/latest/docs/ops/deployment/architecture/
kind: docs
primary: true
---

## Summary

Istio's own description of its design, read when Istio 1.31 was the
current docs version: a data plane of Envoy proxies deployed as sidecars
that carry all traffic between services, and a control plane (istiod)
that configures them, does service discovery and issues certificates for
mTLS.

## Key claims

- Two planes. "An Istio service mesh is logically split into a data plane and a control plane." (intro)
- The data plane is Envoy sidecars that carry all service-to-service traffic and report telemetry. "These proxies mediate and control all network communication between microservices. They also collect and report telemetry on all mesh traffic." (intro)
- The control plane configures the proxies. "The control plane manages and configures the proxies to route traffic." (intro)
- Only the proxies touch the traffic. "Envoy proxies are the only Istio components that interact with data plane traffic." (Envoy)
- Sidecars add features without code changes. "The sidecar proxy model also allows you to add Istio capabilities to an existing deployment without requiring you to rearchitect or rewrite code." (Envoy)
- Features include retries, failovers, circuit breakers and fault injection. "Network resiliency features: setup retries, failovers, circuit breakers, and fault injection." (Envoy)
- istiod does discovery, configuration and certificates. "Istiod provides service discovery, configuration and certificate management." (Istiod)
- It turns routing rules into Envoy config and pushes it at runtime. "Istiod converts high level routing rules that control traffic behavior into Envoy-specific configurations, and propagates them to the sidecars at runtime." (Istiod)
- Policy by service identity, not IP. "operators can enforce policies based on service identity rather than on relatively unstable layer 3 or layer 4 network identifiers." (Istiod)
- istiod is a certificate authority for mTLS. "Istiod acts as a Certificate Authority (CA) and generates certificates to allow secure mTLS communication in the data plane." (Istiod)

## Visuals worth redrawing

- The architecture diagram: pods with sidecars, istiod pushing config
  and certificates. Redrawn (with ambient mode alongside) in
  `service-mesh`.

## My notes

- This page describes sidecar mode; ambient mode is on its own page
  (istio-ambient-overview).

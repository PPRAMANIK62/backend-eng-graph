---
id: kubernetes-gateway-api
title: Gateway API (Kubernetes documentation)
author: The Kubernetes Authors
url: https://kubernetes.io/docs/concepts/services-networking/gateway/
kind: docs
primary: true
---

## Summary

The Kubernetes concept page for Gateway API (Kubernetes 1.37 docs), the
add-on that routes outside traffic into a cluster and succeeds Ingress.
Its API kinds are split by who manages what.

## Key claims

- What it is. "Gateway API is an add-on containing API kinds that provide dynamic infrastructure provisioning and advanced traffic routing." (intro)
- Role-oriented design. "Gateway API kinds are modeled after organizational roles that are responsible for managing Kubernetes service networking" (Design principles)
- It does what Ingress needed annotations for. "Gateway API kinds support functionality for common traffic routing use cases such as header-based matching, traffic weighting, and others that were only possible in Ingress by using custom annotations." (Design principles)
- One class per gateway. "A Gateway object is associated with exactly one GatewayClass; the GatewayClass describes the gateway controller responsible for managing Gateways of this class." (Resource model)
- It replaces Ingress. "Gateway API is the successor to the Ingress API." (Migrating from Ingress)

## Visuals worth redrawing

- The resource model: GatewayClass, Gateway, HTTPRoute, Service.

## My notes

- Kubernetes 1.37 docs.
